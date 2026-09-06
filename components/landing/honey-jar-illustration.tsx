export function HoneyJarIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 360" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="160" cy="336" rx="110" ry="14" fill="var(--color-charcoal)" opacity="0.08" />
      {/* Jar body */}
      <path
        d="M92 140h136c8 0 14 6 14 14v150c0 20-16 36-36 36H114c-20 0-36-16-36-36V154c0-8 6-14 14-14Z"
        fill="url(#jarGradient)"
        stroke="var(--color-honey-dark)"
        strokeWidth="2"
      />
      {/* Honey level lines */}
      <path d="M78 190h164" stroke="var(--color-honey-dark)" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M78 230h164" stroke="var(--color-honey-dark)" strokeOpacity="0.2" strokeWidth="2" />
      {/* Lid */}
      <rect x="82" y="112" width="156" height="30" rx="8" fill="var(--color-charcoal)" />
      <rect x="96" y="96" width="128" height="22" rx="6" fill="var(--color-nature)" />
      {/* Label */}
      <rect x="106" y="196" width="108" height="92" rx="10" fill="var(--color-cream)" stroke="var(--color-honey-dark)" strokeWidth="1.5" />
      {/* QR code (decorative) */}
      <g fill="var(--color-charcoal)">
        <rect x="118" y="208" width="26" height="26" rx="3" />
        <rect x="176" y="208" width="26" height="26" rx="3" />
        <rect x="118" y="252" width="26" height="26" rx="3" />
        <rect x="124" y="214" width="14" height="14" rx="2" fill="var(--color-cream)" />
        <rect x="182" y="214" width="14" height="14" rx="2" fill="var(--color-cream)" />
        <rect x="124" y="258" width="14" height="14" rx="2" fill="var(--color-cream)" />
        <rect x="154" y="208" width="8" height="8" fill="var(--color-charcoal)" />
        <rect x="166" y="220" width="8" height="8" fill="var(--color-charcoal)" />
        <rect x="154" y="232" width="8" height="8" fill="var(--color-charcoal)" />
        <rect x="176" y="244" width="8" height="8" fill="var(--color-charcoal)" />
        <rect x="154" y="256" width="8" height="8" fill="var(--color-charcoal)" />
        <rect x="188" y="256" width="8" height="8" fill="var(--color-charcoal)" />
        <rect x="164" y="268" width="8" height="8" fill="var(--color-charcoal)" />
      </g>
      <defs>
        <linearGradient id="jarGradient" x1="90" y1="140" x2="240" y2="340" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--color-honey)" />
          <stop offset="1" stopColor="var(--color-honey-dark)" />
        </linearGradient>
      </defs>
    </svg>
  );
}
