import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import NotificationBell from './NotificationBell';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

// Page header used by every page: title on the left; global search, page
// actions, notifications and the signed-in user on the right.
export default function TopBar({ title, subtitle, actions }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/clubs?search=${encodeURIComponent(q)}` : '/clubs');
    setQuery('');
  }

  return (
    <header className="sticky top-0 z-20 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-border bg-surface/80 px-4 py-4 backdrop-blur sm:px-8">
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-display text-lg font-semibold text-ink sm:text-xl">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-ink-muted">{subtitle}</p>}
      </div>

      <form onSubmit={handleSearch} className="relative hidden w-full max-w-xs md:block" role="search">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search clubs..."
          aria-label="Search clubs"
          className="w-full rounded-lg border border-border bg-canvas/60 py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </form>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {actions}
        <NotificationBell />
        <Link to="/profile" className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-primary/5" aria-label="Open your profile">
          <Avatar user={user} size="sm" />
          <span className="hidden text-left lg:block">
            <span className="block max-w-[120px] truncate text-sm font-medium leading-tight text-ink">{user?.name}</span>
            <span className="block text-xs capitalize leading-tight text-ink-muted">{user?.role}</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
