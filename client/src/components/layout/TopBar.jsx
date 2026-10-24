import NotificationBell from './NotificationBell';

export default function TopBar({ title, subtitle, actions }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-4 py-5 sm:px-8">
      <div className="min-w-0">
        <h1 className="truncate font-display text-lg font-semibold text-ink sm:text-xl">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {actions}
        <NotificationBell />
      </div>
    </header>
  );
}
