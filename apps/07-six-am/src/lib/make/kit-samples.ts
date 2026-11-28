// Phase 7 slice 1 (L266, T234): the decoded one-shots the sampled sounds play from, by sound id (a
// drum kit sound "kick-909-round" or a bass sample "bass-eb-E1"). Pure TS and one Map per JS realm:
// the page fills it as files load (kit-load.ts), Make's worker gets copies with its jobs (jobs.ts,
// `samples`), and the unit tests put their own in. A sound whose sample isn't here yet renders as
// silence; the callers load it first.

export type KitSample = { data: Float32Array; rate: number };

const store = new Map<string, KitSample>();

export const getKitSample = (id: string): KitSample | null => store.get(id) ?? null;
export const hasKitSample = (id: string) => store.has(id);
export function setKitSample(id: string, data: Float32Array, rate: number) { store.set(id, { data, rate }); }
/** Every sample this realm holds (for passing on to a worker), by id. */
export function kitSamplesFor(ids: Iterable<string>): Record<string, KitSample> {
  const out: Record<string, KitSample> = {};
  for (const id of ids) { const s = store.get(id); if (s) out[id] = s; }
  return out;
}

/**
 * T234: drops what comes before the first sample above `db` (re the peak), so a hit starts on its
 * beat whatever the decoder put in front (Firefox ignores the MP3s' gapless header; AAC has priming).
 */
export function trimLead(x: Float32Array, db = -60): Float32Array {
  let peak = 0;
  for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > peak) peak = a; }
  if (peak === 0) return x;
  const thr = peak * Math.pow(10, db / 20);
  let a = 0;
  while (a < x.length && Math.abs(x[a]) <= thr) a++;
  return a > 0 ? x.slice(a) : x;
}
