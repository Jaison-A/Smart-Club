import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, UserMinus, ShieldCheck, Users2, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import UserPicker from '../../components/ui/UserPicker';
import { clubsApi } from '../../api/clubs.api';
import { coordinatorRequestsApi } from '../../api/invites.api';

const COMMON_TITLES = ['', 'President', 'Vice President', 'Treasurer', 'Secretary'];

// Admin control room for ONE club: assign/remove coordinators directly (or
// send an invitation they can accept/decline), add/remove students, set positions.
export default function AdminClubManage() {
  const { slug } = useParams();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null); // { type, text }
  const [busyKey, setBusyKey] = useState(null);
  const [coordPick, setCoordPick] = useState(null);
  const [memberPick, setMemberPick] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await clubsApi.getBySlug(slug);
      setClub(data.data.club);
      const membersRes = await clubsApi.getMembers(data.data.club._id, { limit: 200 });
      setMembers(membersRes.data.data.members);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this club.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  // Wraps every action: busy state, success/error banner, reload.
  async function run(key, successText, fn) {
    setBusyKey(key);
    setNotice(null);
    try {
      await fn();
      setNotice({ type: 'success', text: successText });
      await load();
    } catch (err) {
      setNotice({ type: 'error', text: err.response?.data?.message || 'That action failed.' });
    } finally {
      setBusyKey(null);
    }
  }

  async function assignCoordinator() {
    if (!coordPick) return;
    await run('assign-coord', `${coordPick.name} is now a coordinator.`, () => clubsApi.assignCoordinator(club._id, coordPick._id));
    setCoordPick(null);
  }
  async function inviteCoordinator() {
    if (!coordPick) return;
    await run('invite-coord', `Invitation sent to ${coordPick.name}. They can accept or decline.`, () => coordinatorRequestsApi.invite(club._id, coordPick._id));
    setCoordPick(null);
  }
  async function addMember() {
    if (!memberPick) return;
    await run('add-member', `${memberPick.name} was added to the club.`, () => clubsApi.addMember(club._id, memberPick._id));
    setMemberPick(null);
  }

  if (isLoading) return <Spinner full />;
  if (error || !club) {
    return (
      <div className="p-8">
        <EmptyState title="Club not found" description={error} />
      </div>
    );
  }

  const regularMembers = members.filter((m) => m.role !== 'coordinator');

  return (
    <>
      <TopBar title={club.name} subtitle={`${club.category} · ${club.memberCount} members`} />

      <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to="/admin/clubs" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
            <ArrowLeft size={15} /> Back to clubs
          </Link>
          <div className="flex items-center gap-2">
            <Badge status={club.status} />
            <Link to={`/clubs/${club.slug}`} className="text-sm font-medium text-primary hover:underline">View public page</Link>
          </div>
        </div>

        {notice && (
          <div role="status" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${notice.type === 'success' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
            {notice.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {notice.text}
          </div>
        )}

        {/* Coordinators */}
        <Card>
          <p className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-ink"><ShieldCheck size={16} /> Coordinators</p>

          {club.coordinators?.length === 0 ? (
            <p className="mb-4 text-sm text-ink-muted">This club has no coordinator yet.</p>
          ) : (
            <ul className="mb-4 divide-y divide-border">
              {club.coordinators.map((c) => (
                <li key={c._id} className="flex items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar user={c} size="md" />
                    <div className="min-w-0">
                      <Link to={`/admin/users/${c._id}`} className="block truncate text-sm font-medium text-ink hover:underline">{c.name}</Link>
                      <p className="truncate text-xs text-ink-muted">{c.email}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" disabled={busyKey === `rm-coord-${c._id}`} onClick={() => run(`rm-coord-${c._id}`, `${c.name} was removed as coordinator.`, () => clubsApi.removeCoordinator(club._id, c._id))}>
                    <UserMinus size={13} /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="mb-2 text-sm font-medium text-ink">Add a coordinator</p>
            <UserPicker value={coordPick} onChange={setCoordPick} placeholder="Search staff or students by name/email..." />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" disabled={!coordPick || busyKey === 'assign-coord'} onClick={assignCoordinator}>
                <UserPlus size={14} /> Assign now
              </Button>
              <Button size="sm" variant="outline" disabled={!coordPick || busyKey === 'invite-coord'} onClick={inviteCoordinator}>
                <Send size={14} /> Send invitation instead
              </Button>
            </div>
            <p className="mt-2 text-xs text-ink-muted">“Assign now” makes them coordinator immediately. “Send invitation” lets them accept or decline first.</p>
          </div>
        </Card>

        {/* Members */}
        <Card>
          <p className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-ink"><Users2 size={16} /> Members ({regularMembers.length})</p>

          {regularMembers.length === 0 ? (
            <p className="mb-4 text-sm text-ink-muted">No members besides the coordinator.</p>
          ) : (
            <ul className="mb-4 divide-y divide-border">
              {regularMembers.map((m) => (
                <li key={m._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar user={m.user} size="md" />
                    <div className="min-w-0">
                      <Link to={`/admin/users/${m.user?._id}`} className="block truncate text-sm font-medium text-ink hover:underline">{m.user?.name}</Link>
                      <p className="truncate text-xs text-ink-muted">{m.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={m.officerTitle || ''}
                      disabled={busyKey === `title-${m.user?._id}`}
                      onChange={(e) => run(`title-${m.user._id}`, 'Position updated.', () => clubsApi.setOfficerTitle(club._id, m.user._id, e.target.value))}
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
                      aria-label={`Position for ${m.user?.name}`}
                    >
                      {COMMON_TITLES.map((t) => <option key={t} value={t}>{t || 'Member'}</option>)}
                      {m.officerTitle && !COMMON_TITLES.includes(m.officerTitle) && <option value={m.officerTitle}>{m.officerTitle}</option>}
                    </select>
                    <Button size="sm" variant="outline" disabled={busyKey === `rm-${m.user?._id}`} onClick={() => run(`rm-${m.user._id}`, `${m.user.name} was removed from the club.`, () => clubsApi.removeMember(club._id, m.user._id))}>
                      <UserMinus size={13} /> Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg border border-dashed border-border p-4">
            <p className="mb-2 text-sm font-medium text-ink">Add a student to this club</p>
            <UserPicker value={memberPick} onChange={setMemberPick} placeholder="Search students by name/email..." />
            <Button size="sm" className="mt-3" disabled={!memberPick || busyKey === 'add-member'} onClick={addMember}>
              <UserPlus size={14} /> Add to club
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}
