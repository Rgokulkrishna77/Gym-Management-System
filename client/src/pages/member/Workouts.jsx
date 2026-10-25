import { workoutsApi } from '../../api/services';
import useFetch from '../../hooks/useFetch';
import { EmptyState, ErrorBox, PageHeader, Spinner } from '../../components/ui';
import { formatDate, formatDateTime } from '../../utils/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function MemberWorkouts() {
  const { data, loading, error, reload } = useFetch(() => workoutsApi.mine());

  return (
    <>
      <PageHeader title="My Workout Plan" subtitle="Plans created for you by your trainer" />
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState>No workout plan has been assigned to you yet. Ask your trainer to create one.</EmptyState>}

      <div className="space-y-6">
        {(data || []).map((plan) => (
          <article key={plan.workoutId} className="card">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{plan.title}</h2>
                <p className="text-sm text-slate-500">
                  {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
                  {plan.trainerName && <> &middot; by {plan.trainerName}</>}
                </p>
              </div>
              <p className="text-xs text-slate-400">Updated {formatDateTime(plan.updatedAt)}</p>
            </div>
            {plan.description && <p className="mt-3 whitespace-pre-line text-sm text-slate-600">{plan.description}</p>}

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DAYS.filter((d) => plan.items.some((i) => i.day === d)).map((d) => (
                <div key={d} className="rounded-lg border border-slate-200 p-3">
                  <h3 className="mb-2 text-sm font-bold text-brand-700">{d}</h3>
                  <ul className="space-y-1 text-sm">
                    {plan.items.filter((i) => i.day === d).map((i) => (
                      <li key={i.itemId} className="flex justify-between gap-2">
                        <span className="text-slate-800">{i.exerciseName}</span>
                        <span className="shrink-0 text-slate-500">{i.sets} × {i.reps}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
