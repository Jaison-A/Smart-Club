export default function Textarea({ label, error, id, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`rounded-md border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted
          focus:outline-none focus:ring-2 focus:ring-accent/50
          ${error ? 'border-danger' : 'border-border'} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
