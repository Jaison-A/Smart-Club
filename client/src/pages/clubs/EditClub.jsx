import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClubForm from '../../components/ui/ClubForm';
import Spinner from '../../components/ui/Spinner';
import { clubsApi } from '../../api/clubs.api';

export default function EditClub() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    clubsApi
      .getBySlug(slug)
      .then(({ data }) => setClub(data.data.club))
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [slug]);

  async function handleUpdate(payload) {
    await clubsApi.update(club._id, payload);
    setSaved(true);
    setTimeout(() => navigate('/coordinator'), 1200);
  }

  if (isLoading) return <Spinner full />;

  if (notFound || !club) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">Club not found.</p>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 className="text-success" size={40} />
        <p className="font-display text-lg font-semibold text-ink">Club updated</p>
      </div>
    );
  }

  return (
    <>
      <TopBar title={`Edit ${club.name}`} subtitle="Update your club's information." />
      <div className="mx-auto max-w-2xl p-8">
        <ClubForm initialValues={club} onSubmit={handleUpdate} submitLabel="Save changes" disableName />
      </div>
    </>
  );
}
