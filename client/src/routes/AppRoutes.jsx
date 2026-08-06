import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import StudentDashboard from '../pages/student/StudentDashboard';
import CoordinatorDashboard from '../pages/coordinator/CoordinatorDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ClubDirectory from '../pages/clubs/ClubDirectory';
import ClubDetails from '../pages/clubs/ClubDetails';
import RecruitmentPage from '../pages/recruitment/RecruitmentPage';
import ApplyToDrive from '../pages/recruitment/ApplyToDrive';
import { useAuth } from '../context/AuthContext';

export default function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Public auth routes — redirect away if already logged in */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to={`/${user.role}`} replace /> : <Register />}
      />

      {/* Everything below requires a logged-in user, and shares the persistent-sidebar layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route
            path="/student"
            element={
              <ProtectedRoute roles={['student']} />
            }
          >
            <Route index element={<StudentDashboard />} />
          </Route>

          <Route path="/coordinator" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<CoordinatorDashboard />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<AdminDashboard />} />
          </Route>

          {/* Shared across all logged-in roles */}
          <Route path="/clubs" element={<ClubDirectory />} />
          <Route path="/clubs/:slug" element={<ClubDetails />} />
          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route
            path="/recruitment/:driveId/apply"
            element={<ProtectedRoute roles={['student']} />}
          >
            <Route index element={<ApplyToDrive />} />
          </Route>
        </Route>
      </Route>

      {/* Fallback */}
      <Route
        path="/"
        element={<Navigate to={isAuthenticated ? `/${user.role}` : '/login'} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
