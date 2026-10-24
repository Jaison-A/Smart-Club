import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ExternalLink, FileText } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import ClubLogo from '../../components/ui/ClubLogo';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { recruitmentApi } from '../../api/recruitment.api';

// Tabs group the five backend statuses into the three the design shows.
const TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'pending', label: 'Pending', match: (s) => ['submitted', 'shortlisted', 'interview'].includes(s) },
  { key: 'accepted', label: 'Accepted', match: (s) => s === 'accepted' },
  { key: 'rejected', label: 'Rejected', match: (s) => s === 'rejected' },
];

export default function MyApplications() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [tab, setTab] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    recruitmentApi
      .listApplicationsForUser(user._id || user.id, { limit: 100 })
      .then(({ data }) => setApplications(data.data.applications))
      .catch(() => setApplications([]))
      .finally(() => setIsLoading(false));
  }, [user._id, user.id]);

  const active = TABS.find((t) => t.key === tab);
  const visible = applications.filter((a) => active.match(a.status));

  return (
    <>
      <TopBar title="My Applications" subtitle="Track every club application in one place." />

      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <div className="mb-5 flex flex-wrap gap-2" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? 'gradient-primary text-onprimary' : 'border border-border text-ink-muted hover:text-ink'}`}
            >
              {t.label} <span className="opacity-70">({applications.filter((a) => t.match(a.status)).length})</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No applications here"
            description="Apply to an open recruitment drive and it will show up in this list."
            action={<Link to="/recruitment" className="text-sm font-medium text-primary hover:underline">Browse openings</Link>}
          />
        ) : (
          <div className="space-y-3">
            {visible.map((app) => (
              <Card key={app._id}>
                <div className="flex items-center gap-4">
                  <ClubLogo club={app.club} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-ink">{app.club?.name}</p>
                    <p className="truncate text-sm text-ink-muted">{app.drive?.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">Applied on {new Date(app.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                  </div>
                  <Badge status={app.status} />
                  {app.club?.slug && (
                    <Link to={`/clubs/${app.club.slug}`} aria-label={`Open ${app.club.name}`}>
                      <ChevronRight size={18} className="text-ink-muted hover:text-ink" />
                    </Link>
                  )}
                </div>
                {app.reviewNotes && (
                  <p className="mt-3 rounded-lg bg-primary/5 px-3 py-2 text-xs text-ink-muted">
                    <span className="font-medium text-ink">Note from coordinator:</span> {app.reviewNotes}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
        <p className="mt-6 flex items-center gap-1 text-xs text-ink-muted">
          <ExternalLink size={12} /> Applications made through an external form (e.g. Google Forms) are tracked by the club, not here.
        </p>
      </div>
    </>
  );
}
