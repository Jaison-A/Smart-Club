import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Compass } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';

export default function ClubDirectory() {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Debounced so we're not firing a request on every keystroke.
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await clubsApi.list({ search: search || undefined, limit: 30 });
        if (!cancelled) setClubs(data.data.clubs);
      } catch {
        if (!cancelled) setClubs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <>
      <TopBar title="Explore Clubs" subtitle="Find a club that matches your interests." />

      <div className="p-8">
        <div className="relative mb-6 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clubs..."
            className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {isLoading ? (
          <Spinner />
        ) : clubs.length === 0 ? (
          <EmptyState icon={Compass} title="No clubs found" description="Try a different search term." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link
                key={club._id}
                to={`/clubs/${club.slug}`}
                className="group rounded-lg border border-border bg-surface p-5 transition-colors hover:border-primary/30 hover:bg-primary/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 font-display text-lg font-bold text-primary">
                  {club.name?.[0]}
                </div>
                <p className="mt-3 font-display text-sm font-semibold text-ink">{club.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{club.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <Badge tone="neutral">{club.category}</Badge>
                  <span className="text-xs text-ink-muted">{club.memberCount} members</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
