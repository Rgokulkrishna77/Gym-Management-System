import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { plansApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import Modal, { ConfirmModal } from '../../components/Modal';
import { Input, Textarea } from '../../components/FormControls';
import Icon from '../../components/Icon';
import { ErrorBox, PageHeader } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

const schema = yup.object({
  planName: yup.string().trim().min(2, 'Plan name is too short').max(60).required('Plan name is required'),
  durationMonths: yup.number().typeError('Enter the duration in months').integer('Whole months only').min(1, 'Minimum 1 month').max(60, 'Maximum 60 months').required(),
  fee: yup.number().typeError('Enter the fee').positive('Fee must be greater than 0').required('Fee is required'),
  description: yup.string().trim().max(255, 'Max 255 characters'),
});

function PlanForm({ plan, onSaved, onCancel }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: plan ? { ...plan, description: plan.description || '' } : { planName: '', durationMonths: 1, fee: '', description: '' },
  });

  const onSubmit = async (values) => {
    try {
      const res = plan ? await plansApi.update(plan.planId, values) : await plansApi.create(values);
      toast.success(res.message);
      onSaved();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Input label="Plan name" error={errors.planName?.message} {...register('planName')} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Duration (months)" type="number" min="1" error={errors.durationMonths?.message} {...register('durationMonths')} />
        <Input label="Fee (₹)" type="number" min="0" step="0.01" error={errors.fee?.message} {...register('fee')} />
      </div>
      <Textarea label="Description" rows={2} error={errors.description?.message} {...register('description')} />
      <div className="flex justify-end gap-3">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save plan'}</button>
      </div>
    </form>
  );
}

export default function AdminPlans() {
  const { data, loading, error, reload } = useFetch(() => plansApi.list());
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const saved = () => { setEditing(undefined); reload(); };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      const res = await plansApi.remove(deleting.planId);
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
    { key: 'planName', header: 'Plan' },
    { key: 'durationMonths', header: 'Duration', render: (r) => `${r.durationMonths} month${r.durationMonths > 1 ? 's' : ''}` },
    { key: 'fee', header: 'Fee', render: (r) => formatCurrency(r.fee) },
    { key: 'description', header: 'Description', sortable: false },
    { key: 'actions', header: 'Actions', render: (r) => (
      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => setEditing(r)} aria-label={`Edit ${r.planName}`}><Icon name="pencil" className="h-4 w-4" /></button>
        <button className="btn btn-secondary btn-sm text-red-600" onClick={() => setDeleting(r)} aria-label={`Delete ${r.planName}`}><Icon name="trash" className="h-4 w-4" /></button>
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader title="Plans & Fees" subtitle="Changes appear on the landing page immediately"
        action={<button className="btn btn-primary" onClick={() => setEditing(null)}><Icon name="plus" className="h-4 w-4" /> Add plan</button>} />
      {error ? <ErrorBox message={error} onRetry={reload} /> : (
        <DataTable columns={columns} data={data} loading={loading} rowKey="planId" searchKeys={['planName', 'description']} />
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? 'Edit plan' : 'Add plan'}>
        {editing !== undefined && <PlanForm plan={editing} onSaved={saved} onCancel={() => setEditing(undefined)} />}
      </Modal>
      <ConfirmModal open={!!deleting} loading={busy} onClose={() => setDeleting(null)} onConfirm={confirmDelete}
        message={`Delete the "${deleting?.planName}" plan? Plans that members have already purchased cannot be deleted.`} />
    </>
  );
}
