import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users2, ClipboardCheck, Compass, ArrowUpRight } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { recruitmentApi } from '../../api/recruitment.api';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [clubsRes, appsRes] = await Promise.all([
          clubsApi.list({ limit: 4 }),
          recruitmentApi.listApplicationsForUser(user.id || user._id, { limit: 5 }),
        ]);
        if (!cancelled) {
          setClubs(clubsRes.data.data.clubs);
          setApplications(appsRes.data.data.applications);
        }
      } catch {
        // Dashboard tiles degrade gracefully to their empty states below
        // rather than blocking the whole page on a single failed fetch.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pendingCount = applications.filter((a) => ['submitted', 'shortlisted', 'interview'].includes(a.status)).length;
  const acceptedCount = applications.filter((a) => a.status === 'accepted').length;

  return (
    <>
      <TopBar title={`Welcome back, ${user?.name?.split(' ')[0]}`} subtitle="Here's what's happening across your clubs." />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Clubs Joined" value={acceptedCount} icon={Users2} />
          <StatCard label="Pending Applications" value={pendingCount} icon={ClipboardCheck} />
          <StatCard label="Clubs to Explore" value={clubs.length} icon={Compass} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-ink">Recommended for you</h2>
              <Link to="/clubs" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Browse all <ArrowUpRight size={14} />
              </Link>
            </div>

            {isLoading ? (
              <Spinner />
            ) : clubs.length === 0 ? (
              <EmptyState
                icon={Compass}
                title="No clubs to show yet"
                description="Add your skills and interests to your profile to get personalized recommendations."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {clubs.map((club) => (
                  <Link
                    key={club._id}
                    to={`/clubs/${club.slug}`}
                    className="rounded-md border border-border p-4 transition-colors hover:border-primary/30 hover:bg-primary/5"
                  >
                    <p className="font-display text-sm font-semibold text-ink">{club.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{club.description}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {club.tags?.slice(0, 3).map((tag) => (
                        <Badge key={tag} tone="neutral">{tag}</Badge>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 font-display text-base font-semibold text-ink">Your Applications</h2>
            {isLoading ? (
              <Spinner />
            ) : applications.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No applications yet"
                description="Apply to a club's recruitment drive to see status updates here."
              />
            ) : (
              <ul className="space-y-3">
                {applications.map((app) => (
                  <li key={app._id} className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{app.drive?.title}</p>
                      <p className="text-xs text-ink-muted">{app.club?.name}</p>
                    </div>
                    <Badge status={app.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
