export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-14 text-center">
      {Icon && (
        <div className="mb-3 rounded-full bg-primary/5 p-3 text-ink-muted">
          <Icon size={22} strokeWidth={1.75} />
        </div>
      )}
      <p className="font-display text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
