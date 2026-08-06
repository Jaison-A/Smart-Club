import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { recruitmentApi } from '../../api/recruitment.api';

export default function ApplyToDrive() {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const [drive, setDrive] = useState(null);
  const [responses, setResponses] = useState({});
  const [resumeUrl, setResumeUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    recruitmentApi
      .getDrive(driveId)
      .then(({ data }) => setDrive(data.data.drive))
      .catch(() => setError('This recruitment drive could not be found.'))
      .finally(() => setIsLoading(false));
  }, [driveId]);

  function handleFieldChange(label, value) {
    setResponses((r) => ({ ...r, [label]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = {
        responses: Object.entries(responses).map(([field, value]) => ({ field, value })),
        resumeUrl: resumeUrl || undefined,
      };
      await recruitmentApi.apply(driveId, payload);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong submitting your application.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <Spinner full />;

  if (!drive) {
    return (
      <div className="p-8">
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <CheckCircle2 className="text-success" size={40} />
        <h1 className="font-display text-xl font-semibold text-ink">Application submitted</h1>
        <p className="text-sm text-ink-muted">
          The {drive.club?.name} coordinators will review it and update your status.
        </p>
        <Button variant="outline" onClick={() => navigate('/student')} className="mt-2">
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <TopBar title={drive.title} subtitle={`Applying to ${drive.club?.name}`} />

      <div className="mx-auto max-w-2xl p-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={15} /> Back
        </button>

        <Card>
          <p className="text-sm leading-relaxed text-ink-muted">{drive.description}</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            {drive.formFields?.map((field) => (
              <div key={field.label}>
                {field.type === 'textarea' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink">
                      {field.label} {field.required && <span className="text-danger">*</span>}
                    </label>
                    <textarea
                      required={field.required}
                      rows={4}
                      onChange={(e) => handleFieldChange(field.label, e.target.value)}
                      className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                ) : field.type === 'select' ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-ink">
                      {field.label} {field.required && <span className="text-danger">*</span>}
                    </label>
                    <select
                      required={field.required}
                      onChange={(e) => handleFieldChange(field.label, e.target.value)}
                      className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="">Select an option</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <Input
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'}
                    required={field.required}
                    onChange={(e) => handleFieldChange(field.label, e.target.value)}
                  />
                )}
              </div>
            ))}

            <Input
              label="Resume link (optional)"
              type="url"
              placeholder="https://..."
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit application'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
