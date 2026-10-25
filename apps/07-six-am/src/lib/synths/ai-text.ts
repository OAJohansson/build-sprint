// Plain words for AI loops in the sound drawer (S4, F3): the cost line in the Mentor's form and why
// a loop took more than one try. Pure, unit tested.

export type Try = { error?: true; bpm?: number | null; key?: string | null; scale?: string | null; onTempo?: boolean | null; inKey?: boolean | null };

const usd = (v: number) => (v > 0 && v < 0.01 ? "< $0.01" : `$${v.toFixed(2)}`);

/** "$0.16 · 2 tries · today $0.40 · October $0.40 (estimate)"; tries only when > 1, sums when known. */
export function aiCostLine(costUsd: number, tries: number, todayUsd: number | null, monthUsd: number | null, month: string): string {
  return [usd(costUsd), tries > 1 ? `${tries} tries` : null, todayUsd !== null ? `today ${usd(todayUsd)}` : null, monthUsd !== null ? `${month} ${usd(monthUsd)}` : null]
    .filter(Boolean).join(" · ") + " (estimate)";
}

/** Why it took more than one try: "Try 1 was off tempo (131.2 BPM), try 2 off key (C minor)." Null for one try. */
export function triesReason(tries: Try[]): string | null {
  const missed = tries.slice(0, -1);
  if (!missed.length) return null;
  const why = missed.map((t, i) => {
    const what = t.error ? "failed"
      : t.onTempo === false && t.inKey === false ? `off tempo and key (${t.bpm?.toFixed(1)} BPM, ${t.key} ${t.scale})`
      : t.onTempo === false ? `off tempo (${t.bpm?.toFixed(1)} BPM)`
      : t.inKey === false ? `off key (${t.key} ${t.scale})`
      : "not measurable";
    return i === 0 ? `Try 1 ${t.error ? "" : "was "}${what}` : `try ${i + 1} ${what}`;
  });
  return `${why.join(", ")}.`;
}
