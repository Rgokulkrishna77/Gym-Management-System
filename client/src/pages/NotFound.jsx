import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-6xl font-extrabold text-brand-600">404</p>
      <h1 className="text-xl font-bold text-slate-900">Page not found</h1>
      <p className="text-slate-500">The page you are looking for does not exist.</p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </main>
  );
}
