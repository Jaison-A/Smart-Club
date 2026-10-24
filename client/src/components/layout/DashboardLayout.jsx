import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';

// Small mobile-only strip with a hamburger button -- the Sidebar itself
// becomes a slide-in drawer below the sm breakpoint (see Sidebar.jsx),
// so this is the trigger to open it plus a backdrop to close it.
function MobileHeader() {
  const { setMobileOpen } = useSidebar();
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:hidden">
      <button
        onClick={() => setMobileOpen(true)}
        className="rounded-md p-1.5 text-ink hover:bg-primary/5"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <span className="font-display text-sm font-semibold text-ink">ClubHub</span>
    </div>
  );
}

function LayoutInner() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <div className="flex min-h-screen bg-canvas">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Nested layout route: React Router keeps this component mounted while
// only the <Outlet /> content swaps between child routes, so the
// sidebar never remounts/flickers when navigating within a role's
// section of the app.
export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
