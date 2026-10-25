import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import { initials } from '../utils/format';

// Sidebar links per role (each role only sees its own pages)
const NAV = {
  member: [
    { to: '/member', label: 'My Dashboard', icon: 'home', end: true },
    { to: '/member/workouts', label: 'My Workout Plan', icon: 'dumbbell' },
  ],
  trainer: [
    { to: '/trainer', label: 'Members & Workouts', icon: 'dumbbell', end: true },
  ],
  receptionist: [
    { to: '/reception/register', label: 'Register Member', icon: 'user' },
    { to: '/reception/renewals', label: 'Renewals', icon: 'refresh' },
    { to: '/reception/payments', label: 'Pending Payments', icon: 'credit' },
  ],
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'chart', end: true },
    { to: '/admin/members', label: 'Members', icon: 'users' },
    { to: '/admin/trainers', label: 'Trainers', icon: 'dumbbell' },
    { to: '/admin/plans', label: 'Plans & Fees', icon: 'tag' },
  ],
};

const ROLE_LABEL = { member: 'Member', trainer: 'Trainer', receptionist: 'Receptionist', admin: 'Administrator' };

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const link = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
      isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`;

  return (
    <div className="min-h-screen lg:flex">
      {/* Sidebar: off-canvas on mobile, fixed on desktop */}
      {open && <div className="fixed inset-0 z-30 bg-slate-900/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900 p-4 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Sidebar"
      >
        <Link to="/" className="mb-8 flex items-center gap-2 px-2 text-xl font-extrabold text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600"><Icon name="dumbbell" /></span>
          IronCore
        </Link>
        <nav className="flex-1 space-y-1" aria-label="Main">
          {NAV[user.role].map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={link} onClick={() => setOpen(false)}>
              <Icon name={item.icon} /> {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={handleLogout} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
          <Icon name="logout" /> Log out
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Icon name="menu" />
          </button>
          <p className="hidden text-sm text-slate-500 lg:block">Welcome back, <span className="font-semibold text-slate-800">{user.name}</span></p>
          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-semibold text-slate-800">{user.name}</p>
              <p className="text-xs text-slate-500">{ROLE_LABEL[user.role]}{user.memberCode ? ` · ${user.memberCode}` : ''}</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700" aria-hidden="true">
              {initials(user.name)}
            </span>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
