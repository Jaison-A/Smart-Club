import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

// Usage:
//   <Route element={<ProtectedRoute />}>...</Route>                    -> any logged-in user
//   <Route element={<ProtectedRoute roles={['admin']} />}>...</Route>  -> admin only
export default function ProtectedRoute({ roles }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner full label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    // Preserve where they were headed so login can send them back after.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
