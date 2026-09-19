import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, AlertCircle, CheckCircle2 } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setSuccess('Password changed. Please log in again with your new password.');
      // Changing the password revokes every session server-side, so the
      // current one is no longer valid either -- log out immediately
      // rather than leaving the UI in a stale "logged in" state.
      setTimeout(async () => {
        await logout();
        navigate('/login');
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change password.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <TopBar title="Settings" subtitle="Manage your appearance and account security." />

      <div className="mx-auto max-w-2xl space-y-6 p-8">
        <Card>
          <p className="font-display text-sm font-semibold text-ink">Appearance</p>
          <p className="mt-1 text-sm text-ink-muted">Choose how the platform looks on this device.</p>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex flex-col items-center gap-2 rounded-md border-2 p-4 transition-colors ${
                theme === 'light' ? 'border-accent' : 'border-border hover:border-primary/30'
              }`}
            >
              <Sun size={22} className="text-ink" />
              <span className="text-sm font-medium text-ink">Light</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex flex-col items-center gap-2 rounded-md border-2 p-4 transition-colors ${
                theme === 'dark' ? 'border-accent' : 'border-border hover:border-primary/30'
              }`}
            >
              <Moon size={22} className="text-ink" />
              <span className="text-sm font-medium text-ink">Dark</span>
            </button>
          </div>
        </Card>

        <Card>
          <p className="font-display text-sm font-semibold text-ink">Change password</p>
          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-md bg-success-bg px-3 py-2 text-sm text-success">
                <CheckCircle2 size={16} />
                {success}
              </div>
            )}

            <Input
              type="password"
              name="currentPassword"
              label="Current password"
              value={form.currentPassword}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="newPassword"
              label="New password"
              placeholder="At least 8 characters"
              value={form.newPassword}
              onChange={handleChange}
              required
            />
            <Input
              type="password"
              name="confirmPassword"
              label="Confirm new password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Changing...' : 'Change password'}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}
