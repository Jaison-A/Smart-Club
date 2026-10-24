const variants = {
  // Main CTA: theme gradient (green in light, cyan->purple in dark)
  primary: 'gradient-primary text-onprimary hover:opacity-90',
  accent: 'gradient-accent text-onaccent hover:opacity-90',
  outline: 'border border-border bg-transparent text-ink hover:border-primary/50 hover:bg-primary/5',
  ghost: 'text-ink hover:bg-primary/5',
  danger: 'bg-danger text-white hover:opacity-90',
  'danger-outline': 'border border-danger/50 bg-transparent text-danger hover:bg-danger/10',
  'success-outline': 'border border-success/50 bg-transparent text-success hover:bg-success/10',
};
const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-base' };

export default function Button({ variant = 'primary', size = 'md', className = '', children, disabled, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
