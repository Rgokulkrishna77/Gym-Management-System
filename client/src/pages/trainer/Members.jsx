import { useNavigate } from 'react-router-dom';
import { membersApi } from '../../api/services';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import { ErrorBox, PageHeader, StatusBadge } from '../../components/ui';
import { formatDate } from '../../utils/format';

export default function TrainerMembers() {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useFetch(() => membersApi.list());

  const columns = [
    { key: 'memberCode', header: 'Member ID' },
    { key: 'name', header: 'Name' },
    { key: 'planName', header: 'Plan' },
    { key: 'expiryDate', header: 'Expiry', render: (r) => formatDate(r.expiryDate) },
    { key: 'membershipStatus', header: 'Status', render: (r) => <StatusBadge status={r.membershipStatus} /> },
    { key: 'trainerName', header: 'Trainer', render: (r) => r.trainerName || '-' },
    {
      key: 'actions', header: 'Workout plan',
      render: (r) => (
        <button className="btn btn-primary btn-sm" onClick={() => navigate(`/trainer/workouts/${r.memberId}`)}>
          Create / update
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Members & Workouts" subtitle="Select a registered member to create or update their workout plan" />
      {error ? <ErrorBox message={error} onRetry={reload} /> : (
        <DataTable columns={columns} data={data} loading={loading} rowKey="memberId"
          searchKeys={['memberCode', 'name', 'planName', 'email']} />
      )}
    </>
  );
}
