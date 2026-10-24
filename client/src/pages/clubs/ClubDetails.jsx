import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Code2, Globe, Link as LinkIcon, MapPin, Users2, ExternalLink, Pencil } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ClubLogo from '../../components/ui/ClubLogo';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import TopBar from '../../components/layout/TopBar';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { eventsApi } from '../../api/events.api';
import { recruitmentApi } from '../../api/recruitment.api';
import { coordinatorRequestsApi } from '../../api/invites.api';

const TABS = ['About', 'Events', 'Openings'];

function SocialLink({ href, label, icon: Icon }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="rounded-lg border border-border p-2 text-ink-muted transition-colors hover:border-primary/50 hover:text-ink">
      <Icon size={16} />
    </a>
  );
}

export default function ClubDetails() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [club, setClub] = useState(null);
  const [drives, setDrives] = useState([]);
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('About');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [applyMsg, setApplyMsg] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await clubsApi.getBySlug(slug);
        if (cancelled) return;
        setClub(data.data.club);
        const [drivesRes, eventsRes] = await Promise.allSettled([
          recruitmentApi.listDrivesForClub(data.data.club._id, { status: 'open' }),
          eventsApi.listForClub(data.data.club._id, { status: 'scheduled' }),
        ]);
        if (cancelled) return;
        if (drivesRes.status === 'fulfilled') setDrives(drivesRes.value.data.data.drives);
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data.data.events);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleApplyToCoordinate() {
    setIsApplying(true);
    setApplyMsg('');
    try {
      await coordinatorRequestsApi.apply(club._id);
      setApplyMsg('Application submitted. An admin will review it.');
    } catch (err) {
      setApplyMsg(err.response?.data?.message || 'Could not submit application.');
    } finally {
      setIsApplying(false);
    }
  }

  if (isLoading) return <Spinner full />;
  if (notFound || !club) {
    return (
      <div className="p-8">
        <EmptyState title="Club not found" description="This club may have been removed, or it isn't public yet." />
      </div>
    );
  }

  const isStudent = isAuthenticated && user.role === 'student';
  const isOwnCoordinator = isAuthenticated && club.coordinators?.some((c) => c._id === (user._id || user.id));
  const social = club.socialLinks || {};
  const advisor = club.facultyAdvisor;

  return (
    <>
      <TopBar title={club.name} subtitle={club.category} />

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
        <Link to="/clubs" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to clubs
        </Link>

        {club.status !== 'active' && (
          <div role="status" className="rounded-lg border border-warning/40 bg-warning-bg px-4 py-3 text-sm text-warning">
            This club is <strong>{club.status}</strong> and is only visible to its coordinators and admins.
          </div>
        )}

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
          <div
            className="h-28 w-full sm:h-40"
            style={club.coverImageUrl ? { backgroundImage: `url(${club.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundImage: 'var(--gradient-primary)', opacity: 0.35 }}
            aria-hidden="true"
          />
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:px-8">
            <div className="-mt-12 flex items-end gap-4 sm:-mt-14">
              <ClubLogo club={club} size="xl" className="border-4 border-surface bg-surface" />
              <div className="pb-1">
                <h1 className="font-display text-xl font-semibold text-ink sm:text-2xl">{club.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <Badge category={club.category} />
                  <span className="flex items-center gap-1"><Users2 size={13} /> {club.memberCount} members</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SocialLink href={social.instagram} label="Instagram" icon={LinkIcon} />
              <SocialLink href={social.linkedin} label="LinkedIn" icon={LinkIcon} />
              <SocialLink href={social.github} label="GitHub" icon={Code2} />
              <SocialLink href={social.website} label="Website" icon={Globe} />
              {isOwnCoordinator && (
                <Link to={`/clubs/${club.slug}/edit`}><Button variant="outline" size="sm"><Pencil size={14} /> Edit</Button></Link>
              )}
              {isStudent && (
                <Button size="sm" disabled={drives.length === 0} onClick={() => setTab('Openings')}>
                  {drives.length ? 'View Openings' : 'Not recruiting'}
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-border px-3 sm:px-6" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${tab === t ? 'border-primary text-primary' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                {t}
                {t === 'Openings' && drives.length > 0 && <span className="ml-1.5 rounded-full bg-primary/15 px-1.5 text-xs">{drives.length}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {tab === 'About' && (
              <Card>
                <h2 className="font-display text-base font-semibold text-ink">About Us</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-muted">{club.description || 'No description yet.'}</p>
                {(club.vision || club.mission) && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {club.vision && (<div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Vision</p><p className="mt-1 text-sm text-ink-muted">{club.vision}</p></div>)}
                    {club.mission && (<div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Mission</p><p className="mt-1 text-sm text-ink-muted">{club.mission}</p></div>)}
                  </div>
                )}
                {club.tags?.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-1.5">{club.tags.map((t) => <Badge key={t} tone="teal">{t}</Badge>)}</div>
                )}
              </Card>
            )}

            {tab === 'Events' && (
              <Card>
                <h2 className="mb-3 font-display text-base font-semibold text-ink">Upcoming Events</h2>
                {events.length === 0 ? (
                  <EmptyState icon={Calendar} title="No upcoming events" description="Check back soon." />
                ) : (
                  <ul className="divide-y divide-border">
                    {events.map((e) => (
                      <li key={e._id}>
                        <Link to={`/events/${e._id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{e.title}</p>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
                              <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(e.startTime).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                              {e.venue && <span className="flex items-center gap-1"><MapPin size={12} /> {e.venue}</span>}
                            </p>
                          </div>
                          <Badge status={e.status} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}

            {tab === 'Openings' && (
              <Card>
                <h2 className="mb-3 font-display text-base font-semibold text-ink">Current Openings</h2>
                {drives.length === 0 ? (
                  <EmptyState icon={Users2} title="No open recruitment right now" description="Check back later, or explore other clubs that are recruiting." />
                ) : (
                  <ul className="divide-y divide-border">
                    {drives.map((d) => (
                      <li key={d._id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{d.title}</p>
                          <p className="text-xs text-ink-muted">Closes {new Date(d.closeDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                          {d.externalFormUrl && <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-muted"><ExternalLink size={11} /> External application form</p>}
                        </div>
                        {isStudent ? (
                          <Link to={`/recruitment/${d._id}/apply`}><Button size="sm">Apply Now</Button></Link>
                        ) : (
                          <Badge status={d.status} />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="font-display text-base font-semibold text-ink">Club Information</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div><dt className="text-xs text-ink-muted">Category</dt><dd className="text-ink">{club.category}</dd></div>
                <div><dt className="text-xs text-ink-muted">Total Members</dt><dd className="text-ink">{club.memberCount}</dd></div>
                {advisor?.name && (
                  <div>
                    <dt className="text-xs text-ink-muted">Faculty Advisor</dt>
                    <dd className="text-ink">{advisor.name}</dd>
                    {advisor.designation && <dd className="text-xs text-ink-muted">{advisor.designation}</dd>}
                  </div>
                )}
              </dl>
            </Card>

            <Card>
              <h2 className="font-display text-base font-semibold text-ink">Coordinators</h2>
              {club.coordinators?.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {club.coordinators.map((c) => (
                    <li key={c._id} className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{c.name?.[0]}</span>
                      <span className="text-sm text-ink">{c.name}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2">
                  <p className="text-xs text-ink-muted">This club doesn't have a coordinator yet.</p>
                  {isAuthenticated && user.role !== 'admin' && (
                    applyMsg ? (
                      <p className="mt-2 text-xs text-ink">{applyMsg}</p>
                    ) : (
                      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={handleApplyToCoordinate} disabled={isApplying}>
                        {isApplying ? 'Submitting...' : 'Apply to coordinate'}
                      </Button>
                    )
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
