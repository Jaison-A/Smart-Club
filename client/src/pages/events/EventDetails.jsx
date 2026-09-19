import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users2,
  QrCode,
  Award,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { eventsApi } from '../../api/events.api';

export default function EventDetails() {
  const { eventId } = useParams();
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  // Coordinator-only state
  const [isOwner, setIsOwner] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [qrSession, setQrSession] = useState(null);

  // Student-only state
  const [registration, setRegistration] = useState(null);
  const [attendanceCode, setAttendanceCode] = useState('');
  const [attendanceMarked, setAttendanceMarked] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await eventsApi.get(eventId);
      setEvent(data.data.event);

      const club = data.data.event.club;
      const ownsClub =
        user?.role === 'admin' ||
        club.coordinators?.some((id) => id === user?.id || id === user?._id || id?._id === user?._id);
      setIsOwner(!!ownsClub);

      if (ownsClub) {
        const [regsRes, logsRes] = await Promise.all([
          eventsApi.listRegistrations(eventId).catch(() => ({ data: { data: { registrations: [] } } })),
          eventsApi.listAttendanceLogs(eventId).catch(() => ({ data: { data: { logs: [] } } })),
        ]);
        setRegistrations(regsRes.data.data.registrations);
        setAttendanceLogs(logsRes.data.data.logs);
      } else if (user?.role === 'student') {
        const { data: myEvents } = await eventsApi.listForUser(user.id || user._id, { limit: 100 });
        const found = myEvents.data.registrations.find((r) => r.event?._id === eventId);
        setRegistration(found || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this event.');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRegister() {
    setActionMsg('');
    try {
      await eventsApi.register(eventId);
      setActionMsg('Registered!');
      load();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Could not register.');
    }
  }

  async function handleCancelRegistration() {
    setActionMsg('');
    try {
      await eventsApi.cancelRegistration(eventId);
      setActionMsg('Registration cancelled.');
      load();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Could not cancel registration.');
    }
  }

  async function handleMarkAttendance(e) {
    e.preventDefault();
    setActionMsg('');
    try {
      await eventsApi.scanAttendance(eventId, attendanceCode);
      setAttendanceMarked(true);
      setActionMsg('Attendance marked!');
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Could not mark attendance.');
    }
  }

  async function handleGenerateQr() {
    setActionMsg('');
    try {
      const { data } = await eventsApi.createAttendanceSession(eventId);
      setQrSession(data.data.session);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Could not generate a code.');
    }
  }

  async function handleGenerateCertificates() {
    setActionMsg('');
    try {
      const { data } = await eventsApi.generateAllCertificates(eventId);
      setActionMsg(`Generated ${data.data.certificates.length} certificate(s).`);
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Could not generate certificates.');
    }
  }

  async function handleCancelEvent() {
    setActionMsg('');
    try {
      await eventsApi.cancel(eventId);
      setActionMsg('Event cancelled.');
      load();
    } catch (err) {
      setActionMsg(err.response?.data?.message || 'Could not cancel event.');
    }
  }

  if (isLoading) return <Spinner full />;

  if (error || !event) {
    return (
      <div className="p-8">
        <EmptyState title="Event not found" description={error} />
      </div>
    );
  }

  const isRegistered = registration?.status === 'registered';

  return (
    <>
      <TopBar title={event.title} subtitle={event.club?.name} />

      <div className="mx-auto max-w-3xl p-8">
        <Link to="/recruitment" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} /> Back
        </Link>

        {actionMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-md bg-info-bg px-3 py-2 text-sm text-info">
            <AlertCircle size={16} />
            {actionMsg}
          </div>
        )}

        <Card className="mb-6">
          <div className="flex items-center gap-2">
            <Badge status={event.status} />
            {event.registrationRequired && <Badge tone="neutral">Registration required</Badge>}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{event.description}</p>
          <div className="mt-4 space-y-2 text-sm text-ink">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-ink-muted" />
              {new Date(event.startTime).toLocaleString()} &ndash; {new Date(event.endTime).toLocaleString()}
            </div>
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-ink-muted" />
                {event.venue}
              </div>
            )}
            {event.capacity > 0 && (
              <div className="flex items-center gap-2">
                <Users2 size={15} className="text-ink-muted" />
                Capacity: {event.capacity}
              </div>
            )}
          </div>
        </Card>

        {user?.role === 'student' && !isOwner && event.status !== 'cancelled' && (
          <Card className="mb-6">
            <p className="mb-3 font-display text-sm font-semibold text-ink">Registration</p>
            {isRegistered ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 size={16} /> You're registered for this event.
                </div>
                <Button variant="outline" size="sm" onClick={handleCancelRegistration}>
                  Cancel registration
                </Button>

                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-sm font-medium text-ink">Mark attendance</p>
                  {attendanceMarked ? (
                    <p className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle2 size={16} /> Attendance marked.
                    </p>
                  ) : (
                    <form onSubmit={handleMarkAttendance} className="flex items-center gap-2">
                      <Input
                        placeholder="Enter the code shown by your coordinator"
                        value={attendanceCode}
                        onChange={(e) => setAttendanceCode(e.target.value)}
                        className="max-w-xs"
                      />
                      <Button type="submit" size="sm">
                        Mark
                      </Button>
                    </form>
                  )}
                </div>
              </div>
            ) : (
              <Button onClick={handleRegister}>Register for this event</Button>
            )}
          </Card>
        )}

        {isOwner && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">Registrations ({registrations.length})</p>
                {event.status !== 'cancelled' && (
                  <Button size="sm" variant="outline" onClick={handleCancelEvent}>
                    Cancel event
                  </Button>
                )}
              </div>
              {registrations.length === 0 ? (
                <p className="mt-3 text-sm text-ink-muted">No one has registered yet.</p>
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {registrations.map((r) => (
                    <li key={r._id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink">{r.user?.name}</span>
                      <span className="text-ink-muted">{r.user?.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">
                  <QrCode size={15} className="mr-1.5 inline" /> Attendance
                </p>
                <Button size="sm" onClick={handleGenerateQr}>
                  Generate code
                </Button>
              </div>
              {qrSession && (
                <div className="mt-3 rounded-md border border-dashed border-accent bg-accent/5 p-4 text-center">
                  <p className="font-mono text-2xl font-semibold tracking-widest text-primary">{qrSession.code}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Expires at {new Date(qrSession.expiresAt).toLocaleTimeString()} &mdash; share this code with
                    students in the room
                  </p>
                </div>
              )}
              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
                Marked attendance ({attendanceLogs.length})
              </p>
              {attendanceLogs.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">No attendance marked yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-border">
                  {attendanceLogs.map((log) => (
                    <li key={log._id} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-ink">{log.user?.name}</span>
                      <Badge tone="neutral">{log.method}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-semibold text-ink">
                  <Award size={15} className="mr-1.5 inline" /> Certificates
                </p>
                <Button size="sm" variant="outline" onClick={handleGenerateCertificates} disabled={attendanceLogs.length === 0}>
                  Generate for all attendees
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                Certificates are only issued to students with a marked attendance record.
              </p>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
