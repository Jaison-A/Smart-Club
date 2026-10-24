import { assetUrl } from '../../utils/assetUrl';

const SIZES = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-16 w-16 text-xl',
  xl: 'h-24 w-24 text-3xl',
};

// Uploaded profile picture when present; otherwise the first letter of the
// name on a gradient circle (the fallback the app always had).
export default function Avatar({ user, size = 'sm', className = '' }) {
  const src = assetUrl(user?.avatarUrl);
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  if (src) {
    return <img src={src} alt={user?.name || 'Profile'} className={`${SIZES[size]} shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <div
      className={`${SIZES[size]} flex shrink-0 items-center justify-center rounded-full gradient-accent font-display font-semibold text-onaccent ${className}`}
      aria-label={user?.name || 'Profile'}
    >
      {initial}
    </div>
  );
}
