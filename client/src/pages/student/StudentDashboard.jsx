import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, Compass, FileText, PlusCircle, Users2, LayoutGrid } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ClubLogo from '../../components/ui/ClubLogo';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { eventsApi } from '../../api/events.api';
import { recruitmentApi } from '../../api/recruitment.api';

function StatTile({ icon: Icon, value, label, to }) {
  return (
    <Link to={to} className="block">
      <Card className="flex items-center gap-4 transition-colors hover:border-primary/40">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon size={22} /></div>
        <div>
          <p className="font-display text-2xl font-semibold leading-none text-ink">{value}</p>
          <p className="mt-1 text-sm text-ink-muted">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

const QUICK_LINKS = [
  { to: '/clubs', icon: LayoutGrid, title: 'Browse Clubs', hint: 'Discover clubs' },
  { to: '/events', icon: Calendar, title: 'Upcoming Events', hint: 'View events' },
  { to: '/applications', icon: FileText, title: 'My Applications', hint: 'Track status' },
  { to: '/clubs/new', icon: PlusCircle, title: 'Create Club', hint: 'Start a new club' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [clubTotal, setClubTotal] = useState(0);
  const [applications, setApplications] = useState([]);
  const [appTotal, setAppTotal] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const userId = user._id || user.id;

    async function load() {
      // allSettled: one failing request must not blank the whole dashboard.
      const [clubsRes, appsRes, eventsRes] = await Promise.allSettled([
        clubsApi.list({ limit: 4 }),
        recruitmentApi.listApplicationsForUser(userId, { limit: 5 }),
        eventsApi.listForUser(userId, { limit: 100 }),
      ]);
      if (cancelled) return;

      if (clubsRes.status === 'fulfilled') {
        setClubs(clubsRes.value.data.data.clubs);
        setClubTotal(clubsRes.value.data.data.pagination.total);
      }
      if (appsRes.status === 'fulfilled') {
        setApplications(appsRes.value.data.data.applications);
        setAppTotal(appsRes.value.data.data.pagination.total);
      }
      if (eventsRes.status === 'fulfilled') {
        const now = Date.now();
        setUpcomingCount(
          eventsRes.value.data.data.registrations.filter((r) => r.event && new Date(r.event.startTime).getTime() >= now && r.event.status !== 'cancelled').length
        );
      }
      setIsLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user._id, user.id]);

  const firstName = user?.name?.split(' ')[0];

  return (
    <>
      <TopBar title={`Welcome back, ${firstName}`} subtitle="Here's what's happening on campus." />

      <div className="space-y-6 p-4 sm:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:col-span-2">
            <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full opacity-40 blur-3xl" style={{ background: 'var(--gradient-accent)' }} aria-hidden="true" />
            <div className="relative max-w-md">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Welcome back, {firstName}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">
                Find your people,<br />join your passion.
              </h2>
              <p className="mt-3 text-sm text-ink-muted">Explore clubs, attend events, and be part of something bigger on campus.</p>
              <Link to="/clubs"><Button className="mt-5">Explore Clubs <ArrowRight size={16} /></Button></Link>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <StatTile icon={LayoutGrid} value={clubTotal} label="Clubs" to="/clubs" />
            <StatTile icon={Calendar} value={upcomingCount} label="Upcoming Events" to="/events" />
            <StatTile icon={FileText} value={appTotal} label="Your Applications" to="/applications" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {QUICK_LINKS.map(({ to, icon: Icon, title, hint }) => (
            <Link key={to} to={to}>
              <Card className="flex h-full items-center gap-3 transition-colors hover:border-primary/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon size={18} /></div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{title}</p>
                  <p className="truncate text-xs text-ink-muted">{hint}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Featured Clubs</h2>
            <Link to="/clubs" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View All <ArrowRight size={14} /></Link>
          </div>
          {isLoading ? (
            <Spinner />
          ) : clubs.length === 0 ? (
            <EmptyState icon={Compass} title="No clubs yet" description="Be the first to start one!" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {clubs.map((club) => (
                <Card key={club._id} className="flex flex-col">
                  <ClubLogo club={club} size="md" />
                  <p className="mt-3 font-display text-sm font-semibold text-ink">{club.name}</p>
                  <p className="text-xs text-ink-muted">{club.category}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
                    <span className="flex items-center gap-1"><Users2 size={12} /> {club.memberCount} members</span>
                    <Badge category={club.category} />
                  </div>
                  <Link to={`/clubs/${club.slug}`} className="mt-4"><Button size="sm" className="w-full">View Club</Button></Link>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">My Applications</h2>
            <Link to="/applications" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">View All <ArrowRight size={14} /></Link>
          </div>
          {applications.length === 0 ? (
            <EmptyState icon={FileText} title="No applications yet" description="Apply to a club's recruitment drive and track it here." />
          ) : (
            <ul className="divide-y divide-border">
              {applications.map((app) => (
                <li key={app._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ClubLogo club={app.club} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{app.drive?.title}</p>
                      <p className="truncate text-xs text-ink-muted">{app.club?.name}</p>
                    </div>
                  </div>
                  <Badge status={app.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
