import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import BrandLogo from '../../components/ui/BrandLogo';
import Button from '../../components/ui/Button';

const ROLE_TABS = [
  { key: 'student', label: 'Student' },
  { key: 'coordinator', label: 'Club Coordinator' },
  { key: 'admin', label: 'Admin' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
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
      const user = await login(form, role);
      navigate(location.state?.from?.pathname || `/${user.role}`, { replace: true });
    } catch (err) {
      if (err.code === 'ROLE_MISMATCH') {
        // The tabs are a sign-in intent, not a permission -- authorization
        // is always decided by the account's real role on the server.
        const label = ROLE_TABS.find((t) => t.key === err.actualRole)?.label || err.actualRole;
        setError(`This is a ${label} account. Please select the "${label}" tab to sign in.`);
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const fieldClass =
    'w-full rounded-lg border border-border bg-surface py-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/50';

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 top-1/3 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #22D3EE55, transparent 70%)' }} aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-24 right-0 h-96 w-96 rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #A855F755, transparent 70%)' }} aria-hidden="true" />
        <BrandLogo size="lg" />
        <div className="relative">
          <h2 className="font-display text-4xl font-semibold leading-tight text-white">Discover. Join. Build.</h2>
          <p className="mt-3 max-w-sm text-lg text-white/60">Your campus. Your clubs. Your community.</p>
        </div>
        <p className="relative text-xs text-white/40">Smart College Club Management & Recruitment Platform</p>
      </div>

      {/* Form panel */}
      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-16 lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="md" onDark={false} />
          </div>

          <h1 className="font-display text-3xl font-semibold text-ink">Welcome Back</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your Campus Club hub account</p>

          <div className="mt-6 grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1" role="tablist" aria-label="Sign in as">
            {ROLE_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={role === t.key}
                onClick={() => setRole(t.key)}
                className={`rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${role === t.key ? 'gradient-primary text-onprimary' : 'text-ink-muted hover:text-ink'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {error && (
              <div role="alert" className="flex items-start gap-2 rounded-lg bg-danger-bg px-3 py-2.5 text-sm text-danger">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="relative">
              <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input name="email" type="text" autoComplete="username" placeholder="Email or Register Number" aria-label="Email or register number" value={form.email} onChange={handleChange} required className={`${fieldClass} pl-11 pr-3`} />
            </div>

            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
              <input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Password" aria-label="Password" value={form.password} onChange={handleChange} required className={`${fieldClass} pl-11 pr-11`} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <ArrowRight size={17} />}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
