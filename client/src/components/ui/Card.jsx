// The signature element referenced in the design plan: a left-edge
// stripe, applied consistently rather than as one-off decoration.
// `accent` toggles it on for cards that represent something actionable
// or highlighted (a stat, a pending item); off for plain containers.
export default function Card({ children, className = '', accent = false, as: Tag = 'div', ...props }) {
  return (
    <Tag
      className={`bg-surface rounded-lg border border-border p-5
        ${accent ? 'stripe-accent' : ''} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
