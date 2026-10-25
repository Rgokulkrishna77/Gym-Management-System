import { useState } from 'react';
import toast from 'react-hot-toast';
import { membershipsApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Select } from '../../components/FormControls';
import { ErrorBox, PageHeader } from '../../components/ui';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../../utils/format';

// Members who self-registered online have a PENDING payment until they pay at the desk
export default function Payments() {
  const pending = useFetch(() => membershipsApi.pendingPayments());
  const [target, setTarget] = useState(null);
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    try {
      const res = await membershipsApi.markPaid(target.paymentId, method);
      toast.success(res.message);
      setTarget(null);
      pending.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'memberCode', header: 'Member ID' },
    { key: 'name', header: 'Name' },
    { key: 'planName', header: 'Plan' },
    { key: 'amount', header: 'Amount', render: (r) => formatCurrency(r.amount) },
    { key: 'paymentDate', header: 'Registered', render: (r) => formatDate(r.paymentDate) },
    { key: 'actions', header: 'Action', render: (r) => (
      <button className="btn btn-primary btn-sm" onClick={() => { setTarget(r); setMethod('cash'); }}>Mark as paid</button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Pending Payments" subtitle="Collect and record fees for members who registered online" />
      {pending.error ? <ErrorBox message={pending.error} onRetry={pending.reload} /> : (
        <DataTable columns={columns} data={pending.data} loading={pending.loading} rowKey="paymentId"
          searchKeys={['memberCode', 'name', 'planName']} emptyText="No pending payments" />
      )}

      <Modal open={!!target} onClose={() => setTarget(null)} title="Record payment" size="sm">
        <p className="text-sm text-slate-600">
          Collect <strong>{target && formatCurrency(target.amount)}</strong> from <strong>{target?.name}</strong> ({target?.memberCode}).
        </p>
        <div className="mt-4">
          <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </Select>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="btn btn-secondary" onClick={() => setTarget(null)} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={saving}>{saving ? 'Saving...' : 'Confirm payment'}</button>
        </div>
      </Modal>
    </>
  );
}
