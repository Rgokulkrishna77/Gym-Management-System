import { Link } from 'react-router-dom';
import { membersApi } from '../../api/services';
import useFetch from '../../hooks/useFetch';
import Icon from '../../components/Icon';
import { ErrorBox, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/format';

function Info({ label, children }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-1 text-lg font-bold text-slate-900">{children}</div>
    </div>
  );
}

export default function MemberDashboard() {
  const { data, loading, error, reload } = useFetch(() => membersApi.me());

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const { member, membership: ms } = data;
  return (
    <>
      <PageHeader title="My Dashboard" subtitle={`Member ID: ${member.memberCode}`} />

      {/* Expiry notification banner */}
      {ms?.expired && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <Icon name="alert" className="mt-0.5 h-6 w-6 shrink-0" />
          <div>
            <p className="font-bold">Your membership has expired</p>
            <p className="text-sm">It ended on {formatDate(ms.expiryDate)}. Please visit the reception desk to renew and keep training.</p>
          </div>
        </div>
      )}
      {ms && !ms.expired && ms.daysRemaining <= 7 && (
        <div role="status" className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
          <Icon name="alert" className="mt-0.5 h-6 w-6 shrink-0" />
          <p className="text-sm font-medium">Your membership expires in {ms.daysRemaining} day{ms.daysRemaining === 1 ? '' : 's'} ({formatDate(ms.expiryDate)}).</p>
        </div>
      )}

      {!ms ? (
        <div className="card text-slate-600">You do not have a membership yet. Please contact the reception desk.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Info label="Current plan">{ms.planName} <span className="text-sm font-medium text-slate-500">({formatCurrency(ms.fee)})</span></Info>
          <Info label="Membership status"><StatusBadge status={ms.expired ? 'expired' : 'active'} /></Info>
          <Info label="Payment status"><StatusBadge status={ms.paymentStatus || 'pending'} /></Info>
          <Info label="Joining date">{formatDate(member.joinDate)}</Info>
          <Info label="Expiry date">
            {formatDate(ms.expiryDate)}
            {!ms.expired && <span className="ml-2 text-sm font-medium text-slate-500">({ms.daysRemaining} days left)</span>}
          </Info>
          <Info label="Your trainer">{member.trainerName || <span className="text-slate-400">Not assigned yet</span>}</Info>
        </div>
      )}

      <div className="mt-8">
        <Link to="/member/workouts" className="btn btn-primary"><Icon name="dumbbell" className="h-4 w-4" /> View my workout plan</Link>
      </div>
    </>
  );
}
