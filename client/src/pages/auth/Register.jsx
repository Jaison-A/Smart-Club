import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setIsSubmitting(true);
    try {
      await register(form);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 1500);
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

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
        <CheckCircle2 className="text-success" size={40} />
        <h1 className="font-display text-xl font-semibold text-ink">Account created</h1>
        <p className="text-sm text-ink-muted">Taking you to the login page...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <div className="rounded-md bg-accent p-1.5 text-primary">
            <GraduationCap size={20} strokeWidth={2.25} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-ink">ClubHub</span>
        </div>

        <div className="rounded-lg border border-border bg-surface p-8">
          <h1 className="font-display text-xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every account starts as a student — coordinators are assigned by your club's admin.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Input
              id="name"
              name="name"
              label="Full name"
              placeholder="Jaison Kurian"
              value={form.name}
              onChange={handleChange}
              error={fieldErrors.name}
              required
            />
            <Input
              id="email"
              name="email"
              type="email"
              label="College email"
              placeholder="you@sxcce.edu"
              value={form.email}
              onChange={handleChange}
              error={fieldErrors.email}
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              error={fieldErrors.password}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="studentId"
                name="studentId"
                label="Student ID"
                placeholder="Optional"
                value={form.studentId}
                onChange={handleChange}
              />
              <Input
                id="department"
                name="department"
                label="Department"
                placeholder="Optional"
                value={form.department}
                onChange={handleChange}
              />
            </div>

            <Button type="submit" className="w-full gradient-accent border-none hover:opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
