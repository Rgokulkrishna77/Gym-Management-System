import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { trainersApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import Modal, { ConfirmModal } from '../../components/Modal';
import { Input } from '../../components/FormControls';
import Icon from '../../components/Icon';
import { ErrorBox, PageHeader } from '../../components/ui';
import { emailRule, passwordRule, phoneRule } from '../../utils/schemas';

const base = {
  name: yup.string().trim().min(2, 'Name is too short').max(100).required('Name is required'),
  phone: phoneRule,
  email: emailRule,
  specialization: yup.string().trim().min(2, 'Enter a specialization').max(100).required('Specialization is required'),
  experienceYears: yup.number().typeError('Enter years of experience').integer('Whole years only').min(0).max(60, 'Maximum 60').required(),
};
const createSchema = yup.object({ ...base, password: passwordRule });
// when editing, the password is optional (blank = keep the current one)
const editSchema = yup.object({
  ...base,
  password: yup.string().test('pw', 'Use at least 8 characters with a letter and a number',
    (v) => !v || (v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v))),
});

function TrainerForm({ trainer, onSaved, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(trainer ? editSchema : createSchema),
    defaultValues: trainer ? { ...trainer, password: '' } : { experienceYears: 0 },
  });

  const onSubmit = async (values) => {
    try {
      const res = trainer ? await trainersApi.update(trainer.trainerId, values) : await trainersApi.create(values);
      toast.success(res.message);
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Full name" error={errors.name?.message} {...register('name')} />
        <Input label="Phone" type="tel" error={errors.phone?.message} {...register('phone')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Experience (years)" type="number" min="0" error={errors.experienceYears?.message} {...register('experienceYears')} />
        <Input label="Specialization" error={errors.specialization?.message} {...register('specialization')} />
        <Input label={trainer ? 'New password (optional)' : 'Password'} type="password" autoComplete="new-password"
          hint={trainer ? 'Leave blank to keep the current password' : 'Min 8 chars, letter + number'}
          error={errors.password?.message} {...register('password')} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save trainer'}</button>
      </div>
    </form>
  );
}

export default function AdminTrainers() {
  const { data, loading, error, reload } = useFetch(() => trainersApi.list());
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const saved = () => { setEditing(undefined); reload(); };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const res = await trainersApi.remove(deleting.trainerId);
      toast.success(res.message);
      setDeleting(null);
      reload();
    } catch (e) {
      toast.error(errorMessage(e));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'specialization', header: 'Specialization' },
    { key: 'experienceYears', header: 'Experience', render: (r) => `${r.experienceYears} yrs` },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}><Icon name="pencil" className="h-4 w-4" /></button>
        <button className="btn btn-secondary btn-sm text-red-600" onClick={() => setDeleting(r)} aria-label={`Delete ${r.name}`}><Icon name="trash" className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Trainers" subtitle="Add, edit or remove trainer accounts"
        action={<button className="btn btn-primary" onClick={() => setEditing(null)}><Icon name="plus" className="h-4 w-4" /> Add trainer</button>} />
      {error ? <ErrorBox message={error} onRetry={reload} /> : (
        <DataTable columns={columns} data={data} loading={loading} rowKey="trainerId" searchKeys={['name', 'email', 'phone', 'specialization']} />
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit trainer' : 'Add trainer'} size="lg">
        {editing !== undefined && <TrainerForm trainer={editing} onSaved={saved} onCancel={() => setEditing(undefined)} />}
      </Modal>
      <ConfirmModal open={!!deleting} loading={busy} onClose={() => setDeleting(null)} onConfirm={confirmDelete}
        message={`Delete trainer ${deleting?.name}? Their login is removed and their members become unassigned.`} />
    </>
  );
}
