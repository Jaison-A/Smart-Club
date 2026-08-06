import { useEffect, useState } from 'react';
import { Building2, Users2, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopBar from '../../components/layout/TopBar';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';

export default function AdminDashboard() {
  const [allClubs, setAllClubs] = useState([]);
  const [pendingClubs, setPendingClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [activeRes, pendingRes] = await Promise.all([
          clubsApi.list({ limit: 100 }),
          clubsApi.list({ status: 'pending', limit: 20 }),
        ]);
        if (!cancelled) {
          setAllClubs(activeRes.data.data.clubs);
          setPendingClubs(pendingRes.data.data.clubs);
        }
      } catch {
        // Empty states below cover the failure case.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const totalMembers = allClubs.reduce((sum, c) => sum + (c.memberCount || 0), 0);

  return (
    <>
      <TopBar title="Admin Overview" subtitle="Platform-wide activity across all clubs." />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Active Clubs" value={allClubs.length} icon={Building2} />
          <StatCard label="Total Memberships" value={totalMembers} icon={Users2} />
          <StatCard label="Pending Approvals" value={pendingClubs.length} icon={ShieldCheck} />
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Pending Club Approvals</h2>
            <Link
              to="/admin/approvals"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <Spinner />
          ) : pendingClubs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nothing waiting on you"
              description="New clubs submitted for approval will show up here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {pendingClubs.map((club) => (
                <li key={club._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{club.name}</p>
                    <p className="text-xs text-ink-muted">{club.category}</p>
                  </div>
                  <Badge status={club.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
