// The Six AM mark (owner's pick, 18 Oct): a record whose label is a four-stripe sunrise in the
// four track colours. A faint outer ring keeps the black disc visible on the dark bar.
import { useId } from "react";

export function Logo({ className }: { className?: string }) {
  const clip = useId();
  return (
    <svg className={className} viewBox="0 0 100 100" role="img" aria-label="Six AM">
      <circle cx="50" cy="50" r="48" fill="#0b0a09" stroke="#3a322c" strokeWidth="2" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#1f1b18" strokeWidth="1.2" />
      <circle cx="50" cy="50" r="33" fill="none" stroke="#1f1b18" strokeWidth="1.2" />
      <clipPath id={clip}><circle cx="50" cy="50" r="24" /></clipPath>
      <g clipPath={`url(#${clip})`}>
        <rect x="20" y="26" width="60" height="12" fill="#f2b134" />
        <rect x="20" y="38" width="60" height="12" fill="#ef5b37" />
        <rect x="20" y="50" width="60" height="12" fill="#23b3a5" />
        <rect x="20" y="62" width="60" height="12" fill="#a9c95a" />
      </g>
      <circle cx="50" cy="50" r="3" fill="#0b0a09" />
    </svg>
  );
}
