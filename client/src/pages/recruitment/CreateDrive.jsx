import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Plus, Trash2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Textarea from '../../components/ui/Textarea';
import Button from '../../components/ui/Button';
import { recruitmentApi } from '../../api/recruitment.api';

const FIELD_TYPES = ['text', 'textarea', 'number', 'select', 'url'];

function emptyField() {
  return { label: '', type: 'text', required: true, options: [] };
}

export default function CreateDrive() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clubId = searchParams.get('clubId');

  const [form, setForm] = useState({ title: '', description: '', openDate: '', closeDate: '' });
  const [fields, setFields] = useState([emptyField()]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function updateField(index, patch) {
    setFields((fs) => fs.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function addField() {
    setFields((fs) => [...fs, emptyField()]);
  }

  function removeField(index) {
    setFields((fs) => fs.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!clubId) {
      setError('No club selected. Go to your coordinator dashboard and try again.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formFields = fields
        .filter((f) => f.label.trim())
        .map((f) => ({
          ...f,
          options: f.type === 'select' ? f.options.filter(Boolean) : undefined,
        }));

      await recruitmentApi.createDrive(clubId, { ...form, formFields });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong creating the drive.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2 className="text-success" size={40} />
        <h1 className="font-display text-xl font-semibold text-ink">Recruitment drive created</h1>
        <Button onClick={() => navigate('/coordinator')} className="mt-2">
          Back to dashboard
        </Button>
      </div>
    );
  }

  return (
    <>
      <TopBar title="Create Recruitment Drive" subtitle="Build the application form students will fill out." />
      <div className="mx-auto max-w-2xl p-8">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Input name="title" label="Drive title" value={form.title} onChange={handleChange} required />
            <Textarea name="description" label="Description" rows={3} value={form.description} onChange={handleChange} />
            <div className="grid grid-cols-2 gap-4">
              <Input name="openDate" type="date" label="Opens" value={form.openDate} onChange={handleChange} required />
              <Input name="closeDate" type="date" label="Closes" value={form.closeDate} onChange={handleChange} required />
            </div>

            <div className="border-t border-border pt-4">
              <p className="mb-3 text-sm font-medium text-ink">Application form fields</p>
              <div className="space-y-3">
                {fields.map((field, i) => (
                  <div key={i} className="rounded-md border border-border p-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={field.label}
                        onChange={(e) => updateField(i, { label: e.target.value })}
                        placeholder="Question label, e.g. Why do you want to join?"
                        className="flex-1 rounded-md border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <select
                        value={field.type}
                        onChange={(e) => updateField(i, { type: e.target.value })}
                        className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-muted">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(i, { required: e.target.checked })}
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        Required
                      </label>
                      {fields.length > 1 && (
                        <button type="button" onClick={() => removeField(i)} aria-label="Remove field">
                          <Trash2 size={15} className="text-danger" />
                        </button>
                      )}
                    </div>
                    {field.type === 'select' && (
                      <input
                        value={(field.options || []).join(', ')}
                        onChange={(e) => updateField(i, { options: e.target.value.split(',').map((s) => s.trim()) })}
                        placeholder="Comma-separated options"
                        className="mt-2 w-full rounded-md border border-border bg-surface px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addField}>
                <Plus size={14} /> Add field
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create drive'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
