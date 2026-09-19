import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import ClubForm from '../../components/ui/ClubForm';
import Button from '../../components/ui/Button';
import { clubsApi } from '../../api/clubs.api';

export default function CreateClub() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  async function handleCreate(payload) {
    await clubsApi.create(payload);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <CheckCircle2 className="text-success" size={40} />
        <h1 className="font-display text-xl font-semibold text-ink">Club submitted for review</h1>
        <p className="max-w-sm text-sm text-ink-muted">
          An admin will review your club shortly. You've been made its coordinator, and you'll be
          able to manage it as soon as it's approved.
        </p>
        <Button onClick={() => navigate('/coordinator')} className="mt-2">
          Go to your dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Create a Club" subtitle="Submit your club for admin review." />
      <div className="mx-auto max-w-2xl p-8">
        <ClubForm onSubmit={handleCreate} submitLabel="Submit for review" />
      </div>
    </>
  );
}
