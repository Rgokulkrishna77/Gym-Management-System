import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useFieldArray, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { membersApi, workoutsApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import { Input, Select, Textarea } from '../../components/FormControls';
import Icon from '../../components/Icon';
import { EmptyState, ErrorBox, PageHeader, Spinner, StatusBadge } from '../../components/ui';
import { addDaysISO, formatDate, todayISO } from '../../utils/format';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const blankItem = { exerciseName: '', sets: 3, reps: 10, day: 'Mon' };
const blankForm = () => ({ title: '', description: '', startDate: todayISO(), endDate: addDaysISO(28), items: [{ ...blankItem }] });

const schema = yup.object({
  title: yup.string().trim().min(3, 'Title is too short').max(120).required('Title is required'),
  description: yup.string().trim().max(2000),
  startDate: yup.string().required('Start date is required'),
  endDate: yup.string().required('End date is required')
    .test('after', 'End date must be on or after the start date', function check(v) { return !v || !this.parent.startDate || v >= this.parent.startDate; }),
  items: yup.array().min(1, 'Add at least one exercise').of(yup.object({
    exerciseName: yup.string().trim().min(2, 'Enter the exercise').required('Enter the exercise'),
    sets: yup.number().typeError('Sets?').integer().min(1, 'Min 1').max(20, 'Max 20').required(),
    reps: yup.number().typeError('Reps?').integer().min(1, 'Min 1').max(500, 'Max 500').required(),
    day: yup.string().oneOf(DAYS).required(),
  })),
});

export default function WorkoutEditor() {
  const { memberId } = useParams();
  const member = useFetch(() => membersApi.get(memberId), [memberId]);
  const plans = useFetch(() => workoutsApi.forMember(memberId), [memberId]);
  const [editingId, setEditingId] = useState(null); // null = creating a new plan

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: blankForm(),
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => { reset(blankForm()); setEditingId(null); }, [memberId, reset]);

  const startEdit = (plan) => {
    setEditingId(plan.workoutId);
    reset({
      title: plan.title,
      description: plan.description || '',
      startDate: plan.startDate,
      endDate: plan.endDate,
      items: plan.items.map(({ exerciseName, sets, reps, day }) => ({ exerciseName, sets, reps, day })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startNew = () => { setEditingId(null); reset(blankForm()); };

  const onSubmit = async (values) => {
    const payload = { ...values, memberId: Number(memberId) };
    try {
      if (editingId) await workoutsApi.update(editingId, payload);
      else await workoutsApi.create(payload);
      toast.success(editingId ? 'Workout plan updated' : 'Workout plan saved - the member can now view it');
      startNew();
      plans.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (member.loading) return <Spinner />;
  if (member.error) return <ErrorBox message={member.error} onRetry={member.reload} />;
  const m = member.data;

  return (
    <>
      <Link to="/trainer" className="mb-4 inline-block text-sm font-medium text-brand-600 hover:underline">&larr; Back to members</Link>
      <PageHeader title={`Workout plan: ${m.name}`}
        subtitle={`${m.memberCode} · ${m.planName || 'No plan'} · expires ${formatDate(m.expiryDate)}`}
        action={<StatusBadge status={m.membershipStatus} />} />

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{editingId ? 'Update workout plan' : 'New workout plan'}</h2>
          {editingId && <button type="button" className="btn btn-secondary btn-sm" onClick={startNew}>Cancel edit</button>}
        </div>
        <Input label="Plan title" placeholder="e.g. 4-week strength block" error={errors.title?.message} {...register('title')} />
        <Textarea label="Notes / description" error={errors.description?.message} {...register('description')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Start date" type="date" error={errors.startDate?.message} {...register('startDate')} />
          <Input label="End date" type="date" error={errors.endDate?.message} {...register('endDate')} />
        </div>

        <fieldset>
          <legend className="label">Exercises</legend>
          <div className="space-y-3">
            {fields.map((f, i) => (
              <div key={f.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 sm:grid-cols-[1fr_90px_90px_110px_auto] sm:items-start">
                <Input label="Exercise" placeholder="Barbell squat" error={errors.items?.[i]?.exerciseName?.message} {...register(`items.${i}.exerciseName`)} />
                <Input label="Sets" type="number" min="1" error={errors.items?.[i]?.sets?.message} {...register(`items.${i}.sets`)} />
                <Input label="Reps" type="number" min="1" error={errors.items?.[i]?.reps?.message} {...register(`items.${i}.reps`)} />
                <Select label="Day" {...register(`items.${i}.day`)}>
                  {DAYS.map((d) => <option key={d}>{d}</option>)}
                </Select>
                <button type="button" className="btn btn-secondary btn-sm sm:mt-7" onClick={() => remove(i)} disabled={fields.length === 1} aria-label={`Remove exercise ${i + 1}`}>
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {errors.items?.message && <p role="alert" className="mt-1 text-xs font-medium text-red-600">{errors.items.message}</p>}
          <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => append({ ...blankItem })}>
            <Icon name="plus" className="h-4 w-4" /> Add exercise
          </button>
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : editingId ? 'Update plan' : 'Save plan'}
        </button>
      </form>

      <h2 className="mb-3 mt-10 text-lg font-bold text-slate-900">Existing plans</h2>
      {plans.loading && <Spinner />}
      {plans.error && <ErrorBox message={plans.error} onRetry={plans.reload} />}
      {plans.data?.length === 0 && <EmptyState>No plans yet for this member.</EmptyState>}
      <div className="space-y-3">
        {(plans.data || []).map((p) => (
          <div key={p.workoutId} className={`card flex flex-wrap items-center justify-between gap-3 ${editingId === p.workoutId ? 'border-brand-500' : ''}`}>
            <div>
              <p className="font-semibold text-slate-900">{p.title}</p>
              <p className="text-sm text-slate-500">{formatDate(p.startDate)} to {formatDate(p.endDate)} · {p.items.length} exercises</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => startEdit(p)}><Icon name="pencil" className="h-4 w-4" /> Edit</button>
          </div>
        ))}
      </div>
    </>
  );
}
