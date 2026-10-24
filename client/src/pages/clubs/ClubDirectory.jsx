import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Compass, Users2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ClubLogo from '../../components/ui/ClubLogo';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';

const CATEGORIES = ['All', 'Technical', 'Cultural', 'Sports', 'Literary', 'Social Service', 'General'];

// Search lives in the URL (?search=) so the global TopBar search, browser
// back/forward and shared links all behave the same way.
export default function ClubDirectory() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const [category, setCategory] = useState('All');
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // Debounced so we aren't firing a request on every keystroke.
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await clubsApi.list({
          search: search || undefined,
          category: category === 'All' ? undefined : category,
          limit: 30,
        });
        if (!cancelled) setClubs(data.data.clubs);
      } catch {
        if (!cancelled) setClubs([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, category]);

  function setSearch(value) {
    setParams(value ? { search: value } : {}, { replace: true });
  }

  return (
    <>
      <TopBar title="Explore Clubs" subtitle="Find your people. Join your passion." />

      <div className="p-4 sm:p-8">
        <div className="relative mb-4 max-w-xl">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for clubs..."
            aria-label="Search for clubs"
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={category === c}
              onClick={() => setCategory(c)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${category === c ? 'gradient-primary text-onprimary' : 'border border-border text-ink-muted hover:text-ink'}`}
            >
              {c}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner />
        ) : clubs.length === 0 ? (
          <EmptyState icon={Compass} title="No clubs found" description="Try a different search or category." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {clubs.map((club) => (
              <Card key={club._id} className="flex flex-col transition-colors hover:border-primary/40">
                <div className="flex items-start gap-3">
                  <ClubLogo club={club} size="md" />
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">{club.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted"><Users2 size={12} /> {club.memberCount} members</p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-muted">{club.description || 'No description yet.'}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge category={club.category} />
                  {club.tags?.slice(0, 2).map((t) => <Badge key={t} tone="neutral">{t}</Badge>)}
                </div>
                <Link to={`/clubs/${club.slug}`} className="mt-4"><Button variant="outline" size="sm" className="w-full">View Details</Button></Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
