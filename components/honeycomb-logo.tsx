export function HoneycombLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M13 4.5 5 9v11l8 4.5 8-4.5V9l-8-4.5Z"
        fill="var(--color-honey)"
        opacity="0.9"
      />
      <path
        d="M27 15.5 19 20v11l8 4.5 8-4.5V20l-8-4.5Z"
        fill="var(--color-nature)"
      />
      <path
        d="M13 4.5 5 9v11l8 4.5 8-4.5V9l-8-4.5Z"
        stroke="var(--color-charcoal)"
        strokeOpacity="0.15"
      />
    </svg>
  );
}
