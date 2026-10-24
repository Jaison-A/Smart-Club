import { useId } from 'react';

// "Campus Club hub" wordmark with the gradient C mark from the reference.
// The SVG gradient id is unique per instance (useId) so several logos on
// one page never share/clobber each other's gradient.
export default function BrandLogo({ size = 'md', stacked = false, onDark = true }) {
  const gid = useId();
  const dims = { sm: 26, md: 32, lg: 56, xl: 72 }[size];
  const text = { sm: 'text-sm', md: 'text-base', lg: 'text-3xl', xl: 'text-4xl' }[size];

  return (
    <div className={`flex ${stacked ? 'flex-col items-center gap-3' : 'items-center gap-2.5'}`}>
      <svg width={dims} height={dims} viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="6" y1="6" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="#22D3EE" />
            <stop offset="1" stopColor="#A855F7" />
          </linearGradient>
        </defs>
        <path d="M24 4 41 14v20L24 44 7 34V14L24 4Z" stroke={`url(#${gid})`} strokeWidth="3.2" strokeLinejoin="round" />
        <path d="M30 18.5a9 9 0 1 0 0 11" stroke={`url(#${gid})`} strokeWidth="3.6" strokeLinecap="round" />
      </svg>
      <div className={`font-display font-semibold leading-tight tracking-tight ${text}`}>
        <span className={onDark ? 'text-white' : 'text-ink'}>Campus</span>{' '}
        <span style={{ color: '#22D3EE' }}>Club</span> <span style={{ color: '#A78BFA' }}>hub</span>
      </div>
    </div>
  );
}
