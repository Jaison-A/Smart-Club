import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users2, ClipboardList, FileClock, Plus, ArrowUpRight, Pencil, Calendar } from 'lucide-react';
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
import { eventsApi } from '../../api/events.api';

// A coordinator manages one club in this phase of the platform (the
// data model supports being on multiple clubs' coordinator lists, but
// the UI keeps to the common case — this would become a club switcher
// once that need shows up).
export default function CoordinatorDashboard() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [drives, setDrives] = useState([]);
  const [events, setEvents] = useState([]);
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
          const [drivesRes, eventsRes] = await Promise.all([
            recruitmentApi.listDrivesForClub(myClub._id),
            eventsApi.listForClub(myClub._id),
          ]);
          if (!cancelled) {
            setDrives(drivesRes.data.data.drives);
            setEvents(eventsRes.data.data.events);
          }
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
          <div className="flex items-center gap-2">
            <Link to={`/clubs/${club.slug}/edit`}>
              <Button size="sm" variant="outline">
                <Pencil size={15} /> Edit club
              </Button>
            </Link>
            <Link to={`/events/new?clubId=${club._id}`}>
              <Button size="sm" variant="outline">
                <Calendar size={15} /> New event
              </Button>
            </Link>
            <Link to={`/recruitment/new?clubId=${club._id}`}>
              <Button size="sm">
                <Plus size={16} /> New drive
              </Button>
            </Link>
          </div>
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
                  <th className="pb-2 font-medium" />
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
                    <td className="py-3">
                      <Link
                        to={`/coordinator/applications/${drive._id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Review applications
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink">Events</h2>
            <Link to="/events" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>

          {events.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No events yet"
              description="Create an event to start collecting registrations."
              action={
                <Link to={`/events/new?clubId=${club._id}`}>
                  <Button size="sm" variant="outline">Create your first event</Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {events.map((event) => (
                <li key={event._id} className="flex items-center justify-between py-3">
                  <Link to={`/events/${event._id}`} className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink hover:underline">{event.title}</p>
                    <p className="text-xs text-ink-muted">{new Date(event.startTime).toLocaleString()}</p>
                  </Link>
                  <Badge status={event.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
