import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ClipboardList, ExternalLink, FileText } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { recruitmentApi } from '../../api/recruitment.api';

const STATUS_TABS = ['submitted', 'shortlisted', 'interview', 'accepted', 'rejected'];

// The decisions a coordinator can move an application to from wherever
// it currently sits. 'submitted' is excluded as a target -- it's only
// ever the starting state, matching the backend's own validation.
const NEXT_ACTIONS = {
  submitted: ['shortlisted', 'rejected'],
  shortlisted: ['interview', 'rejected'],
  interview: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
};

export default function ApplicationsReview() {
  const { driveId } = useParams();
  const [drive, setDrive] = useState(null);
  const [tab, setTab] = useState('submitted');
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [driveRes, appsRes] = await Promise.all([
        recruitmentApi.getDrive(driveId),
        recruitmentApi.listApplicationsForDrive(driveId, { status: tab, limit: 100 }),
      ]);
      setDrive(driveRes.data.data.drive);
      setApplications(appsRes.data.data.applications);
    } catch {
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  }, [driveId, tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDecision(applicationId, status) {
    setActioningId(applicationId);
    try {
      await recruitmentApi.updateApplicationStatus(applicationId, { status });
      await load();
    } finally {
      setActioningId(null);
    }
  }

  return (
    <>
      <TopBar title="Review Applications" subtitle={drive?.title} />

      <div className="p-8">
        <Link to="/coordinator" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <div className="mb-6 flex gap-1 border-b border-border">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'border-accent text-ink' : 'border-transparent text-ink-muted hover:text-ink'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner />
        ) : applications.length === 0 ? (
          <EmptyState icon={ClipboardList} title={`No ${tab} applications`} description="Nothing to show in this tab." />
        ) : (
          <div className="space-y-3">
            {applications.map((app) => {
              const isExpanded = expandedId === app._id;
              return (
                <Card key={app._id}>
                  <div className="flex items-start justify-between gap-4">
                    <button
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      onClick={() => setExpandedId(isExpanded ? null : app._id)}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-display text-sm font-semibold text-primary">
                        {app.applicant?.name?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-ink">{app.applicant?.name}</p>
                        <p className="text-xs text-ink-muted">
                          {app.applicant?.email} &middot; {app.applicant?.department}
                          {app.applicant?.year ? `, Year ${app.applicant.year}` : ''}
                        </p>
                        {app.applicant?.skills?.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {app.applicant.skills.slice(0, 5).map((s) => (
                              <Badge key={s} tone="neutral">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          <FileText size={13} /> Resume <ExternalLink size={11} />
                        </a>
                      )}
                      {NEXT_ACTIONS[app.status].map((nextStatus) => (
                        <Button
                          key={nextStatus}
                          size="sm"
                          variant={nextStatus === 'rejected' ? 'outline' : 'primary'}
                          disabled={actioningId === app._id}
                          onClick={() => handleDecision(app._id, nextStatus)}
                        >
                          {nextStatus === 'shortlisted' && 'Shortlist'}
                          {nextStatus === 'interview' && 'Move to interview'}
                          {nextStatus === 'accepted' && 'Select'}
                          {nextStatus === 'rejected' && 'Reject'}
                        </Button>
                      ))}
                      {NEXT_ACTIONS[app.status].length === 0 && <Badge status={app.status} />}
                    </div>
                  </div>

                  {isExpanded && app.responses?.length > 0 && (
                    <div className="mt-4 space-y-3 border-t border-border pt-4">
                      {app.responses.map((r) => (
                        <div key={r.field}>
                          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{r.field}</p>
                          <p className="mt-0.5 text-sm text-ink">{r.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
