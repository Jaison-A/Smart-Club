import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// Nested layout route: React Router keeps this component mounted while
// only the <Outlet /> content swaps between child routes, so the
// sidebar never remounts/flickers when navigating within a role's
// section of the app.
export default function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
