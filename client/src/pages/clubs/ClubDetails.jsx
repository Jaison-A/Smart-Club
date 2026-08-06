import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users2, Link as LinkIcon, Globe, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { clubsApi } from '../../api/clubs.api';
import { recruitmentApi } from '../../api/recruitment.api';

export default function ClubDetails() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuth();
  const [club, setClub] = useState(null);
  const [drives, setDrives] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data } = await clubsApi.getBySlug(slug);
        if (cancelled) return;
        setClub(data.data.club);

        const drivesRes = await recruitmentApi.listDrivesForClub(data.data.club._id, { status: 'open' });
        if (!cancelled) setDrives(drivesRes.data.data.drives);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (isLoading) return <Spinner full />;

  if (notFound || !club) {
    return (
      <div className="p-8">
        <EmptyState title="Club not found" description="This club may have been removed or the link is incorrect." />
      </div>
    );
  }

  const isStudent = isAuthenticated && user.role === 'student';

  return (
    <div>
      {/* Cover */}
      <div
        className="h-40 w-full bg-primary sm:h-56"
        style={
          club.coverImageUrl
            ? { backgroundImage: `url(${club.coverImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}
        }
      />

      <div className="mx-auto max-w-5xl px-6 pb-12 sm:px-8">
        <Link to="/clubs" className="mt-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink">
          <ArrowLeft size={15} /> Back to all clubs
        </Link>

        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border-4 border-canvas bg-surface font-display text-2xl font-bold text-primary shadow-sm">
              {club.logoUrl ? (
                <img src={club.logoUrl} alt={club.name} className="h-full w-full rounded-md object-cover" />
              ) : (
                club.name?.[0]
              )}
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">{club.name}</h1>
              <p className="text-sm text-ink-muted">{club.category}</p>
            </div>
          </div>

          {(club.socialLinks?.instagram || club.socialLinks?.linkedin || club.socialLinks?.website) && (
            <div className="flex gap-1.5">
              {club.socialLinks.instagram && (
                <a
                  href={club.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border p-2 text-ink-muted hover:text-ink"
                  aria-label="Instagram"
                >
                  <LinkIcon size={16} />
                </a>
              )}
              {club.socialLinks.linkedin && (
                <a
                  href={club.socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border p-2 text-ink-muted hover:text-ink"
                  aria-label="LinkedIn"
                >
                  <LinkIcon size={16} />
                </a>
              )}
              {club.socialLinks.website && (
                <a
                  href={club.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-md border border-border p-2 text-ink-muted hover:text-ink"
                >
                  <Globe size={16} />
                </a>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <h2 className="font-display text-base font-semibold text-ink">About</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{club.description}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {club.tags?.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Card>

            <Card>
              <h2 className="font-display text-base font-semibold text-ink">Open Recruitment</h2>
              {drives.length === 0 ? (
                <EmptyState
                  icon={Users2}
                  title="No open drives right now"
                  description="Check back later, or explore other clubs that are actively recruiting."
                />
              ) : (
                <ul className="mt-3 divide-y divide-border">
                  {drives.map((drive) => (
                    <li key={drive._id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{drive.title}</p>
                        <p className="text-xs text-ink-muted">
                          Closes {new Date(drive.closeDate).toLocaleDateString()}
                        </p>
                      </div>
                      {isStudent ? (
                        <Link to={`/recruitment/${drive._id}/apply`}>
                          <Button size="sm">Apply</Button>
                        </Link>
                      ) : (
                        <Badge status={drive.status} />
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="h-fit">
            <div className="flex items-center gap-2 text-ink-muted">
              <Users2 size={16} />
              <span className="text-sm">Members</span>
            </div>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">{club.memberCount}</p>

            {club.coordinators?.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Coordinators</p>
                <ul className="mt-2 space-y-2">
                  {club.coordinators.map((coord) => (
                    <li key={coord._id} className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {coord.name?.[0]}
                      </div>
                      <span className="text-sm text-ink">{coord.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
