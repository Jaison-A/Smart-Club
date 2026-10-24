import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { eventsApi } from '../../api/events.api';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const clubIdFromQuery = searchParams.get('clubId');

  const [clubId, setClubId] = useState(clubIdFromQuery || '');
  const [form, setForm] = useState({
    title: '',
    description: '',
    venue: '',
    bannerUrl: '',
    startTime: '',
    endTime: '',
    registrationRequired: true,
    capacity: 0,
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // If no clubId was passed in, resolve the coordinator's own club --
    // mirrors the same lookup used on the Coordinator Dashboard.
    if (clubId) return;
    clubsApi.mine().then(({ data }) => {
      const myClub = data.data.clubs[0];
      if (myClub) setClubId(myClub._id);
    });
  }, [clubId, user]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await eventsApi.create(clubId, { ...form, capacity: Number(form.capacity) || 0 });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong creating the event.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 className="text-success" size={40} />
        <h1 className="font-display text-xl font-semibold text-ink">Event created</h1>
        <Button onClick={() => navigate('/coordinator')} className="mt-2">
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Create Event" subtitle="Schedule an event for your club." />
      <div className="mx-auto max-w-2xl p-8">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            <Input name="title" label="Event title" value={form.title} onChange={handleChange} required />
            <Textarea name="description" label="Description" rows={3} value={form.description} onChange={handleChange} />
            <Input name="venue" label="Venue" value={form.venue} onChange={handleChange} />
            <Input name="bannerUrl" label="Banner URL (optional)" value={form.bannerUrl} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="startTime"
                type="datetime-local"
                label="Start"
                value={form.startTime}
                onChange={handleChange}
                required
              />
              <Input
                name="endTime"
                type="datetime-local"
                label="End"
                value={form.endTime}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="capacity"
                type="number"
                min="0"
                label="Capacity (0 = unlimited)"
                value={form.capacity}
                onChange={handleChange}
              />
              <div className="flex items-center gap-2 pt-6">
                <input
                  id="registrationRequired"
                  name="registrationRequired"
                  type="checkbox"
                  checked={form.registrationRequired}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <label htmlFor="registrationRequired" className="text-sm text-ink">
                  Requires registration
                </label>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting || !clubId}>
              {isSubmitting ? 'Creating...' : 'Create event'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
