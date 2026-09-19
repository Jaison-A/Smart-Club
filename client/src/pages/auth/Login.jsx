import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const user = await login(form);
      const redirectTo = location.state?.from?.pathname || `/${user.role}`;
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 text-ink-inverse lg:flex">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-accent p-1.5 text-primary">
            <GraduationCap size={20} strokeWidth={2.25} />
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">ClubHub</span>
        </div>
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Every club. Every drive.
            <br />
            One place to run it all.
          </h2>
          <p className="mt-4 max-w-sm text-white/60">
            Recruit, schedule events, track attendance, and issue certificates — built for how
            college clubs actually run.
          </p>
        </div>
        <p className="text-xs text-white/40">Smart College Club Management & Recruitment Platform</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1 text-sm text-ink-muted">Log in to your account to continue.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Input
              id="email"
              name="email"
              type="email"
              label="Email"
              placeholder="you@sxcce.edu"
              value={form.email}
              onChange={handleChange}
              required
            />
            <Input
              id="password"
              name="password"
              type="password"
              label="Password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />

            <Button type="submit" className="w-full gradient-accent border-none hover:opacity-90" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
