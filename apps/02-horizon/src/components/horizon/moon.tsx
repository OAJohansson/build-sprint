// A subtle moon: drawn at its real phase, placed by its real height and direction, and only when
// it's actually above the horizon (like the sky outside). Fades in as the sky darkens.
type Props = { alt: number; az: number; phase: number; southern: boolean; darkness: number };

export function Moon({ alt, az, phase, southern, darkness }: Props) {
  if (alt <= 0 || darkness <= 0) return null;
  const r = 11;
  // Waxing (phase < 0.5) is lit on the right in the north; the south sees it mirrored.
  const waxing = phase < 0.5;
  const k = Math.cos(2 * Math.PI * phase); // 1 at new moon, -1 at full
  const rx = Math.abs(k) * r;
  const crescent = k > 0; // less than half lit
  const lit = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${crescent ? 0 : 1} 0 ${-r} Z`;
  const flip = waxing !== !southern;
  // Across the screen by direction (east on the left, west on the right, facing the equator),
  // up the sky by height.
  const facing = southern ? 0 : 180;
  const x = 50 + Math.max(-40, Math.min(40, ((((az - facing + 540) % 360) - 180) / 90) * 40));
  const y = 36 - Math.min(1, alt / 60) * 22; // stays clear of the top bar
  return (
    <svg
      className="pointer-events-none absolute"
      style={{ left: `${x}%`, top: `${y}%`, width: 2 * r + 24, height: 2 * r + 24, transform: "translate(-50%, -50%)", opacity: 0.9 * darkness }}
      viewBox={`${-r - 12} ${-r - 12} ${2 * r + 24} ${2 * r + 24}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hz-moon-halo">
          <stop offset="40%" stopColor="#f3efe0" stopOpacity={0.22 * Math.max(0.3, 1 - k)} />
          <stop offset="100%" stopColor="#f3efe0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle r={r + 12} fill="url(#hz-moon-halo)" />
      <circle r={r} fill="#f3efe0" opacity={0.08} />
      <path d={lit} fill="#f3efe0" transform={flip ? "scale(-1 1)" : undefined} />
    </svg>
  );
}
