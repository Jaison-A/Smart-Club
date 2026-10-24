import { NavLink } from 'react-router-dom';
import { GraduationCap, LogOut, Settings as SettingsIcon, X } from 'lucide-react';
import { navByRole } from '../../config/nav';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const items = navByRole[user?.role] || [];

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 shrink-0 flex-col bg-sidebar text-ink-inverse
        transition-transform duration-200 ease-in-out
        sm:static sm:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-accent p-1.5 text-primary">
            <GraduationCap size={20} strokeWidth={2.25} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">ClubHub</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-md p-1 text-white/70 hover:bg-white/10 sm:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${user?.role}`}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border-l-4 px-3 py-2.5 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'border-accent bg-white/10 text-white'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="flex items-center gap-3 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs capitalize text-white/50">{user?.role}</p>
          </div>
        </div>
        <NavLink
          to="/settings"
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <SettingsIcon size={18} strokeWidth={2} />
          Settings
        </NavLink>
        <button
          onClick={logout}
          className="mt-1 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut size={18} strokeWidth={2} />
          Log out
        </button>
      </div>
    </aside>
  );
}
