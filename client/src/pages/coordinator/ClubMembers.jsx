import { useEffect, useState, useCallback } from 'react';
import { Users2, UserMinus, UserPlus } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import UserPicker from '../../components/ui/UserPicker';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { membershipInvitesApi } from '../../api/invites.api';

const COMMON_TITLES = ['', 'President', 'Vice President', 'Treasurer', 'Secretary'];

export default function ClubMembers() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteUser, setInviteUser] = useState(null);
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteCustomTitle, setInviteCustomTitle] = useState('');
  const [inviteMsg, setInviteMsg] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await clubsApi.mine();
      const myClub = data.data.clubs[0];
      setClub(myClub || null);

      if (myClub) {
        const membersRes = await clubsApi.getMembers(myClub._id, { limit: 100 });
        setMembers(membersRes.data.data.members);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRemove(userId) {
    if (!club) return;
    setActioningId(userId);
    try {
      await clubsApi.removeMember(club._id, userId);
      await load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleSetTitle(userId, officerTitle) {
    if (!club) return;
    setActioningId(userId);
    try {
      await clubsApi.setOfficerTitle(club._id, userId, officerTitle);
      await load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    if (!club || !inviteUser) return;
    const title = inviteTitle === '__custom' ? inviteCustomTitle : inviteTitle;
    setInviteMsg('');
    try {
      await membershipInvitesApi.invite(club._id, inviteUser._id, title);
      setInviteMsg('Invite sent.');
      setInviteUser(null);
      setInviteTitle('');
      setInviteCustomTitle('');
    } catch (err) {
      setInviteMsg(err.response?.data?.message || 'Could not send invite.');
    }
  }

  if (isLoading) return <Spinner full />;

  if (!club) {
    return (
      <>
        <TopBar title="Members" />
        <div className="p-8">
          <EmptyState
            icon={Users2}
            title="You're not assigned to a club yet"
            description="An admin needs to assign you as a coordinator before you can manage members."
          />
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar
        title="Members"
        subtitle={`${club.name} · ${members.length} active member(s)`}
        actions={
          <Button size="sm" variant="outline" onClick={() => setInviteOpen((o) => !o)}>
            <UserPlus size={15} /> Invite member
          </Button>
        }
      />
      <div className="space-y-6 p-8">
        {inviteOpen && (
          <Card>
            <p className="mb-3 font-display text-sm font-semibold text-ink">Invite a student</p>
            <form onSubmit={handleSendInvite} className="space-y-3">
              {inviteMsg && <p className="text-sm text-ink-muted">{inviteMsg}</p>}
              <UserPicker value={inviteUser} onChange={setInviteUser} />
              <div className="flex items-center gap-2">
                <select
                  value={inviteTitle}
                  onChange={(e) => setInviteTitle(e.target.value)}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                >
                  {COMMON_TITLES.map((t) => (
                    <option key={t} value={t}>
                      {t || 'Member (no title)'}
                    </option>
                  ))}
                  <option value="__custom">Custom...</option>
                </select>
                {inviteTitle === '__custom' && (
                  <Input
                    placeholder="Position title"
                    value={inviteCustomTitle}
                    onChange={(e) => setInviteCustomTitle(e.target.value)}
                  />
                )}
              </div>
              <Button type="submit" size="sm" disabled={!inviteUser}>
                Send invite
              </Button>
            </form>
          </Card>
        )}

        {members.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No members yet"
            description="Members are added automatically when you accept an application, or you can invite them directly."
          />
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-primary/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Position</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{m.user?.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{m.user?.email}</td>
                    <td className="px-4 py-3">
                      {m.role === 'coordinator' ? (
                        <span className="text-ink-muted">Coordinator</span>
                      ) : (
                        <select
                          value={m.officerTitle || ''}
                          disabled={actioningId === m.user?._id}
                          onChange={(e) => handleSetTitle(m.user._id, e.target.value)}
                          className="rounded-md border border-border bg-surface px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50 disabled:opacity-50"
                        >
                          {COMMON_TITLES.map((t) => (
                            <option key={t} value={t}>
                              {t || 'Member'}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{new Date(m.joinedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {m.role !== 'coordinator' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actioningId === m.user?._id}
                          onClick={() => handleRemove(m.user._id)}
                        >
                          <UserMinus size={13} /> Remove
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </>
  );
}
