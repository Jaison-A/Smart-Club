import { useEffect, useState, useCallback } from 'react';
import { Users2, UserMinus } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';

export default function ClubMembers() {
  const { user } = useAuth();
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await clubsApi.list({ limit: 50 });
      const myClub = data.data.clubs.find((c) =>
        c.coordinators?.some((id) => id === user.id || id === user._id)
      );
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
      <TopBar title="Members" subtitle={`${club.name} · ${members.length} active member(s)`} />
      <div className="p-8">
        {members.length === 0 ? (
          <EmptyState
            icon={Users2}
            title="No members yet"
            description="Members are added automatically when you accept an application, or you can add them manually."
          />
        ) : (
          <Card className="overflow-hidden !p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-primary/5 text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-ink">{m.user?.name}</td>
                    <td className="px-4 py-3 text-ink-muted">{m.user?.email}</td>
                    <td className="px-4 py-3 capitalize text-ink-muted">{m.role}</td>
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
