import { useEffect, useState, useCallback } from 'react';
import { Mail, Check, X, ShieldCheck, Users2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { coordinatorRequestsApi, membershipInvitesApi } from '../../api/invites.api';

export default function Invites() {
  const [coordinatorInvites, setCoordinatorInvites] = useState([]);
  const [membershipInvites, setMembershipInvites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [coordRes, memberRes] = await Promise.all([
        coordinatorRequestsApi.listMine(),
        membershipInvitesApi.listMine(),
      ]);
      setCoordinatorInvites(coordRes.data.data.requests.filter((r) => r.status === 'pending'));
      setMembershipInvites(memberRes.data.data.invites);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCoordinatorResponse(requestId, accept) {
    setActioningId(requestId);
    try {
      await (accept ? coordinatorRequestsApi.accept(requestId) : coordinatorRequestsApi.reject(requestId));
      await load();
    } finally {
      setActioningId(null);
    }
  }

  async function handleMembershipResponse(inviteId, accept) {
    setActioningId(inviteId);
    try {
      await (accept ? membershipInvitesApi.accept(inviteId) : membershipInvitesApi.reject(inviteId));
      await load();
    } finally {
      setActioningId(null);
    }
  }

  const hasNothing = coordinatorInvites.length === 0 && membershipInvites.length === 0;

  return (
    <>
      <TopBar title="Invites" subtitle="Invitations sent to you by clubs and admins." />

      <div className="space-y-6 p-8">
        {isLoading ? (
          <Spinner />
        ) : hasNothing ? (
          <EmptyState icon={Mail} title="No pending invites" description="Invitations to coordinate or join a club will show up here." />
        ) : (
          <>
            {coordinatorInvites.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
                  <ShieldCheck size={17} /> Coordinator invitations
                </h2>
                <div className="space-y-3">
                  {coordinatorInvites.map((req) => (
                    <Card key={req._id} accent>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-ink">
                            You've been invited to coordinate <strong>{req.club?.name}</strong>
                          </p>
                          {req.message && <p className="mt-1 text-xs text-ink-muted">"{req.message}"</p>}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            disabled={actioningId === req._id}
                            onClick={() => handleCoordinatorResponse(req._id, true)}
                          >
                            <Check size={14} /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === req._id}
                            onClick={() => handleCoordinatorResponse(req._id, false)}
                          >
                            <X size={14} /> Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {membershipInvites.length > 0 && (
              <div>
                <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
                  <Users2 size={17} /> Membership invitations
                </h2>
                <div className="space-y-3">
                  {membershipInvites.map((inv) => (
                    <Card key={inv._id} accent>
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-medium text-ink">
                          You've been invited to join <strong>{inv.club?.name}</strong>
                          {inv.officerTitle ? ` as ${inv.officerTitle}` : ''}
                        </p>
                        <div className="flex shrink-0 gap-2">
                          <Button
                            size="sm"
                            disabled={actioningId === inv._id}
                            onClick={() => handleMembershipResponse(inv._id, true)}
                          >
                            <Check size={14} /> Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actioningId === inv._id}
                            onClick={() => handleMembershipResponse(inv._id, false)}
                          >
                            <X size={14} /> Decline
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
