import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, ArrowUpRight } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { recruitmentApi } from '../../api/recruitment.api';

// Students see every open drive across all clubs, with a direct Apply
// action. Coordinators/admins land here to review activity across
// clubs — deep management (editing a drive, reviewing applications)
// still happens from the coordinator dashboard/club-scoped views, this
// page is the cross-club overview for both audiences.
export default function RecruitmentPage() {
  const { user } = useAuth();
  const [drives, setDrives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await clubsApi.list({ limit: 50 });
        const results = await Promise.all(
          data.data.clubs.map((club) =>
            recruitmentApi
              .listDrivesForClub(club._id, { status: 'open' })
              .then((res) => res.data.data.drives.map((d) => ({ ...d, club })))
              .catch(() => [])
          )
        );
        if (!cancelled) setDrives(results.flat());
      } catch {
        if (!cancelled) setDrives([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isStudent = user?.role === 'student';

  return (
    <>
      <TopBar
        title="Recruitment"
        subtitle={isStudent ? 'Open drives across every club' : 'Recruitment activity across all clubs'}
      />

      <div className="p-8">
        {isLoading ? (
          <Spinner />
        ) : drives.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No open drives right now"
            description="Check back soon — clubs post new recruitment drives throughout the semester."
          />
        ) : (
          <div className="space-y-3">
            {drives.map((drive) => (
              <Card key={drive._id} accent>
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold text-ink">{drive.title}</p>
                      <Badge status={drive.status} />
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {drive.club.name} &middot; Closes {new Date(drive.closeDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      to={`/clubs/${drive.club.slug}`}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      View club <ArrowUpRight size={14} />
                    </Link>
                    {isStudent && (
                      <Link to={`/recruitment/${drive._id}/apply`}>
                        <Button size="sm">Apply</Button>
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
