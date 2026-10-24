const SIZES = {
  sm: 'h-9 w-9 text-base rounded-lg',
  md: 'h-12 w-12 text-xl rounded-xl',
  lg: 'h-16 w-16 text-2xl rounded-xl',
  xl: 'h-20 w-20 text-3xl rounded-2xl',
};

// Club logo tile: the logo URL if set, otherwise the first letter on a tinted tile.
export default function ClubLogo({ club, size = 'md', className = '' }) {
  if (club?.logoUrl) {
    return <img src={club.logoUrl} alt={`${club.name} logo`} className={`${SIZES[size]} shrink-0 border border-border object-cover ${className}`} />;
  }
  return (
    <div className={`${SIZES[size]} flex shrink-0 items-center justify-center border border-primary/30 bg-primary/10 font-display font-bold text-primary ${className}`} aria-hidden="true">
      {club?.name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}
