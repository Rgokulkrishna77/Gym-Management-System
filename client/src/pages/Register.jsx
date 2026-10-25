import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { authApi, plansApi } from '../api/services';
import { errorMessage } from '../api/axios';
import useFetch from '../hooks/useFetch';
import MemberFields from '../components/MemberFields';
import { Input } from '../components/FormControls';
import Icon from '../components/Icon';
import { formatCurrency, formatDate } from '../utils/format';
import { memberBase, passwordRule, planIdRule } from '../utils/schemas';

const schema = yup.object({
  ...memberBase,
  planId: planIdRule,
  password: passwordRule,
  confirmPassword: yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

export default function Register() {
  const [params] = useSearchParams();
  const { data: plans } = useFetch(() => plansApi.list());
  const [result, setResult] = useState(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { planId: '' },
  });

  // Pre-select the plan chosen on the landing page (?plan=2) once plans have loaded
  useEffect(() => {
    const wanted = params.get('plan');
    if (plans && wanted) setValue('planId', wanted);
  }, [plans, params, setValue]);

  const onSubmit = async ({ confirmPassword, ...payload }) => {
    try {
      const res = await authApi.register(payload);
      setResult(res.data);
      toast.success(res.message);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (result) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl" role="status">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Icon name="check" className="h-8 w-8" />
          </span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Registration successful!</h1>
          <p className="mt-1 text-slate-500">Welcome to IronCore, {result.name}.</p>
          <div className="my-6 rounded-xl bg-brand-50 p-4">
            <p className="text-sm text-slate-600">Your Member ID</p>
            <p className="text-3xl font-extrabold tracking-wider text-brand-700">{result.memberCode}</p>
          </div>
          <dl className="space-y-2 text-left text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Plan</dt><dd className="font-semibold">{result.planName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Valid</dt><dd className="font-semibold">{formatDate(result.startDate)} to {formatDate(result.expiryDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Fee</dt><dd className="font-semibold">{formatCurrency(result.amount)} ({result.paymentStatus})</dd></div>
          </dl>
          <p className="mt-4 text-xs text-slate-500">Please pay the fee at the reception desk. You can log in right away with your email and password.</p>
          <Link to="/login" className="btn btn-primary mt-6 w-full">Go to login</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-6 inline-block text-sm font-medium text-brand-600 hover:underline">&larr; Back to home</Link>
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Become a member</h1>
          <p className="mt-1 text-sm text-slate-500">Fill in your details and pick a plan. You will get a unique Member ID.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <MemberFields register={register} errors={errors} plans={plans || []} />
            <Input label="Confirm password" type="password" autoComplete="new-password"
              error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Already a member? <Link to="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
