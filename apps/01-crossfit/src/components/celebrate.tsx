"use client";

import { BigButton } from "@/components/ui/bits";
import { formatPb, percentOf, repLabel } from "@/lib/pb";
import { type NewPb, formatDate } from "@/lib/types";

const COLORS = ["#ff7a1a", "#f2f2ee", "#ffc94d"];

function improvement({ pb, previous }: NewPb) {
  if (!previous) return null;
  if (pb.kind === "time") return `${formatPb({ ...pb, value: previous.value - pb.value })} faster than ${formatPb(previous)}`;
  if (pb.kind === "load") {
    const prev = previous.unit === pb.unit ? previous.value : previous.unit === "lb" ? previous.value * 0.4536 : previous.value / 0.4536;
    return `+${+(pb.value - prev).toFixed(1)} ${pb.unit} on ${formatPb(previous)}`;
  }
  if (pb.kind === "rounds") return `up from ${formatPb(previous)}`;
  return `+${pb.value - previous.value} on ${previous.value}`;
}

export function Celebrate({ pbs, onDone }: { pbs: NewPb[]; onDone: () => void }) {
  const [first, ...rest] = pbs;
  const { pb, previous } = first;
  const [value, ...unit] = formatPb(pb).split(" ");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0a0a0a]" role="dialog" aria-label="New PB">
      <div aria-hidden className="pointer-events-none absolute inset-0 motion-reduce:hidden">
        {Array.from({ length: 36 }, (_, i) => (
          <span
            key={i}
            className="absolute top-0 block h-3.5 rounded-sm"
            style={{
              left: `${(i * 37) % 100}%`,
              width: i % 3 ? 6 : 10,
              background: COLORS[i % COLORS.length],
              animation: `confetti-fall ${2.4 + (i % 5) * 0.35}s ${(i % 7) * 0.12}s ease-in forwards`,
              transform: "translateY(-10vh)",
            }}
          />
        ))}
      </div>
      <div className="relative mx-auto flex h-full max-w-md flex-col items-center justify-center gap-7 px-6 text-center">
        <div className="flex flex-col items-center gap-1.5 [animation:pop-in_0.5s_ease-out_both]">
          <span className="text-sm font-semibold tracking-[0.25em] text-primary">NEW PB</span>
          <span className="font-display text-[44px] font-bold uppercase leading-none tracking-wide">
            {pb.movement} {pb.kind === "load" && pb.repMax !== 1 ? repLabel(pb.repMax) : ""}
          </span>
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[120px] font-bold leading-[0.9] text-primary tabular-nums">{value}</span>
            <span className="text-2xl font-semibold">{unit.join(" ")}</span>
          </span>
          {previous && (
            <span className="text-muted-foreground">
              {improvement(first)} ({formatDate(previous.achievedOn)})
            </span>
          )}
        </div>
        {pb.kind === "load" && pb.repMax === 1 && (
          <div className="flex w-full items-center justify-between rounded-2xl bg-card px-4 py-3.5">
            <span className="text-muted-foreground">Your 70% is now</span>
            <span className="font-display text-[26px] font-bold">
              {percentOf(pb.value, pb.unit, 70)} {pb.unit}
            </span>
          </div>
        )}
        {rest.length > 0 && (
          <p className="text-muted-foreground">
            Also new: {rest.map((n) => `${n.pb.movement} ${n.pb.kind === "load" ? repLabel(n.pb.repMax) + " " : ""}${formatPb(n.pb)}`).join(", ")}
          </p>
        )}
        <BigButton variant="light" className="w-full" onClick={onDone}>
          Done
        </BigButton>
      </div>
    </div>
  );
}
