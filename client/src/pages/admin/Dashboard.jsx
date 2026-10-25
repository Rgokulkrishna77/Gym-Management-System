import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { statsApi } from '../../api/services';
import useFetch from '../../hooks/useFetch';
import { ErrorBox, PageHeader, Spinner, StatCard } from '../../components/ui';
import { formatCurrency } from '../../utils/format';

const BRAND = '#c2410c';
const GREEN = '#059669';
const RED = '#dc2626';

const monthLabel = (ym) => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

export default function AdminDashboard() {
  const { data, loading, error, reload } = useFetch(() => statsApi.dashboard());
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const status = [
    { name: 'Active', value: data.activeMemberships, color: GREEN },
    { name: 'Expired', value: data.expiredMemberships, color: RED },
  ];
  const revenue = data.revenueByMonth.map((r) => ({ ...r, label: monthLabel(r.month) }));

  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Live overview of the gym" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total members" value={data.totalMembers} icon="users" />
        <StatCard label="Active memberships" value={data.activeMemberships} icon="check" tone="green" />
        <StatCard label="Expired memberships" value={data.expiredMemberships} icon="alert" tone="red" />
        <StatCard label="Revenue this month" value={formatCurrency(data.monthlyRevenue)} icon="credit" tone="blue" />
        <StatCard label="Trainers" value={data.trainerCount} icon="dumbbell" tone="slate" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card lg:col-span-2" aria-label="Monthly revenue chart">
          <h2 className="mb-4 font-bold text-slate-900">Monthly revenue (last 6 months)</h2>
          {revenue.length === 0 ? <p className="py-10 text-center text-sm text-slate-500">No paid payments yet.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tickLine={false} />
                <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Bar dataKey="revenue" name="Revenue" fill={BRAND} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </section>

        <section className="card" aria-label="Active versus expired memberships chart">
          <h2 className="mb-4 font-bold text-slate-900">Active vs expired</h2>
          {data.activeMemberships + data.expiredMemberships === 0 ? <p className="py-10 text-center text-sm text-slate-500">No memberships yet.</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={status} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {status.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="mb-3 font-bold text-slate-900">Members by current plan</h2>
        {data.planDistribution.length === 0 ? <p className="text-sm text-slate-500">No data yet.</p> : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.planDistribution.map((p) => (
              <li key={p.name} className="rounded-lg bg-slate-50 p-3">
                <p className="text-sm text-slate-500">{p.name}</p>
                <p className="text-xl font-bold text-slate-900">{p.count}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
