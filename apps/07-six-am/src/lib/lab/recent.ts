// The last ~30 s of separated parts, in memory only (L182, within L143/L161), so a jump back into
// them or a resume after a pause plays at once instead of waiting ~6 s for the Deck. Regions are
// kept as they were played (with their crossfades), at their track positions; rebuilding a stretch
// overlap-adds them back. Oldest dropped past the cap; everything zeroed on clear(). Never written
// anywhere. Pure (no Web Audio), unit tested (recent.test.ts).

type Chunk = { start: number; data: Float32Array[] }; // start: track sample; data[part*2+ch]

export class RecentParts {
  private chunks: Chunk[] = [];
  private total = 0;

  /** `capS` seconds kept at `rate`; `channels` = 8 (four parts in stereo). */
  constructor(readonly rate: number, readonly capS = 30, readonly channels = 8) {}

  /** Seconds held. */
  get seconds() { return this.total / this.rate; }

  /**
   * Keeps one region played from track sample `start` (already crossfaded at its edges). Chunks it
   * replaces (the same stretch heard again after a jump) go first, so nothing doubles.
   */
  add(start: number, data: Float32Array[]) {
    const n = data[0]?.length ?? 0;
    if (!n) return;
    const end = start + n;
    this.chunks = this.chunks.filter((c) => {
      const cEnd = c.start + c.data[0].length;
      const overlap = Math.min(end, cEnd) - Math.max(start, c.start);
      // Neighbours overlap only by their crossfade (a few ms); more is the same stretch again.
      if (overlap > Math.min(n, c.data[0].length) / 4) { this.total -= c.data[0].length; c.data.forEach((a) => a.fill(0)); return false; }
      return true;
    });
    this.chunks.push({ start, data: data.map((a) => a.slice()) });
    this.total += n;
    while (this.total > this.capS * this.rate && this.chunks.length > 1) {
      const old = this.chunks.shift()!;
      this.total -= old.data[0].length;
      old.data.forEach((a) => a.fill(0));
    }
  }

  /** The end (track sample) of the unbroken stretch that holds sample `from`, or null if none does. */
  coveredUntil(from: number): number | null {
    const sorted = [...this.chunks].sort((a, b) => a.start - b.start);
    let end: number | null = null;
    for (const c of sorted) {
      const cEnd = c.start + c.data[0].length;
      if (end === null) { if (c.start <= from && cEnd > from) end = cEnd; continue; }
      if (c.start <= end) end = Math.max(end, cEnd); else break;
    }
    return end;
  }

  /** The first held sample in [from, from + maxGap], or null (a run starts a little after the track's 0). */
  firstHeld(from: number, maxGap: number): number | null {
    let best: number | null = null;
    for (const c of this.chunks) {
      const end = c.start + c.data[0].length;
      if (end <= from || c.start > from + maxGap) continue;
      const s = Math.max(from, c.start);
      if (best === null || s < best) best = s;
    }
    return best;
  }

  /** The stretch [from, to) per channel (overlap-added), or null when it isn't all held. */
  build(from: number, to: number): Float32Array<ArrayBuffer>[] | null {
    const until = this.coveredUntil(from);
    if (until === null || until < to || to <= from) return null;
    const out = Array.from({ length: this.channels }, () => new Float32Array(to - from));
    for (const c of this.chunks) {
      const a = Math.max(from, c.start), b = Math.min(to, c.start + c.data[0].length);
      for (let ch = 0; ch < this.channels; ch++) {
        const src = c.data[ch], dst = out[ch];
        for (let i = a; i < b; i++) dst[i - from] += src[i - c.start];
      }
    }
    return out;
  }

  /** Zero and drop everything. */
  clear() {
    this.chunks.forEach((c) => c.data.forEach((a) => a.fill(0)));
    this.chunks = [];
    this.total = 0;
  }
}

/** Linear fade in and out over `n` samples (as live playback does), on a copy. */
export function faded(a: Float32Array, n: number): Float32Array {
  const out = a.slice();
  for (let i = 0; i < n && i < out.length; i++) { const g = i / n; out[i] *= g; out[out.length - 1 - i] *= g; }
  return out;
}
