import { useState } from 'react';
import toast from 'react-hot-toast';
import { membershipsApi, plansApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { Select } from '../../components/FormControls';
import Icon from '../../components/Icon';
import { ErrorBox, PageHeader } from '../../components/ui';
import { formatCurrency, formatDate, PAYMENT_METHODS } from '../../utils/format';

export default function Renewals() {
  const expired = useFetch(() => membershipsApi.expired());
  const { data: plans } = useFetch(() => plansApi.list());

  const [target, setTarget] = useState(null);     // member being renewed
  const [planId, setPlanId] = useState('');
  const [method, setMethod] = useState('cash');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);         // renewal confirmation

  const open = (row) => { setTarget(row); setPlanId(String(row.planId)); setMethod('cash'); setDone(null); };
  const close = () => { setTarget(null); setDone(null); };
  const selectedPlan = (plans || []).find((p) => String(p.planId) === planId);

  const renew = async () => {
    setSaving(true);
    try {
      const res = await membershipsApi.renew({ memberId: target.memberId, planId: Number(planId), method });
      setDone(res.data);
      toast.success(res.message);
      expired.reload(); // renewed member disappears from the expired list
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    { key: 'memberCode', header: 'Member ID' },
    { key: 'name', header: 'Name' },
    { key: 'phone', header: 'Phone' },
    { key: 'planName', header: 'Last plan' },
    { key: 'expiryDate', header: 'Expired on', render: (r) => formatDate(r.expiryDate) },
    { key: 'daysExpired', header: 'Days ago' },
    { key: 'actions', header: 'Action', render: (r) => (
      <button className="btn btn-primary btn-sm" onClick={() => open(r)}><Icon name="refresh" className="h-4 w-4" /> Renew</button>
    ) },
  ];

  return (
    <>
      <PageHeader title="Membership Renewals" subtitle="Members whose latest membership has expired" />
      {expired.error ? <ErrorBox message={expired.error} onRetry={expired.reload} /> : (
        <DataTable columns={columns} data={expired.data} loading={expired.loading} rowKey="memberId"
          searchKeys={['memberCode', 'name', 'phone', 'planName']} emptyText="No expired memberships - great!" />
      )}

      <Modal open={!!target} onClose={close} title={done ? 'Renewal confirmed' : `Renew membership - ${target?.name}`}>
        {done ? (
          <div className="text-center" role="status">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" className="h-8 w-8" /></span>
            <p className="mt-3 font-semibold text-slate-900">{done.name} ({done.memberCode}) has been renewed.</p>
            <dl className="mt-4 space-y-2 text-left text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Plan</dt><dd className="font-semibold">{done.planName}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">New period</dt><dd className="font-semibold">{formatDate(done.startDate)} to {formatDate(done.expiryDate)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Payment recorded</dt><dd className="font-semibold">{formatCurrency(done.amount)} via {done.method}</dd></div>
            </dl>
            <button className="btn btn-primary mt-6 w-full" onClick={close}>Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <Select label="Plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {(plans || []).map((p) => <option key={p.planId} value={p.planId}>{p.planName} - {formatCurrency(p.fee)} / {p.durationMonths} mo</option>)}
            </Select>
            <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            {selectedPlan && (
              <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                Amount to collect: <strong>{formatCurrency(selectedPlan.fee)}</strong>. The new expiry date is calculated automatically
                ({selectedPlan.durationMonths} month{selectedPlan.durationMonths > 1 ? 's' : ''} from today).
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button className="btn btn-secondary" onClick={close} disabled={saving}>Cancel</button>
              <button className="btn btn-primary" onClick={renew} disabled={saving || !planId}>{saving ? 'Renewing...' : 'Confirm renewal & payment'}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
