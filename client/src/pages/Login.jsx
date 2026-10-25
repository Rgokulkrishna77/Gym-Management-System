import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/FormControls';
import Icon from '../components/Icon';
import { errorMessage } from '../api/axios';
import { ROLE_HOME } from '../utils/format';

const schema = yup.object({
  email: yup.string().trim().email('Enter a valid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: yupResolver(schema) });

  if (user) return <Navigate to={ROLE_HOME[user.role]} replace />;

  const onSubmit = async ({ email, password }) => {
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name}!`);
      // Go back to the page the user tried to open, but only if their role may see it
      const from = location.state?.from?.pathname;
      navigate(from && from.startsWith(ROLE_HOME[u.role]) ? from : ROLE_HOME[u.role], { replace: true });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-2xl font-extrabold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600"><Icon name="dumbbell" /></span>
          IronCore
        </Link>
        <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8">
          <h1 className="text-2xl font-bold text-slate-900">Log in</h1>
          <p className="mt-1 text-sm text-slate-500">Access your member, trainer or staff dashboard.</p>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <Input label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Log in'}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            New here? <Link to="/register" className="font-semibold text-brand-600 hover:underline">Join the gym</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
