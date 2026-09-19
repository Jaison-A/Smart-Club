import { useState } from 'react';
import { AlertCircle, Tag as TagIcon, X } from 'lucide-react';
import Card from './Card';
import Input from './Input';
import Textarea from './Textarea';
import Button from './Button';

const CATEGORIES = ['Technical', 'Cultural', 'Sports', 'Literary', 'Social Service', 'General'];

// Shared by CreateClub and EditClub so the (fairly large) form only
// exists in one place. `initialValues` seeds the form; `onSubmit`
// receives the assembled payload and is responsible for the actual API
// call + navigation, so this component stays presentation-only.
export default function ClubForm({ initialValues, onSubmit, submitLabel, disableName = false }) {
  const [form, setForm] = useState({
    name: initialValues?.name || '',
    category: initialValues?.category || 'General',
    description: initialValues?.description || '',
    vision: initialValues?.vision || '',
    mission: initialValues?.mission || '',
    logoUrl: initialValues?.logoUrl || '',
    coverImageUrl: initialValues?.coverImageUrl || '',
    socialLinks: {
      instagram: initialValues?.socialLinks?.instagram || '',
      linkedin: initialValues?.socialLinks?.linkedin || '',
      github: initialValues?.socialLinks?.github || '',
      website: initialValues?.socialLinks?.website || '',
    },
  });
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(initialValues?.tags || []);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSocialChange(e) {
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [e.target.name]: e.target.value } }));
  }

  function addTag(e) {
    e.preventDefault();
    const value = tagInput.trim();
    if (value && !tags.includes(value)) setTags((t) => [...t, value]);
    setTagInput('');
  }

  function removeTag(tag) {
    setTags((t) => t.filter((x) => x !== tag));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      const socialLinks = Object.fromEntries(
        Object.entries(form.socialLinks).filter(([, v]) => v.trim() !== '')
      );
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
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <Input
          id="name"
          name="name"
          label="Club name"
          placeholder="Robotics Club"
          value={form.name}
          onChange={handleChange}
          error={fieldErrors.name}
          disabled={disableName}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-sm font-medium text-ink">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <Textarea
          id="description"
          name="description"
          label="Description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          error={fieldErrors.description}
        />
        <Textarea id="vision" name="vision" label="Vision" rows={2} value={form.vision} onChange={handleChange} />
        <Textarea id="mission" name="mission" label="Mission" rows={2} value={form.mission} onChange={handleChange} />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink">Skills / domains</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <TagIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTag(e)}
                placeholder="e.g. React, Robotics, Design"
                className="w-full rounded-md border border-border bg-surface py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-ink">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} aria-label={`Remove ${tag}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input id="logoUrl" name="logoUrl" label="Logo URL (optional)" value={form.logoUrl} onChange={handleChange} />
          <Input id="coverImageUrl" name="coverImageUrl" label="Cover image URL (optional)" value={form.coverImageUrl} onChange={handleChange} />
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium text-ink">Social links (optional)</p>
          <div className="grid grid-cols-2 gap-4">
            <Input name="instagram" placeholder="Instagram URL" value={form.socialLinks.instagram} onChange={handleSocialChange} />
            <Input name="linkedin" placeholder="LinkedIn URL" value={form.socialLinks.linkedin} onChange={handleSocialChange} />
            <Input name="github" placeholder="GitHub URL" value={form.socialLinks.github} onChange={handleSocialChange} />
            <Input name="website" placeholder="Website URL" value={form.socialLinks.website} onChange={handleSocialChange} />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
