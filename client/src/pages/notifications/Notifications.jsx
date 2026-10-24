import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Calendar, Check, CheckCheck, FileText, Mail, ShieldCheck, XCircle } from 'lucide-react';
import TopBar from '../../components/layout/TopBar';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { notificationsApi } from '../../api/notifications.api';

// Notification type -> icon + tint. Unknown types fall back to a bell, so a
// new backend notification kind never breaks this page.
const TYPE_STYLE = {
  application_status: { icon: FileText, tone: 'text-info bg-info-bg' },
  event_created: { icon: Calendar, tone: 'text-primary bg-primary/10' },
  coordinator_invite: { icon: Mail, tone: 'text-accent bg-accent/15' },
  membership_invite: { icon: Mail, tone: 'text-accent bg-accent/15' },
  coordinator_application_accepted: { icon: ShieldCheck, tone: 'text-success bg-success-bg' },
  coordinator_application_rejected: { icon: XCircle, tone: 'text-danger bg-danger-bg' },
  club_approved: { icon: Check, tone: 'text-success bg-success-bg' },
  club_rejected: { icon: XCircle, tone: 'text-danger bg-danger-bg' },
};

function timeAgo(dateStr) {
  const mins = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(dateStr).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function Notifications() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await notificationsApi.list({ limit: 50, unreadOnly: tab === 'unread' ? 'true' : undefined });
      setItems(data.data.notifications);
      setUnreadCount(data.data.unreadCount);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function open(n) {
    if (!n.read) {
      await notificationsApi.markRead(n._id);
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
    }
    if (n.link) navigate(n.link);
  }

  async function markAll() {
    await notificationsApi.markAllRead();
    await load();
  }

  return (
    <>
      <TopBar
        title="Notifications"
        subtitle={unreadCount ? `${unreadCount} unread` : 'You are all caught up'}
        actions={unreadCount > 0 && (<Button size="sm" variant="outline" onClick={markAll}><CheckCheck size={15} /> Mark all read</Button>)}
      />

      <div className="mx-auto max-w-3xl p-4 sm:p-8">
        <div className="mb-5 flex gap-2" role="tablist">
          {['all', 'unread'].map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${tab === t ? 'gradient-primary text-onprimary' : 'border border-border text-ink-muted hover:text-ink'}`}>
              {t}
            </button>
          ))}
        </div>

        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications" description="Updates about your applications, events and clubs show up here." />
        ) : (
          <Card className="divide-y divide-border !p-0">
            {items.map((n) => {
              const style = TYPE_STYLE[n.type] || { icon: Bell, tone: 'text-ink-muted bg-ink-muted/15' };
              const Icon = style.icon;
              return (
                <button key={n._id} onClick={() => open(n)} className={`flex w-full items-start gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/5 ${n.read ? '' : 'bg-accent/5'}`}>
                  <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.tone}`}><Icon size={17} /></span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm ${n.read ? 'text-ink-muted' : 'font-medium text-ink'}`}>{n.message}</span>
                    <span className="mt-0.5 block text-xs text-ink-muted">{timeAgo(n.createdAt)}</span>
                  </span>
                  {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
                </button>
              );
            })}
          </Card>
        )}
      </div>
    </>
  );
}
