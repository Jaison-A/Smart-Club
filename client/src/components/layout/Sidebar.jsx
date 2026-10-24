import { NavLink } from 'react-router-dom';
import { LogOut, Settings as SettingsIcon, UserCircle, X } from 'lucide-react';
import { navByRole } from '../../config/nav';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import BrandLogo from '../ui/BrandLogo';
import Avatar from '../ui/Avatar';

const linkBase = 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors';
const linkIdle = 'text-white/70 hover:bg-white/5 hover:text-white';

// `fixed` at EVERY viewport size (DashboardLayout reserves its width with
// left padding), so it stays pinned while page content scrolls. Below the sm
// breakpoint it becomes a slide-in drawer instead.
export default function Sidebar() {
  const { user, logout } = useAuth();
  const { mobileOpen, setMobileOpen } = useSidebar();
  const items = navByRole[user?.role] || [];
  const close = () => setMobileOpen(false);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col border-r border-white/5 bg-sidebar text-ink-inverse transition-transform duration-200 ease-in-out sm:translate-x-0 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-between px-5 py-5">
        <BrandLogo size="md" />
        <button onClick={close} className="rounded-md p-1 text-white/70 hover:bg-white/10 sm:hidden" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === `/${user?.role}`} onClick={close} className={({ isActive }) => `${linkBase} ${isActive ? 'nav-active' : linkIdle}`}>
            <Icon size={18} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        <NavLink to="/profile" onClick={close} className={({ isActive }) => `${linkBase} ${isActive ? 'nav-active' : linkIdle}`}>
          <UserCircle size={18} strokeWidth={2} /> Profile
        </NavLink>
        <NavLink to="/settings" onClick={close} className={({ isActive }) => `${linkBase} ${isActive ? 'nav-active' : linkIdle}`}>
          <SettingsIcon size={18} strokeWidth={2} /> Settings
        </NavLink>
        <button onClick={logout} className={`${linkBase} ${linkIdle} w-full`}>
          <LogOut size={18} strokeWidth={2} /> Log out
        </button>

        <div className="mt-3 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
          <Avatar user={user} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-xs capitalize text-white/50">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
