import { useEffect, useState } from 'react';
import { Users2, Search } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';

export default function CoordinatorMembers() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await clubsApi.list({ limit: 100 });
        const myClub = data.data.clubs.find((item) =>
          item.coordinators?.some((id) => id === user.id || id === user._id)
        );

        if (cancelled) return;

        setClub(myClub || null);

        if (myClub) {
          const membersRes = await clubsApi.getMembers(myClub._id, { limit: 100 });
          if (!cancelled) {
            setMembers(membersRes.data.data.members || []);
          }
        }
      } catch {
        if (!cancelled) {
          setClub(null);
          setMembers([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const filteredMembers = members.filter((membership) => {
    const name = membership.user?.name || '';
    const email = membership.user?.email || '';
    const term = search.trim().toLowerCase();

    if (!term) return true;

    return name.toLowerCase().includes(term) || email.toLowerCase().includes(term);
  });

  if (isLoading) return <Spinner full />;

  if (!club) {
    return (
      <>
        <TopBar title="Members" subtitle="View your club members." />
        <div className="p-8">
          <EmptyState
            icon={Users2}
            title="You are not assigned to a club yet"
            description="Ask an admin to assign you as a coordinator to manage club members."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title="Members" subtitle={club.name} />

      <div className="space-y-6 p-8">
        <Card>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Club members</h2>
              <p className="text-sm text-ink-muted">{filteredMembers.length} total member records</p>
            </div>

            <div className="relative max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
          </div>

          {filteredMembers.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No members found"
              description="This club does not have active members yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium">Year</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((membership) => (
                    <tr key={membership._id} className="border-b border-border last:border-0">
                      <td className="py-3 font-medium text-ink">{membership.user?.name}</td>
                      <td className="py-3 text-ink-muted">{membership.user?.email}</td>
                      <td className="py-3 text-ink-muted">
                        {membership.user?.department || '—'}
                      </td>
                      <td className="py-3 text-ink-muted">
                        {membership.user?.year || '—'}
                      </td>
                      <td className="py-3">
                        <Badge status={membership.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
