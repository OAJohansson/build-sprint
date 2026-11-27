"use client";

// Phase 7 slice 1 (critic on the built shelf): a shelf's sounds in two columns of families. Each
// family is one row: its label in a fixed column on the left, its sounds to the right (name, and the
// feel word unless the name or family already says it). A family is never split across columns, so
// position carries the grouping, and all 20 stay in view without scrolling.
import s from "./lab.module.css";

export type ShelfItem = { id: string; name: string; feel: string | null; about: string; pressed?: boolean; mine?: boolean; onPick: () => void };
export type ShelfFamily = { label: string; items: ShelfItem[] };

const words = (t: string) => t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
/** The feel word, or null when it repeats a word of the sound's name or its family ("909 tight tight"). */
export function feelShown(feel: string | null, name: string, family: string): string | null {
  if (!feel) return null;
  const said = new Set([...words(name), ...words(family)]);
  return words(feel).some((w) => said.has(w)) ? null : feel;
}

/**
 * Splits the families into two columns in order, at the family boundary that best balances them:
 * by lines first (each family is one line, a long one two), then by sound count (critic, slice 1
 * shelf round: by family count alone left one column with far more sounds).
 */
function split(fams: ShelfFamily[]): [ShelfFamily[], ShelfFamily[]] {
  // Names only (compact): a line holds about five sounds.
  const lines = fams.map((f) => Math.max(1, Math.ceil(f.items.length / 5)));
  const sounds = fams.map((f) => f.items.length);
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  let best = 1, bestCost = Infinity;
  for (let k = 1; k < fams.length; k++) {
    const la = sum(lines.slice(0, k)), lb = sum(lines.slice(k)), sa = sum(sounds.slice(0, k)), sb = sum(sounds.slice(k));
    const cost = Math.max(la, lb) + 0.05 * Math.abs(sa - sb) + (la < lb ? 0.01 : 0); // a tie keeps the longer column on the left
    if (cost < bestCost) { bestCost = cost; best = k; }
  }
  return [fams.slice(0, best), fams.slice(best)];
}

/** `compact` (every Make shelf since the slice 1 shelf round, critic): names only, the feel word in each sound's tooltip, so every family keeps one line. */
export function ShelfGroups({ label, families, compact = false }: { label: string; families: ShelfFamily[]; compact?: boolean }) {
  const cols = families.length > 1 ? split(families) : [families];
  return (
    <div className={s.groups} role="group" aria-label={label}>
      {cols.map((col, c) => (
        <div key={c} className={s.gcolumn}>
          {col.map((f) => (
            <div key={f.label} className={s.grp} role="group" aria-label={f.label}>
              <h3>{f.label}</h3>
              <div className={s.gcol}>
                {f.items.map((x) => {
                  const feel = compact ? null : feelShown(x.feel, x.name, f.label);
                  return (
                    <button key={x.id} className={s.snd} aria-pressed={x.mine ? undefined : !!x.pressed} title={compact && x.feel ? `${x.feel}: ${x.about}` : x.about} onClick={x.onPick}>
                      <b className={x.mine ? s.sndMine : undefined}>{x.name}</b>
                      {feel && <small>{feel}</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
