import { Bell } from 'lucide-react';

export default function TopBar({ title, subtitle, actions }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-8 py-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <button
          className="rounded-full p-2 text-ink-muted transition-colors hover:bg-primary/5 hover:text-ink"
          aria-label="Notifications"
        >
          <Bell size={19} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
