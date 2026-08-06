import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users2, ClipboardList, FileClock, Plus, ArrowUpRight } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { recruitmentApi } from '../../api/recruitment.api';

// A coordinator manages one club in this phase of the platform (the
// data model supports being on multiple clubs' coordinator lists, but
// the UI keeps to the common case — this would become a club switcher
// once that need shows up).
export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [drives, setDrives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // In this phase, resolving "my club" happens via a clubs list
        // filtered client-side; a dedicated /clubs?coordinator=me
        // filter would be a natural small backend addition later.
        const { data } = await clubsApi.list({ limit: 50 });
        const myClub = data.data.clubs.find((c) =>
          c.coordinators?.some((id) => id === user.id || id === user._id)
        );
        if (cancelled) return;
        setClub(myClub || null);

        if (myClub) {
          const drivesRes = await recruitmentApi.listDrivesForClub(myClub._id);
          if (!cancelled) setDrives(drivesRes.data.data.drives);
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
  }, [user]);

  if (isLoading) return <Spinner full />;

  if (!club) {
    return (
      <>
        <TopBar title="Coordinator Dashboard" />
        <div className="p-8">
          <EmptyState
            icon={Users2}
            title="You're not assigned to a club yet"
            description="An admin needs to assign you as a coordinator before you can manage a club."
          />
        </div>
      </>
    );
  }

  const openDrives = drives.filter((d) => d.status === 'open');

  return (
    <>
      <TopBar
        title={club.name}
        subtitle="Coordinator overview"
        actions={
          <Link to={`/recruitment/new?clubId=${club._id}`}>
            <Button size="sm">
              <Plus size={16} /> New drive
            </Button>
          </Link>
        }
      />

      <div className="space-y-6 p-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Active Members" value={club.memberCount} icon={Users2} />
          <StatCard label="Open Drives" value={openDrives.length} icon={ClipboardList} />
          <StatCard label="Total Drives" value={drives.length} icon={FileClock} />
        </div>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Recruitment Drives</h2>
            <Link to="/recruitment" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Manage all <ArrowUpRight size={14} />
            </Link>
          </div>

          {drives.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No recruitment drives yet"
              description="Create a drive to start accepting applications from students."
              action={
                <Link to={`/recruitment/new?clubId=${club._id}`}>
                  <Button size="sm" variant="outline">Create your first drive</Button>
                </Link>
              }
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="pb-2 font-medium">Title</th>
                  <th className="pb-2 font-medium">Window</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {drives.map((drive) => (
                  <tr key={drive._id} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium text-ink">{drive.title}</td>
                    <td className="py-3 text-ink-muted">
                      {new Date(drive.openDate).toLocaleDateString()} –{' '}
                      {new Date(drive.closeDate).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Badge status={drive.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
