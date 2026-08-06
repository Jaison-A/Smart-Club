import { Loader2 } from 'lucide-react';

export default function Spinner({ full = false, label = 'Loading...' }) {
  const content = (
    <div className="flex flex-col items-center gap-2 text-ink-muted">
      <Loader2 className="animate-spin" size={22} />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (full) {
    return <div className="flex min-h-screen items-center justify-center bg-canvas">{content}</div>;
  }
  return <div className="flex items-center justify-center py-10">{content}</div>;
}
