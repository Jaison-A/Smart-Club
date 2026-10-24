import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import BrandLogo from '../ui/BrandLogo';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';

// Mobile-only strip with the hamburger that opens the Sidebar drawer.
function MobileHeader() {
  const { setMobileOpen } = useSidebar();
  return (
    <div className="flex items-center gap-3 border-b border-border bg-surface px-4 py-3 sm:hidden">
      <button onClick={() => setMobileOpen(true)} className="rounded-md p-1.5 text-ink hover:bg-primary/5" aria-label="Open menu">
        <Menu size={22} />
      </button>
      <BrandLogo size="sm" onDark={false} />
    </div>
  );
}

function LayoutInner() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  return (
    <div className="min-h-screen bg-canvas">
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/50 sm:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}
      <Sidebar />
      {/* The sidebar is position:fixed (out of normal flow), so this left
          padding reserves its width -- that is what keeps it visually pinned
          while this pane scrolls on its own. */}
      <div className="flex min-h-screen min-w-0 flex-col sm:pl-64">
        <MobileHeader />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Nested layout route: stays mounted while only <Outlet /> swaps.
export default function DashboardLayout() {
  return (
    <SidebarProvider>
      <LayoutInner />
    </SidebarProvider>
  );
}
