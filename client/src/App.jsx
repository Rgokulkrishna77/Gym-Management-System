import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

import MemberDashboard from './pages/member/Dashboard';
import MemberWorkouts from './pages/member/Workouts';
import TrainerMembers from './pages/trainer/Members';
import WorkoutEditor from './pages/trainer/WorkoutEditor';
import RegisterMember from './pages/reception/RegisterMember';
import Renewals from './pages/reception/Renewals';
import Payments from './pages/reception/Payments';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMembers from './pages/admin/Members';
import AdminTrainers from './pages/admin/Trainers';
import AdminPlans from './pages/admin/Plans';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Role-protected dashboards: each role can only open its own section */}
      <Route element={<ProtectedRoute roles={['member']} />}>
        <Route path="/member" element={<DashboardLayout />}>
          <Route index element={<MemberDashboard />} />
          <Route path="workouts" element={<MemberWorkouts />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['trainer']} />}>
        <Route path="/trainer" element={<DashboardLayout />}>
          <Route index element={<TrainerMembers />} />
          <Route path="workouts/:memberId" element={<WorkoutEditor />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['receptionist']} />}>
        <Route path="/reception" element={<DashboardLayout />}>
          <Route index element={<Navigate to="register" replace />} />
          <Route path="register" element={<RegisterMember />} />
          <Route path="renewals" element={<Renewals />} />
          <Route path="payments" element={<Payments />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute roles={['admin']} />}>
        <Route path="/admin" element={<DashboardLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<AdminMembers />} />
          <Route path="trainers" element={<AdminTrainers />} />
          <Route path="plans" element={<AdminPlans />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
