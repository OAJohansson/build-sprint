/** The Meander mark: a ball of thread, one strand in brass. */
export function Mark({ size = 24, stroke = 1.1 }: { size?: number; stroke?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="#e9e2d4" strokeWidth={stroke}>
        <circle cx="12" cy="12" r="10.5" />
        <ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)" />
        <ellipse cx="12" cy="12" rx="10.5" ry="7.4" transform="rotate(48 12 12)" stroke="#d3a66c" />
      </g>
    </svg>
  );
}
