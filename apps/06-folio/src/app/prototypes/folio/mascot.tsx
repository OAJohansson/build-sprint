// Folio, the library owl: round glasses, a book under its wings. Static on purpose: feel comes
// from still framing, not motion (design restraint).
export function Mascot({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Folio the owl">
      {/* ear tufts */}
      <path d="M13 22 L16 7 L25 17 Z" fill="#7a5a40" />
      <path d="M51 22 L48 7 L39 17 Z" fill="#7a5a40" />
      {/* body */}
      <ellipse cx="32" cy="37" rx="21" ry="22" fill="#8c6a4c" />
      {/* face */}
      <circle cx="23" cy="31" r="9.5" fill="#f2e4cc" />
      <circle cx="41" cy="31" r="9.5" fill="#f2e4cc" />
      {/* eyes */}
      <circle cx="23.5" cy="32" r="3.6" fill="#1c1916" />
      <circle cx="40.5" cy="32" r="3.6" fill="#1c1916" />
      <circle cx="24.8" cy="30.7" r="1.2" fill="#fff" />
      <circle cx="41.8" cy="30.7" r="1.2" fill="#fff" />
      {/* glasses */}
      <circle cx="23" cy="31" r="7.5" fill="none" stroke="#1c1916" strokeWidth="2" />
      <circle cx="41" cy="31" r="7.5" fill="none" stroke="#1c1916" strokeWidth="2" />
      <path d="M30.5 30 Q32 28.5 33.5 30" fill="none" stroke="#1c1916" strokeWidth="2" strokeLinecap="round" />
      {/* beak */}
      <path d="M29.5 39 L34.5 39 L32 43.5 Z" fill="#e3a63e" />
      {/* book */}
      <rect x="19" y="47" width="26" height="11" rx="1.5" fill="#3d6b5c" />
      <path d="M32 47.5 V57.5" stroke="#2c5045" strokeWidth="1.2" />
      <path d="M21.5 50 H29.5 M34.5 50 H42.5" stroke="#f2e4cc" strokeWidth="1" opacity="0.5" />
      {/* wings holding the book */}
      <ellipse cx="15" cy="49" rx="5" ry="7" fill="#7a5a40" />
      <ellipse cx="49" cy="49" rx="5" ry="7" fill="#7a5a40" />
    </svg>
  );
}
