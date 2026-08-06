const tones = {
  neutral: 'bg-primary/5 text-ink-muted',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  accent: 'bg-accent/15 text-primary',
};

// Central place mapping backend status strings to a visual tone, so
// "accepted" always looks the same everywhere it's rendered.
const statusToneMap = {
  active: 'success',
  open: 'success',
  accepted: 'success',
  pending: 'warning',
  upcoming: 'warning',
  submitted: 'info',
  shortlisted: 'info',
  interview: 'accent',
  closed: 'neutral',
  archived: 'neutral',
  rejected: 'danger',
  removed: 'danger',
};

export default function Badge({ status, tone, children, className = '' }) {
  const resolvedTone = tone || statusToneMap[status] || 'neutral';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize
        ${tones[resolvedTone]} ${className}`}
    >
      {children || status}
    </span>
  );
}
