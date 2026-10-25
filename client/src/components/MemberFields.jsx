import { Input, Select, Textarea } from './FormControls';
import { formatCurrency, PAYMENT_METHODS } from '../utils/format';

// Shared registration fields (public sign-up, receptionist form, admin "add member").
// Pass react-hook-form's `register` and `errors`.
export default function MemberFields({ register, errors, plans = [], showPayment = false }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input label="Full name" autoComplete="name" error={errors.name?.message} {...register('name')} />
      <Input label="Phone" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
      <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
      <Input label="Age" type="number" min="12" max="100" error={errors.age?.message} {...register('age')} />
      <div className="sm:col-span-2">
        <Textarea label="Address" rows={2} error={errors.address?.message} {...register('address')} />
      </div>
      <Select label="Membership plan" error={errors.planId?.message} {...register('planId')}>
        <option value="">Select a plan</option>
        {plans.map((p) => (
          <option key={p.planId} value={p.planId}>{p.planName} - {formatCurrency(p.fee)}</option>
        ))}
      </Select>
      {showPayment && (
        <Select label="Payment method" error={errors.paymentMethod?.message} {...register('paymentMethod')}>
          {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </Select>
      )}
      <Input label="Password" type="password" autoComplete="new-password"
        hint="Member will use this to log in (min 8 chars, letter + number)"
        error={errors.password?.message} {...register('password')} />
    </div>
  );
}
