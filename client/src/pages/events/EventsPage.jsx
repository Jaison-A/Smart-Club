import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';
import { eventsApi } from '../../api/events.api';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await clubsApi.list({ limit: 50 });
        const results = await Promise.all(
          data.data.clubs.map((club) =>
            eventsApi
              .listForClub(club._id, { status: 'scheduled' })
              .then((res) => res.data.data.events.map((e) => ({ ...e, club })))
              .catch(() => [])
          )
        );
        if (!cancelled) {
          setEvents(results.flat().sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <TopBar title="Events" subtitle="Upcoming events across every club." />
      <div className="p-8">
        {isLoading ? (
          <Spinner />
        ) : events.length === 0 ? (
          <EmptyState icon={Calendar} title="No upcoming events" description="Check back soon." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link key={event._id} to={`/events/${event._id}`}>
                <Card accent className="h-full">
                  <p className="text-xs font-medium text-ink-muted">{event.club.name}</p>
                  <p className="mt-1 font-display text-sm font-semibold text-ink">{event.title}</p>
                  <div className="mt-3 space-y-1.5 text-xs text-ink-muted">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      {new Date(event.startTime).toLocaleString()}
                    </div>
                    {event.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} />
                        {event.venue}
                      </div>
                    )}
                  </div>
                  <div className="mt-3">
                    <Badge status={event.status} />
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
