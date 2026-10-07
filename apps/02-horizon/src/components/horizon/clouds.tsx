// E. Living sky: a few soft clouds drifting across the daytime sky. Purely decorative, so slow,
// linear and paused for people who prefer reduced motion.
const CLOUDS = [
  { top: "11%", w: 240, h: 64, dur: 140, delay: -30 },
  { top: "21%", w: 180, h: 48, dur: 110, delay: -75 },
  { top: "31%", w: 260, h: 70, dur: 170, delay: -120 },
];

export function Clouds({ opacity }: { opacity: number }) {
  if (opacity <= 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }} aria-hidden="true">
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className="hz-drift absolute left-0 rounded-full"
          style={{
            top: c.top,
            width: c.w,
            height: c.h,
            background: "radial-gradient(ellipse at center, rgb(255 255 255 / 0.55), rgb(255 255 255 / 0) 70%)",
            filter: "blur(6px)",
            animationDuration: `${c.dur}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
