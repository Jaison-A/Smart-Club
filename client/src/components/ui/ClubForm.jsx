import { useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, Tag as TagIcon, X } from 'lucide-react';
import Card from './Card';
import Input from './Input';
import Textarea from './Textarea';
import Button from './Button';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Literary', 'Social Service', 'General'];

const REQUIREMENTS = ['Must have a faculty advisor', 'Minimum 4 members required', 'Admin approval needed'];

// Shared by CreateClub and EditClub. Two-column layout from the design:
// "Club Details" on the left, "Requirements" (faculty advisor + confirmation)
// on the right. `onSubmit` receives the payload and owns the API call, so
// this component stays presentational. `requireConfirmation` is on for
// new clubs only.
export default function ClubForm({ initialValues, onSubmit, submitLabel, disableName = false, requireConfirmation = false }) {
  const [form, setForm] = useState({
    name: initialValues?.name || '',
    category: initialValues?.category || 'General',
    description: initialValues?.description || '',
    vision: initialValues?.vision || '',
    mission: initialValues?.mission || '',
    logoUrl: initialValues?.logoUrl || '',
    coverImageUrl: initialValues?.coverImageUrl || '',
    facultyAdvisor: {
      name: initialValues?.facultyAdvisor?.name || '',
      email: initialValues?.facultyAdvisor?.email || '',
      designation: initialValues?.facultyAdvisor?.designation || '',
    },
    socialLinks: {
      instagram: initialValues?.socialLinks?.instagram || '',
      linkedin: initialValues?.socialLinks?.linkedin || '',
      github: initialValues?.socialLinks?.github || '',
      website: initialValues?.socialLinks?.website || '',
    },
  });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(initialValues?.tags || []);
  const [confirmed, setConfirmed] = useState(!requireConfirmation);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const setNested = (group) => (e) => setForm((f) => ({ ...f, [group]: { ...f[group], [e.target.name]: e.target.value } }));

  function addTag(e) {
    e.preventDefault();
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags((t) => [...t, value]);
    setTagInput('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (requireConfirmation) {
      if (!form.facultyAdvisor.name.trim()) {
        setError('Please add your faculty advisor before submitting.');
        return;
      }
      if (!confirmed) {
        setError('Please confirm the requirements before submitting.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const socialLinks = Object.fromEntries(Object.entries(form.socialLinks).filter(([, v]) => v.trim() !== ''));
      await onSubmit({ ...form, tags, socialLinks });
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (Array.isArray(backendErrors)) {
        const mapped = {};
        backendErrors.forEach((fe) => {
          if (fe.field) mapped[fe.field] = fe.message;
        });
        setFieldErrors(mapped);
      }
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-sm text-danger">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          <p className="font-display text-base font-semibold text-ink">Club Details</p>

          <Input id="name" name="name" label="Club Name *" placeholder="Enter club name" value={form.name} onChange={setField} error={fieldErrors.name} disabled={disableName} required />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="category" className="text-sm font-medium text-ink">Category *</label>
            <select id="category" name="category" value={form.category} onChange={setField} className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <Textarea id="description" name="description" label="Description *" rows={3} placeholder="Tell us about your club..." value={form.description} onChange={setField} error={fieldErrors.description} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Textarea id="vision" name="vision" label="Vision" rows={2} value={form.vision} onChange={setField} />
            <Textarea id="mission" name="mission" label="Mission" rows={2} value={form.mission} onChange={setField} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink">Skills / domains</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <TagIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
                  placeholder="e.g. React, Robotics, Design"
                  className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>
              <Button type="button" variant="outline" onClick={addTag}>Add</Button>
            </div>
            {tags.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    {tag}
                    <button type="button" onClick={() => setTags((t) => t.filter((x) => x !== tag))} aria-label={`Remove ${tag}`}><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input id="logoUrl" name="logoUrl" label="Logo URL (optional)" placeholder="https://..." value={form.logoUrl} onChange={setField} />
            <Input id="coverImageUrl" name="coverImageUrl" label="Banner URL (optional)" placeholder="https://..." value={form.coverImageUrl} onChange={setField} />
          </div>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-medium text-ink">Social links (optional)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input name="instagram" placeholder="Instagram URL" value={form.socialLinks.instagram} onChange={setNested('socialLinks')} />
              <Input name="linkedin" placeholder="LinkedIn URL" value={form.socialLinks.linkedin} onChange={setNested('socialLinks')} />
              <Input name="github" placeholder="GitHub URL" value={form.socialLinks.github} onChange={setNested('socialLinks')} />
              <Input name="website" placeholder="Website URL" value={form.socialLinks.website} onChange={setNested('socialLinks')} />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <p className="font-display text-base font-semibold text-ink">Requirements</p>
            <Input name="name" label={`Faculty Advisor${requireConfirmation ? ' *' : ''}`} placeholder="Advisor's full name" value={form.facultyAdvisor.name} onChange={setNested('facultyAdvisor')} />
            <Input name="designation" label="Designation" placeholder="e.g. Assistant Professor, CSE" value={form.facultyAdvisor.designation} onChange={setNested('facultyAdvisor')} />
            <Input name="email" type="email" label="Advisor email" placeholder="advisor@college.edu" value={form.facultyAdvisor.email} onChange={setNested('facultyAdvisor')} />

            {requireConfirmation && (
              <>
                <ul className="space-y-2 rounded-lg border border-border bg-canvas/50 p-3">
                  {REQUIREMENTS.map((r) => (
                    <li key={r} className="flex items-center gap-2 text-sm text-ink-muted">
                      <CheckCircle2 size={15} className="shrink-0 text-success" /> {r}
                    </li>
                  ))}
                </ul>
                <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-muted">
                  <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
                  I confirm that I have a faculty advisor and at least 4 members who are willing to be part of this club.
                </label>
                <p className="flex items-start gap-2 rounded-lg bg-success-bg px-3 py-2 text-xs text-success">
                  <ShieldCheck size={14} className="mt-0.5 shrink-0" /> Your club will be reviewed by the admin before it goes live.
                </p>
              </>
            )}
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
            {!isSubmitting && <ArrowRight size={17} />}
          </Button>
        </div>
      </div>
    </form>
  );
}
