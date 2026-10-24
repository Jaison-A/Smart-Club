import { useState } from 'react';
import { X } from 'lucide-react';

// Controlled list-of-strings editor: Enter/comma adds, x removes.
export default function TagInput({ label, value = [], onChange, placeholder = 'Type and press Enter' }) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim().replace(/,$/, '');
    if (tag && !value.includes(tag)) onChange([...value, tag]);
    setInput('');
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && !input && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-ink">{label}</label>}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface p-2 focus-within:ring-2 focus-within:ring-accent/50">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={value.length ? '' : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm text-ink placeholder:text-ink-muted focus:outline-none"
        />
      </div>
    </div>
  );
}
