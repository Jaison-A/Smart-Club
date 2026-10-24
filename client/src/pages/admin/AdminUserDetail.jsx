import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, GraduationCap, Code2, Briefcase, Globe, FileText, Ban, RotateCcw } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { adminApi } from '../../api/admin.api';

function LinkRow({ icon: Icon, label, href }) {
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
      <Icon size={14} /> {label}
    </a>
  );
}

// Admin's read view of one user: profile, clubs & positions, applications.
export default function AdminUserDetail() {
  const { id } = useParams();
  const { user: me } = useAuth();
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await adminApi.getUserOverview(id);
      setOverview(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this user.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive() {
    setActing(true);
    try {
      await (overview.user.isActive ? adminApi.disableUser(id) : adminApi.enableUser(id));
      await load();
    } finally {
      setActing(false);
    }
  }

  if (isLoading) return <Spinner full />;
  if (error || !overview) {
    return (
      <div className="p-8">
        <EmptyState title="User not found" description={error} />
      </div>
    );
  }

  const { user, memberships, applications, registrationCount, certificateCount, coordinatingClubs } = overview;
  const isSelf = user._id === (me._id || me.id);

  return (
    <>
      <TopBar title="User Profile" subtitle={user.email} />

      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
        <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to users
        </Link>

        <Card>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <Avatar user={user} size="xl" />
              <div className="text-center sm:text-left">
                <p className="font-display text-xl font-semibold text-ink">{user.name}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Badge tone="accent">{user.role}</Badge>
                  <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'active' : 'disabled'}</Badge>
                  {user.department && <Badge tone="neutral">{user.department}</Badge>}
                  {user.year && <Badge tone="neutral">Year {user.year}</Badge>}
                </div>
                <div className="mt-3 space-y-1.5">
                  <p className="flex items-center justify-center gap-2 text-sm text-ink-muted sm:justify-start"><Mail size={14} /> {user.email}</p>
                  {user.studentId && (
                    <p className="flex items-center justify-center gap-2 text-sm text-ink-muted sm:justify-start"><GraduationCap size={14} /> {user.studentId}</p>
                  )}
                </div>
              </div>
            </div>
            {!isSelf && (
              <Button variant="outline" size="sm" onClick={toggleActive} disabled={acting} className="self-center sm:self-start">
                {user.isActive ? (<><Ban size={14} /> Disable account</>) : (<><RotateCcw size={14} /> Enable account</>)}
              </Button>
            )}
          </div>

          {user.bio && <p className="mt-5 text-sm leading-relaxed text-ink-muted">{user.bio}</p>}

          {(user.skills?.length > 0 || user.interests?.length > 0) && (
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {user.skills?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Skills</p>
                  <div className="flex flex-wrap gap-1.5">{user.skills.map((s) => <Badge key={s} tone="info">{s}</Badge>)}</div>
                </div>
              )}
              {user.interests?.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Interests</p>
                  <div className="flex flex-wrap gap-1.5">{user.interests.map((s) => <Badge key={s} tone="neutral">{s}</Badge>)}</div>
                </div>
              )}
            </div>
          )}

          {(user.github || user.linkedin || user.website || user.resumeUrl) && (
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4">
              <LinkRow icon={Code2} label="GitHub" href={user.github} />
              <LinkRow icon={Briefcase} label="LinkedIn" href={user.linkedin} />
              <LinkRow icon={Globe} label="Website" href={user.website} />
              <LinkRow icon={FileText} label="Resume" href={user.resumeUrl} />
            </div>
          )}
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center"><p className="font-display text-2xl font-semibold text-ink">{memberships.length}</p><p className="text-xs text-ink-muted">Clubs joined</p></Card>
          <Card className="text-center"><p className="font-display text-2xl font-semibold text-ink">{registrationCount}</p><p className="text-xs text-ink-muted">Event registrations</p></Card>
          <Card className="text-center"><p className="font-display text-2xl font-semibold text-ink">{certificateCount}</p><p className="text-xs text-ink-muted">Certificates</p></Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <p className="mb-3 font-display text-sm font-semibold text-ink">Clubs & positions</p>
            {memberships.length === 0 && coordinatingClubs.length === 0 ? (
              <p className="text-sm text-ink-muted">Not part of any club.</p>
            ) : (
              <ul className="divide-y divide-border">
                {coordinatingClubs.map((c) => (
                  <li key={c._id} className="flex items-center justify-between py-2.5">
                    <Link to={`/clubs/${c.slug}`} className="text-sm font-medium text-ink hover:underline">{c.name}</Link>
                    <Badge tone="accent">Coordinator</Badge>
                  </li>
                ))}
                {memberships.filter((m) => m.role !== 'coordinator').map((m) => (
                  <li key={m._id} className="flex items-center justify-between py-2.5">
                    <Link to={`/clubs/${m.club?.slug}`} className="text-sm font-medium text-ink hover:underline">{m.club?.name}</Link>
                    <Badge tone={m.officerTitle ? 'info' : 'neutral'}>{m.officerTitle || 'Member'}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <p className="mb-3 font-display text-sm font-semibold text-ink">Recent applications</p>
            {applications.length === 0 ? (
              <p className="text-sm text-ink-muted">No applications submitted.</p>
            ) : (
              <ul className="divide-y divide-border">
                {applications.map((a) => (
                  <li key={a._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{a.drive?.title}</p>
                      <p className="text-xs text-ink-muted">{a.club?.name}</p>
                    </div>
                    <Badge status={a.status} />
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
