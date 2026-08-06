const variants = {
  primary: 'bg-primary text-ink-inverse hover:bg-primary-light',
  accent: 'bg-accent text-primary hover:bg-accent-light',
  outline: 'border border-border bg-surface text-ink hover:bg-primary/5',
  ghost: 'text-ink hover:bg-primary/5',
  danger: 'bg-danger text-white hover:bg-danger/90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
