import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { plansApi, trainersApi } from '../api/services';
import useFetch from '../hooks/useFetch';
import Icon from '../components/Icon';
import { ErrorBox, Spinner } from '../components/ui';
import { formatCurrency, initials, ROLE_HOME } from '../utils/format';

function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const links = [['Plans', '#plans'], ['Trainers', '#trainers'], ['Contact', '#contact']];
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600"><Icon name="dumbbell" /></span>
          IronCore
        </Link>
        <div className="hidden items-center gap-6 md:flex">
          {links.map(([l, h]) => <a key={h} href={h} className="text-sm font-medium text-slate-300 hover:text-white">{l}</a>)}
          {user ? (
            <Link to={ROLE_HOME[user.role]} className="btn btn-primary">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white">Log in</Link>
              <Link to="/register" className="btn btn-primary">Join now</Link>
            </>
          )}
        </div>
        <button className="rounded-md p-2 text-white md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          <Icon name={open ? 'x' : 'menu'} />
        </button>
      </nav>
      {open && (
        <div className="space-y-1 border-t border-white/10 px-4 pb-4 md:hidden">
          {links.map(([l, h]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block rounded-md px-3 py-2 text-slate-200 hover:bg-slate-800">{l}</a>)}
          {user
            ? <Link to={ROLE_HOME[user.role]} className="btn btn-primary mt-2 w-full">Dashboard</Link>
            : <div className="flex gap-2 pt-2"><Link to="/login" className="btn btn-secondary flex-1">Log in</Link><Link to="/register" className="btn btn-primary flex-1">Join now</Link></div>}
        </div>
      )}
    </header>
  );
}

function Hero() {
  const stats = [['Expert', 'trainers'], ['4', 'flexible plans'], ['24/7', 'support desk']];
  return (
    <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-2 md:py-28">
        <div>
          <p className="mb-3 inline-block rounded-full bg-brand-600/20 px-3 py-1 text-sm font-semibold text-brand-200">Train smarter. Live stronger.</p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">Your fitness journey starts at <span className="text-brand-400">IronCore</span></h1>
          <p className="mt-5 max-w-lg text-lg text-slate-300">Modern equipment, certified trainers and personalised workout plans you can follow from your own dashboard.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register" className="btn btn-primary px-6 py-3 text-base">Join now</Link>
            <a href="#plans" className="btn border border-white/30 px-6 py-3 text-base text-white hover:bg-white/10">View plans</a>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {stats.map(([a, b]) => (
            <div key={b} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <p className="text-3xl font-extrabold text-brand-400">{a}</p>
              <p className="mt-1 text-sm text-slate-300">{b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Plans() {
  const { data, loading, error, reload } = useFetch(() => plansApi.list());
  const best = data?.length ? Math.max(...data.map((p) => p.durationMonths)) : 0;
  return (
    <section id="plans" className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-center text-3xl font-extrabold text-slate-900">Membership plans</h2>
      <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Pick the plan that fits your routine. Renew any time at the reception.</p>
      <div className="mt-10">
        {loading && <Spinner />}
        {error && <ErrorBox message={error} onRetry={reload} />}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {(data || []).map((p) => (
            <div key={p.planId} className={`card flex flex-col ${p.durationMonths === best ? 'border-brand-500 ring-2 ring-brand-500/30' : ''}`}>
              {p.durationMonths === best && <span className="mb-2 w-fit rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-bold text-brand-700">Best value</span>}
              <h3 className="text-lg font-bold text-slate-900">{p.planName}</h3>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">{formatCurrency(p.fee)}</p>
              <p className="text-sm text-slate-500">for {p.durationMonths} month{p.durationMonths > 1 ? 's' : ''}</p>
              <p className="mt-4 flex-1 text-sm text-slate-600">{p.description}</p>
              <Link to={`/register?plan=${p.planId}`} className="btn btn-primary mt-6">Choose plan</Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Trainers() {
  const { data, loading, error, reload } = useFetch(() => trainersApi.list());
  return (
    <section id="trainers" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-extrabold text-slate-900">Meet our trainers</h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-slate-500">Experienced coaches who build plans around your goals.</p>
        <div className="mt-10">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} onRetry={reload} />}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(data || []).map((t) => (
              <div key={t.trainerId} className="card flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xl font-bold text-brand-700" aria-hidden="true">{initials(t.name)}</span>
                <div>
                  <h3 className="font-bold text-slate-900">{t.name}</h3>
                  <p className="text-sm text-slate-600">{t.specialization}</p>
                  <p className="text-xs text-slate-500">{t.experienceYears} years experience</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Contact() {
  const items = [
    ['IronCore Gym, 12 Fitness Lane, Trivandrum, Kerala', 'Visit us'],
    ['+91 90000 00000', 'Call us'],
    ['hello@ironcore.example', 'Email us'],
    ['Mon-Sat 5:30 AM - 10:00 PM, Sun 7:00 AM - 1:00 PM', 'Opening hours'],
  ];
  return (
    <section id="contact" className="mx-auto max-w-6xl px-4 py-20">
      <h2 className="text-center text-3xl font-extrabold text-slate-900">Contact us</h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(([value, label]) => (
          <div key={label} className="card text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">{label}</p>
            <p className="mt-2 text-slate-700">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Plans />
        <Trainers />
        <Contact />
      </main>
      <footer className="bg-slate-900 py-6 text-center text-sm text-slate-400">
        &copy; {new Date().getFullYear()} IronCore Gym. All rights reserved.
      </footer>
    </>
  );
}
