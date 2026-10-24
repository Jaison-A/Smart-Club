const tones = {
  neutral: 'bg-ink-muted/15 text-ink-muted',
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  accent: 'bg-accent/15 text-accent',
  teal: 'bg-teal/15 text-teal',
  purple: 'bg-purple/15 text-purple',
};

// One place mapping backend status strings to a colour.
const statusToneMap = {
  active: 'success', open: 'success', accepted: 'success', registered: 'success',
  pending: 'warning', upcoming: 'warning', submitted: 'warning',
  scheduled: 'info', shortlisted: 'info', interview: 'purple',
  closed: 'neutral', archived: 'neutral', completed: 'neutral',
  cancelled: 'danger', suspended: 'danger', rejected: 'danger', removed: 'danger',
};

// Club-category colours, matching the reference's tag chips.
const categoryToneMap = {
  technical: 'teal', tech: 'teal', cultural: 'purple', sports: 'info', literary: 'warning',
  'social service': 'success', social: 'success', environment: 'success', environmental: 'success',
  design: 'purple', creative: 'teal', arts: 'purple', academic: 'info', general: 'neutral',
};

export function toneForCategory(category) {
  return categoryToneMap[String(category || '').toLowerCase()] || 'neutral';
}

export default function Badge({ status, category, tone, children, className = '' }) {
  const resolved = tone || (category ? toneForCategory(category) : statusToneMap[status]) || 'neutral';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${tones[resolved]} ${className}`}>
      {children || category || status}
    </span>
  );
}
