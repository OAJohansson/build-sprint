// Aurora curtains for places far north or south, on dark nights. Three soft bands of green with
// a touch of violet, swaying slowly; still for people who prefer reduced motion.
const BANDS = [
  { left: "-10%", top: "6%", w: "75%", h: "38%", rot: -12, dur: 17, delay: 0, hue: "#4ade80" },
  { left: "25%", top: "2%", w: "80%", h: "44%", rot: 8, dur: 23, delay: -7, hue: "#2dd4bf" },
  { left: "55%", top: "10%", w: "60%", h: "30%", rot: -4, dur: 19, delay: -12, hue: "#86efac" },
];

export function Aurora({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }} aria-hidden="true">
      {BANDS.map((b, i) => (
        <div key={i} className="absolute" style={{ left: b.left, top: b.top, width: b.w, height: b.h, transform: `rotate(${b.rot}deg)` }}>
          <div
            className="hz-aurora h-full w-full"
            style={{
              background: `linear-gradient(to top, transparent 0%, ${b.hue}cc 30%, ${b.hue}55 60%, #a78bfa33 80%, transparent 100%)`,
              filter: "blur(18px)",
              mixBlendMode: "screen",
              animationDuration: `${b.dur}s`,
              animationDelay: `${b.delay}s`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
