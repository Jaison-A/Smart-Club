import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';

const POLL_INTERVAL_MS = 30000;

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await notificationsApi.list({ limit: 10 });
      setNotifications(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch {
      // Silently skip a failed poll -- the bell just keeps showing
      // whatever it last successfully loaded rather than erroring out
      // of the whole layout over a transient network hiccup.
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
  }

  async function handleNotificationClick(n) {
    if (!n.read) {
      await notificationsApi.markRead(n._id);
      setNotifications((ns) => ns.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function handleMarkAllRead() {
    await notificationsApi.markAllRead();
    setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleOpen}
        className="relative rounded-full p-2 text-ink-muted transition-colors hover:bg-primary/5 hover:text-ink"
        aria-label="Notifications"
      >
        <Bell size={19} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-border bg-surface shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="font-display text-sm font-semibold text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full items-start gap-2 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-primary/5 ${
                    !n.read ? 'bg-accent/5' : ''
                  }`}
                >
                  {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                  <div className={n.read ? 'pl-3.5' : ''}>
                    <p className="text-sm text-ink">{n.message}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-border px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-primary/5">
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
