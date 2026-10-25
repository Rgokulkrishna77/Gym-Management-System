import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { membersApi, plansApi } from '../../api/services';
import { errorMessage } from '../../api/axios';
import useFetch from '../../hooks/useFetch';
import MemberFields from '../../components/MemberFields';
import Icon from '../../components/Icon';
import { PageHeader } from '../../components/ui';
import { formatCurrency, formatDate } from '../../utils/format';
import { memberBase, passwordRule, planIdRule } from '../../utils/schemas';

const schema = yup.object({
  ...memberBase,
  planId: planIdRule,
  password: passwordRule,
  paymentMethod: yup.string().oneOf(['cash', 'card', 'upi', 'online']).required('Select a payment method'),
});

export default function RegisterMember() {
  const { data: plans } = useFetch(() => plansApi.list());
  const [result, setResult] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { planId: '', paymentMethod: 'cash' },
  });

  const onSubmit = async (values) => {
    try {
      const res = await membersApi.create(values);
      setResult(res.data);
      toast.success(res.message);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const another = () => { setResult(null); reset({ planId: '', paymentMethod: 'cash' }); };

  if (result) {
    return (
      <>
        <PageHeader title="Register Member" />
        <div className="card mx-auto max-w-lg text-center" role="status">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><Icon name="check" className="h-8 w-8" /></span>
          <h2 className="mt-4 text-xl font-bold text-slate-900">Member registered</h2>
          <div className="my-5 rounded-xl bg-brand-50 p-4">
            <p className="text-sm text-slate-600">Member ID</p>
            <p className="text-3xl font-extrabold tracking-wider text-brand-700">{result.memberCode}</p>
          </div>
          <dl className="space-y-2 text-left text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd className="font-semibold">{result.name}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Plan</dt><dd className="font-semibold">{result.planName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Expiry date</dt><dd className="font-semibold">{formatDate(result.expiryDate)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Payment</dt><dd className="font-semibold">{formatCurrency(result.amount)} (paid)</dd></div>
          </dl>
          <button className="btn btn-primary mt-6" onClick={another}>Register another member</button>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Register Member" subtitle="Creates the account, a unique Member ID, the membership and the payment record" />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="card max-w-3xl space-y-4">
        <MemberFields register={register} errors={errors} plans={plans || []} showPayment />
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register & record payment'}
        </button>
      </form>
    </>
  );
}
