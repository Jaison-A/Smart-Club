import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentCertificates from '../pages/student/StudentCertificates';
import CoordinatorDashboard from '../pages/coordinator/CoordinatorDashboard';
import ApplicationsReview from '../pages/coordinator/ApplicationsReview';
import ClubMembers from '../pages/coordinator/ClubMembers';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminUsers from '../pages/admin/AdminUsers';
import ClubDirectory from '../pages/clubs/ClubDirectory';
import ClubDetails from '../pages/clubs/ClubDetails';
import CreateClub from '../pages/clubs/CreateClub';
import EditClub from '../pages/clubs/EditClub';
import ClubApprovals from '../pages/admin/ClubApprovals';
import RecruitmentPage from '../pages/recruitment/RecruitmentPage';
import ApplyToDrive from '../pages/recruitment/ApplyToDrive';
import CreateDrive from '../pages/recruitment/CreateDrive';
import EventsPage from '../pages/events/EventsPage';
import EventDetails from '../pages/events/EventDetails';
import CreateEvent from '../pages/events/CreateEvent';
import Settings from '../pages/settings/Settings';
import Invites from '../pages/invites/Invites';
import Profile from '../pages/profile/Profile';
import Notifications from '../pages/notifications/Notifications';
import MyApplications from '../pages/student/MyApplications';
import AdminUserDetail from '../pages/admin/AdminUserDetail';
import AdminClubs from '../pages/admin/AdminClubs';
import AdminClubManage from '../pages/admin/AdminClubManage';
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
          <Route path="/student" element={<ProtectedRoute roles={['student']} />}>
            <Route index element={<StudentDashboard />} />
          </Route>
          <Route path="/student/certificates" element={<ProtectedRoute roles={['student']} />}>
            <Route index element={<StudentCertificates />} />
          </Route>

          <Route path="/coordinator" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<CoordinatorDashboard />} />
          </Route>
          <Route path="/coordinator/members" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<ClubMembers />} />
          </Route>
          <Route path="/coordinator/applications/:driveId" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<ApplicationsReview />} />
          </Route>

          <Route path="/admin" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<AdminDashboard />} />
          </Route>
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<AdminUsers />} />
            <Route path=":id" element={<AdminUserDetail />} />
          </Route>
          <Route path="/admin/clubs" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<AdminClubs />} />
            <Route path=":slug" element={<AdminClubManage />} />
          </Route>
          <Route path="/admin/approvals" element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<ClubApprovals />} />
          </Route>

          {/* Shared across all logged-in roles */}
          <Route path="/clubs" element={<ClubDirectory />} />
          <Route path="/clubs/new" element={<CreateClub />} />
          <Route path="/clubs/:slug" element={<ClubDetails />} />
          <Route path="/clubs/:slug/edit" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<EditClub />} />
          </Route>

          <Route path="/recruitment" element={<RecruitmentPage />} />
          <Route path="/recruitment/new" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<CreateDrive />} />
          </Route>
          <Route path="/recruitment/:driveId/apply" element={<ProtectedRoute roles={['student']} />}>
            <Route index element={<ApplyToDrive />} />
          </Route>

          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/events/new" element={<ProtectedRoute roles={['coordinator', 'admin']} />}>
            <Route index element={<CreateEvent />} />
          </Route>

          <Route path="/settings" element={<Settings />} />
          <Route path="/invites" element={<Invites />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/applications" element={<ProtectedRoute roles={['student']} />}>
            <Route index element={<MyApplications />} />
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
