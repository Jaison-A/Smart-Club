import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { eventsApi } from '../../api/events.api';

const TABS = ['Upcoming', 'Registered', 'Past'];

function DateBlock({ date }) {
  const d = new Date(date);
  return (
    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary" aria-hidden="true">
      <span className="text-[10px] font-semibold uppercase tracking-wide">{d.toLocaleString(undefined, { month: 'short' })}</span>
      <span className="font-display text-xl font-semibold leading-none">{d.getDate()}</span>
    </div>
  );
}

export default function EventsPage() {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState(new Set());
  const [tab, setTab] = useState('Upcoming');
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await clubsApi.list({ limit: 50 });
        const perClub = await Promise.all(
          data.data.clubs.map((club) =>
            eventsApi.listForClub(club._id, { limit: 50 }).then((r) => r.data.data.events.map((e) => ({ ...e, club }))).catch(() => [])
          )
        );
        if (cancelled) return;
        setEvents(perClub.flat().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));

        const mine = await eventsApi.listForUser(user._id || user.id, { limit: 200 }).catch(() => null);
        if (!cancelled && mine) setRegisteredIds(new Set(mine.data.data.registrations.map((r) => r.event?._id).filter(Boolean)));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user._id, user.id]);

  async function register(eventId) {
    setBusyId(eventId);
    setNotice('');
    try {
      await eventsApi.register(eventId);
      setRegisteredIds((s) => new Set(s).add(eventId));
    } catch (err) {
      setNotice(err.response?.data?.message || 'Could not register for this event.');
    } finally {
      setBusyId(null);
    }
  }

  const now = Date.now();
  const visible = events.filter((e) => {
    const isPast = new Date(e.endTime).getTime() < now || e.status === 'completed';
    if (tab === 'Past') return isPast;
    if (tab === 'Registered') return registeredIds.has(e._id);
    return !isPast && e.status !== 'cancelled';
  });

  return (
    <>
      <TopBar title="Events" subtitle="Workshops, hackathons and meetups across every club." />

      <div className="mx-auto max-w-5xl p-4 sm:p-8">
        <div className="mb-5 flex flex-wrap gap-2" role="tablist">
          {TABS.filter((t) => isStudent || t !== 'Registered').map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t ? 'gradient-primary text-onprimary' : 'border border-border text-ink-muted hover:text-ink'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {notice && <p role="alert" className="mb-4 rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">{notice}</p>}

        {isLoading ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <EmptyState icon={Calendar} title={`No ${tab.toLowerCase()} events`} description="New events appear here as soon as clubs post them." />
        ) : (
          <div className="space-y-3">
            {visible.map((event) => {
              const registered = registeredIds.has(event._id);
              const isPast = new Date(event.endTime).getTime() < now;
              return (
                <Card key={event._id}>
                  <div className="flex items-center gap-4">
                    <DateBlock date={event.startTime} />
                    <Link to={`/events/${event._id}`} className="min-w-0 flex-1">
                      <p className="truncate font-display text-sm font-semibold text-ink hover:underline">{event.title}</p>
                      <p className="truncate text-xs text-ink-muted">by {event.club.name}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-muted">
                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(event.startTime).toLocaleTimeString(undefined, { timeStyle: 'short' })}</span>
                        {event.venue && <span className="flex items-center gap-1"><MapPin size={12} /> {event.venue}</span>}
                      </p>
                    </Link>
                    {event.status === 'cancelled' ? (
                      <Badge status="cancelled" />
                    ) : isStudent && !isPast ? (
                      registered ? (
                        <Badge status="registered" />
                      ) : event.registrationRequired ? (
                        <Button size="sm" disabled={busyId === event._id} onClick={() => register(event._id)}>Register</Button>
                      ) : (
                        <Badge tone="neutral">Open entry</Badge>
                      )
                    ) : (
                      <Link to={`/events/${event._id}`}><Button size="sm" variant="outline">Details</Button></Link>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
