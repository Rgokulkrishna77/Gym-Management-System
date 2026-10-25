import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { membersApi, plansApi, trainersApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import Modal, { ConfirmModal } from '../../components/Modal';
import MemberFields from '../../components/MemberFields';
import { Input, Select, Textarea } from '../../components/FormControls';
import Icon from '../../components/Icon';
import { ErrorBox, PageHeader, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';
import { memberBase, passwordRule, planIdRule } from '../../utils/schemas';

const createSchema = yup.object({
  ...memberBase,
  planId: planIdRule,
  password: passwordRule,
  paymentMethod: yup.string().oneOf(['cash', 'card', 'upi', 'online']).required(),
});

const editSchema = yup.object({
  ...memberBase,
  trainerId: yup.number().transform((v, o) => (o === '' ? null : v)).nullable(),
  password: yup.string().test('pw', 'Use at least 8 characters with a letter and a number',
    (v) => !v || (v.length >= 8 && /[A-Za-z]/.test(v) && /\d/.test(v))),
});

function CreateForm({ plans, onSaved, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(createSchema),
    defaultValues: { planId: '', paymentMethod: 'cash' },
  });
  const onSubmit = async (values) => {
    try {
      const res = await membersApi.create(values);
      toast.success(res.message);
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <MemberFields register={register} errors={errors} plans={plans} showPayment />
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Add member'}</button>
      </div>
    </form>
  );
}

function EditForm({ member, trainers, onSaved, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(editSchema),
    defaultValues: { ...member, trainerId: member.trainerId ?? '', password: '' },
  });
  const onSubmit = async (values) => {
    try {
      const res = await membersApi.update(member.memberId, values);
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
        <Input label="Age" type="number" min="12" max="100" error={errors.age?.message} {...register('age')} />
        <div className="sm:col-span-2"><Textarea label="Address" rows={2} error={errors.address?.message} {...register('address')} /></div>
        <Select label="Assigned trainer" {...register('trainerId')}>
          <option value="">No trainer</option>
          {trainers.map((t) => <option key={t.trainerId} value={t.trainerId}>{t.name}</option>)}
        </Select>
        <Input label="New password (optional)" type="password" autoComplete="new-password"
          hint="Leave blank to keep the current password" error={errors.password?.message} {...register('password')} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save changes'}</button>
      </div>
    </form>
  );
}

export default function AdminMembers() {
  const members = useFetch(() => membersApi.list());
  const { data: plans } = useFetch(() => plansApi.list());
  const { data: trainers } = useFetch(() => trainersApi.list());
  const [editing, setEditing] = useState(undefined); // undefined closed | null create | object edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const saved = () => { setEditing(undefined); members.reload(); };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const res = await membersApi.remove(deleting.memberId);
      toast.success(res.message);
      setDeleting(null);
      members.reload();
    } catch (e) {
      toast.error(errorMessage(e));
      setDeleting(null);
    } finally {
      setBusy(false);
    }
  };

  const columns = [
    { key: 'memberCode', header: 'Member ID' },
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone' },
    { key: 'planName', header: 'Plan', render: (r) => r.planName || '-' },
    { key: 'expiryDate', header: 'Expiry', render: (r) => formatDate(r.expiryDate) },
    { key: 'membershipStatus', header: 'Status', render: (r) => <StatusBadge status={r.membershipStatus} /> },
    { key: 'trainerName', header: 'Trainer', render: (r) => r.trainerName || '-' },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`}><Icon name="pencil" className="h-4 w-4" /></button>
        <button className="btn btn-secondary btn-sm text-red-600" onClick={() => setDeleting(r)} aria-label={`Delete ${r.name}`}><Icon name="trash" className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Members" subtitle="Add, edit, assign trainers or remove members"
        action={<button className="btn btn-primary" onClick={() => setEditing(null)}><Icon name="plus" className="h-4 w-4" /> Add member</button>} />
      {members.error ? <ErrorBox message={members.error} onRetry={members.reload} /> : (
        <DataTable columns={columns} data={members.data} loading={members.loading} rowKey="memberId"
          searchKeys={['memberCode', 'name', 'email', 'phone', 'planName', 'trainerName']} />
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? `Edit ${editing.name}` : 'Add member'} size="lg">
        {editing === null && <CreateForm plans={plans || []} onSaved={saved} onCancel={() => setEditing(undefined)} />}
        {editing && <EditForm member={editing} trainers={trainers || []} onSaved={saved} onCancel={() => setEditing(undefined)} />}
      </Modal>
      <ConfirmModal open={!!deleting} loading={busy} onClose={() => setDeleting(null)} onConfirm={confirmDelete}
        message={`Permanently delete ${deleting?.name} (${deleting?.memberCode})? Their memberships, payments and workout plans will also be removed.`} />
    </>
  );
}
