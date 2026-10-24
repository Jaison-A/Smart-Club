import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { usersApi } from '../../api/invites.api';

// Controlled: `value` is the selected user object (or null), `onChange`
// receives the selected user. Search fires after a short debounce and
// only once the query is at least 2 characters (matches the backend's
// own minimum, so we're not firing requests that will just come back empty).
export default function UserPicker({ value, onChange, placeholder = 'Search by name or email...' }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await usersApi.search(query.trim());
        setResults(data.data.users);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-md border border-border bg-primary/5 px-3 py-2">
        <div>
          <p className="text-sm font-medium text-ink">{value.name}</p>
          <p className="text-xs text-ink-muted">{value.email}</p>
        </div>
        <button type="button" onClick={() => onChange(null)} aria-label="Clear selection">
          <X size={15} className="text-ink-muted hover:text-ink" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
      </div>
      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-surface shadow-lg">
          {results.map((u) => (
            <button
              key={u._id}
              type="button"
              onClick={() => {
                onChange(u);
                setQuery('');
                setIsOpen(false);
              }}
              className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-primary/5"
            >
              <span className="font-medium text-ink">{u.name}</span>
              <span className="text-xs text-ink-muted">
                {u.email} &middot; {u.role}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
