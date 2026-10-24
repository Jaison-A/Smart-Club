import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, Building2, Users2, ChevronRight, Plus } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ClubLogo from '../../components/ui/ClubLogo';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';

const STATUS_FILTERS = ['all', 'active', 'pending', 'suspended', 'rejected'];

// Every club across all statuses; click one to manage its people.
export default function AdminClubs() {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await clubsApi.list({ status, search: search || undefined, limit: 100 });
      setClubs(data.data.clubs);
    } catch {
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [load]);

  return (
    <>
      <TopBar
        title="Club Management"
        subtitle="View every club, and assign coordinators and members."
        actions={
          <Link to="/clubs/new">
            <Button size="sm"><Plus size={15} /> New club</Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-sm flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clubs..."
              aria-label="Search clubs"
              className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${status === s ? 'gradient-primary text-onprimary' : 'border border-border text-ink-muted hover:text-ink'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <Spinner />
        ) : clubs.length === 0 ? (
          <EmptyState icon={Building2} title="No clubs found" description="Try a different search or status filter." />
        ) : (
          <div className="space-y-3">
            {clubs.map((club) => (
              <Link key={club._id} to={`/admin/clubs/${club.slug}`} className="block">
                <Card className="transition-colors hover:border-primary/40">
                  <div className="flex items-center gap-4">
                    <ClubLogo club={club} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-sm font-semibold text-ink">{club.name}</p>
                        <Badge status={club.status} />
                        {club.coordinators?.length === 0 && <Badge tone="warning">No coordinator</Badge>}
                      </div>
                      <p className="mt-0.5 flex items-center gap-3 text-xs text-ink-muted">
                        <span>{club.category}</span>
                        <span className="flex items-center gap-1"><Users2 size={12} /> {club.memberCount} members</span>
                      </p>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-ink-muted" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
