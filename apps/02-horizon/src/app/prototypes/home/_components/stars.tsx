// A fixed scatter of stars; opacity follows how dark the sky is.
const STARS = Array.from({ length: 46 }, (_, i) => {
  const r = (n: number) => ((Math.sin(i * 127.1 + n * 311.7) * 43758.5453) % 1 + 1) % 1;
  return { x: r(1) * 100, y: r(2) * 62, s: r(3) > 0.85 ? 2 : 1, o: 0.4 + r(4) * 0.6 };
});

export function Stars({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0" style={{ opacity }} aria-hidden="true">
      {STARS.map((s, i) => (
        <span key={i} className="absolute rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }} />
      ))}
    </div>
  );
}
