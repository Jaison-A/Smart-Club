import { useEffect, useState, useCallback } from 'react';
import { ShieldCheck, Check, X, Ban, RotateCcw } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';

const TABS = [
  { key: 'pending', label: 'Pending' },
  { key: 'active', label: 'Active' },
  { key: 'suspended', label: 'Suspended' },
  { key: 'rejected', label: 'Rejected' },
];

export default function ClubApprovals() {
  const [tab, setTab] = useState('pending');
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await clubsApi.list({ status: tab, limit: 50 });
      setClubs(data.data.clubs);
    } catch {
      setClubs([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function runAction(id, action) {
    setActioningId(id);
    try {
      await action(id);
      await load();
    } finally {
      setActioningId(null);
      setRejectingId(null);
      setRejectReason('');
    }
  }

  return (
    <>
      <TopBar title="Club Approvals" subtitle="Review and manage clubs across the platform." />

      <div className="p-8">
        <div className="mb-6 flex gap-1 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'border-accent text-ink'
                  : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner />
        ) : clubs.length === 0 ? (
          <EmptyState icon={ShieldCheck} title={`No ${tab} clubs`} description="Nothing to show in this tab right now." />
        ) : (
          <div className="space-y-3">
            {clubs.map((club) => (
              <Card key={club._id}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold text-ink">{club.name}</p>
                      <Badge status={club.status} />
                      <Badge tone="neutral">{club.category}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{club.description}</p>
                    {club.status === 'rejected' && club.rejectionReason && (
                      <p className="mt-1.5 text-xs text-danger">Reason: {club.rejectionReason}</p>
                    )}

                    {rejectingId === club._id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          autoFocus
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Reason for rejection (optional)"
                          className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={actioningId === club._id}
                          onClick={() => runAction(club._id, (id) => clubsApi.reject(id, rejectReason))}
                        >
                          Confirm reject
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setRejectingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>

                  {rejectingId !== club._id && (
                    <div className="flex shrink-0 items-center gap-2">
                      {club.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            disabled={actioningId === club._id}
                            onClick={() => runAction(club._id, clubsApi.approve)}
                          >
                            <Check size={15} /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setRejectingId(club._id)}>
                            <X size={15} /> Reject
                          </Button>
                        </>
                      )}
                      {club.status === 'active' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actioningId === club._id}
                          onClick={() => runAction(club._id, clubsApi.suspend)}
                        >
                          <Ban size={15} /> Suspend
                        </Button>
                      )}
                      {club.status === 'suspended' && (
                        <Button
                          size="sm"
                          disabled={actioningId === club._id}
                          onClick={() => runAction(club._id, clubsApi.restore)}
                        >
                          <RotateCcw size={15} /> Restore
                        </Button>
                      )}
                      {club.status === 'rejected' && (
                        <Button
                          size="sm"
                          disabled={actioningId === club._id}
                          onClick={() => runAction(club._id, clubsApi.approve)}
                        >
                          <Check size={15} /> Approve anyway
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
