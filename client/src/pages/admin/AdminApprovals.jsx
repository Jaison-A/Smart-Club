import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { clubsApi } from '../../api/clubs.api';

export default function AdminApprovals() {
  const [pendingClubs, setPendingClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState('');

  const loadPendingClubs = async () => {
    try {
      const { data } = await clubsApi.list({ status: 'pending', limit: 100 });
      setPendingClubs(data.data.clubs);
    } catch {
      setPendingClubs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPendingClubs();
  }, []);

  const handleStatusChange = async (club, nextStatus) => {
    setProcessingId(club._id);
    setMessage('');

    try {
      await clubsApi.update(club._id, { status: nextStatus });
      setPendingClubs((current) => current.filter((item) => item._id !== club._id));
      setMessage(
        nextStatus === 'active'
          ? `${club.name} has been approved.`
          : `${club.name} has been rejected and archived.`
      );
    } catch {
      setMessage(`Failed to update ${club.name}. Please try again.`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <>
      <TopBar
        title="Club Approvals"
        subtitle="Review club submissions and approve or reject them."
      />

      <div className="space-y-6 p-8">
        {message && (
          <div className="rounded-md border border-border bg-primary/5 px-4 py-3 text-sm text-ink">
            {message}
          </div>
        )}

        <Card>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : pendingClubs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No pending approvals"
              description="All submitted clubs have already been reviewed."
            />
          ) : (
            <div className="space-y-4">
              {pendingClubs.map((club) => (
                <div
                  key={club._id}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-base font-semibold text-ink">{club.name}</p>
                        <Badge status={club.status} />
                      </div>

                      <p className="mt-1 text-xs text-ink-muted">{club.category}</p>

                      {club.description && (
                        <p className="mt-3 text-sm text-ink-muted">{club.description}</p>
                      )}

                      {club.tags?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {club.tags.map((tag) => (
                            <Badge key={`${club._id}-${tag}`} tone="neutral">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={processingId === club._id}
                        onClick={() => handleStatusChange(club, 'active')}
                      >
                        <CheckCircle2 size={16} />
                        Approve
                      </Button>

                      <Button
                        variant="danger"
                        size="sm"
                        disabled={processingId === club._id}
                        onClick={() => handleStatusChange(club, 'archived')}
                      >
                        <XCircle size={16} />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
