import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, AlertCircle, CheckCircle2, Users2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import TagInput from '../../components/ui/TagInput';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { usersApi } from '../../api/invites.api';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user.name || '',
    department: user.department || '',
    year: user.year || '',
    bio: user.bio || '',
    github: user.github || '',
    linkedin: user.linkedin || '',
    website: user.website || '',
    resumeUrl: user.resumeUrl || '',
  });
  const [skills, setSkills] = useState(user.skills || []);
  const [interests, setInterests] = useState(user.interests || []);
  const [memberships, setMemberships] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  useEffect(() => {
    usersApi
      .memberships(user._id || user.id)
      .then(({ data }) => setMemberships(data.data.memberships))
      .catch(() => setMemberships([]));
  }, [user._id, user.id]);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    // Client checks give fast feedback only -- the server re-validates type
    // and size and is the real gatekeeper.
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please choose an image file.' });
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setMessage({ type: 'error', text: 'Image must be 5MB or smaller.' });
      return;
    }

    setUploading(true);
    setMessage(null);
    try {
      const { data } = await authApi.uploadAvatar(file);
      updateUser(data.data.user);
      setMessage({ type: 'success', text: 'Profile picture updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Could not upload the image.' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        name: form.name,
        department: form.department,
        bio: form.bio,
        github: form.github,
        linkedin: form.linkedin,
        website: form.website,
        resumeUrl: form.resumeUrl,
        skills,
        interests,
      };
      if (form.year !== '' && form.year !== null) payload.year = Number(form.year);

      const { data } = await authApi.updateProfile(payload);
      updateUser(data.data.user);
      setMessage({ type: 'success', text: 'Profile saved.' });
    } catch (err) {
      const fieldErrors = err.response?.data?.errors;
      const detail = Array.isArray(fieldErrors) && fieldErrors[0]?.message ? ` ${fieldErrors[0].message}` : '';
      setMessage({ type: 'error', text: `${err.response?.data?.message || 'Could not save your profile.'}${detail}` });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <TopBar title="My Profile" subtitle="Manage how you appear across the platform." />

      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-8">
        {message && (
          <div role="status" className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${message.type === 'success' ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <Card>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="relative">
              <Avatar user={user} size="xl" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 rounded-full border-2 border-surface gradient-accent p-2 text-onaccent shadow disabled:opacity-60"
                aria-label="Change profile picture"
              >
                <Camera size={14} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center sm:text-left">
              <p className="font-display text-xl font-semibold text-ink">{user.name}</p>
              <p className="text-sm text-ink-muted">{user.email}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Badge tone="accent">{user.role}</Badge>
                {user.department && <Badge tone="neutral">{user.department}</Badge>}
              </div>
              <p className="mt-2 text-xs text-ink-muted">
                {uploading ? 'Uploading...' : 'JPG, PNG, WEBP or GIF, up to 5MB. Without a photo, your initial is shown.'}
              </p>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSave} className="space-y-6">
          <Card>
            <p className="mb-4 font-display text-sm font-semibold text-ink">Personal information</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input name="name" label="Full name" value={form.name} onChange={handleChange} required />
              <Input name="department" label="Department" value={form.department} onChange={handleChange} />
              <Input name="year" type="number" min="1" max="6" label="Academic year" value={form.year} onChange={handleChange} />
              <Input label="Email" value={user.email} disabled readOnly />
            </div>
            <div className="mt-4">
              <Textarea name="bio" label="Bio" rows={3} maxLength={500} placeholder="Tell clubs a little about yourself..." value={form.bio} onChange={handleChange} />
              <p className="mt-1 text-right text-xs text-ink-muted">{form.bio.length}/500</p>
            </div>
          </Card>

          <Card>
            <p className="mb-4 font-display text-sm font-semibold text-ink">Skills & interests</p>
            <div className="space-y-4">
              <TagInput label="Skills" value={skills} onChange={setSkills} placeholder="e.g. React, Python, Design" />
              <TagInput label="Interests" value={interests} onChange={setInterests} placeholder="e.g. Robotics, Music" />
            </div>
          </Card>

          <Card>
            <p className="mb-4 font-display text-sm font-semibold text-ink">Links</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input name="github" label="GitHub" placeholder="https://github.com/..." value={form.github} onChange={handleChange} />
              <Input name="linkedin" label="LinkedIn" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={handleChange} />
              <Input name="website" label="Website / portfolio" placeholder="https://..." value={form.website} onChange={handleChange} />
              <Input name="resumeUrl" label="Resume link" placeholder="https://..." value={form.resumeUrl} onChange={handleChange} />
            </div>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
          </div>
        </form>

        <Card>
          <p className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-ink">
            <Users2 size={16} /> My clubs
          </p>
          {memberships.length === 0 ? (
            <p className="text-sm text-ink-muted">You haven't joined any clubs yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {memberships.map((m) => (
                <li key={m._id} className="flex items-center justify-between py-3">
                  <Link to={`/clubs/${m.club?.slug}`} className="text-sm font-medium text-ink hover:underline">{m.club?.name}</Link>
                  <Badge tone={m.role === 'coordinator' ? 'accent' : m.officerTitle ? 'info' : 'neutral'}>
                    {m.role === 'coordinator' ? 'Coordinator' : m.officerTitle || 'Member'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
