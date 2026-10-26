// A section loop's separated parts, held in memory only while the loop is on (L161): one run of
// separated regions written at their track positions, complete once every sample of the loop (plus
// a short tail past its end) is in. `build()` returns the loop with its wrap crossfaded into the
// tail, so looping it with AudioBufferSourceNode.loop is seamless. `drop()` zeroes it; nothing is
// ever written anywhere else (no storage, no upload, no export).

export class LoopBuffer {
  /** Per channel (part × 2 + ch), `length + tail` samples. */
  private data: Float32Array<ArrayBuffer>[];
  private mask: Uint8Array;
  private filled = 0;
  /** Where audio starts after a silent head (fillSilence), faded in over a few ms. */
  private headAt = 0;

  /**
   * @param length loop length in samples
   * @param tail samples kept past the loop's end for the wrap crossfade
   * @param channels 8 = four parts in stereo
   */
  constructor(readonly length: number, readonly tail: number, readonly channels = 8) {
    this.data = Array.from({ length: channels }, () => new Float32Array(length + tail));
    this.mask = new Uint8Array(length + tail);
  }

  get total() { return this.length + this.tail; }
  get complete() { return this.filled >= this.total; }
  /** 0–1 share filled. */
  get progress() { return this.total ? this.filled / this.total : 0; }

  /**
   * Writes one region (one array per channel) whose first sample is at buffer index `at`, skipping
   * its first `skip` samples (audio from before the run). Samples already filled are crossfaded over
   * the first `fade` written samples (the regions' overlap), then overwritten.
   */
  write(region: Float32Array[], at: number, skip = 0, fade = 0) {
    if (!this.data.length) return; // dropped
    const n = region[0]?.length ?? 0;
    for (let i = Math.max(0, skip); i < n; i++) {
      const j = at + i;
      if (j < 0) continue;
      if (j >= this.total) break;
      const k = i - skip;
      if (!this.mask[j]) {
        for (let c = 0; c < this.channels; c++) this.data[c][j] = region[c][i];
        this.mask[j] = 1;
        this.filled++;
      } else if (k < fade) {
        const g = k / fade;
        for (let c = 0; c < this.channels; c++) this.data[c][j] = this.data[c][j] * (1 - g) + region[c][i] * g;
      } else {
        for (let c = 0; c < this.channels; c++) this.data[c][j] = region[c][i];
      }
    }
  }

  /**
   * Marks the loop's first `n` samples as silence. For a loop at the very start of the track, where
   * no pre-roll is possible and the first captured sample comes a little after the loop's start:
   * without it the loop could never be complete (LS1 re-test: a loop over bars 1–16 refilled forever).
   */
  fillSilence(n: number) {
    n = Math.min(Math.max(0, Math.round(n)), this.total);
    for (let j = 0; j < n; j++) if (!this.mask[j]) { this.mask[j] = 1; this.filled++; }
    this.headAt = n;
  }

  /**
   * The loop, `length` samples per channel. The first `tail` samples fade from what follows the
   * loop's end into the loop's start, so the wrap (last sample → first) continues the audio.
   */
  build(): Float32Array<ArrayBuffer>[] {
    const L = this.length, N = Math.min(this.tail, L);
    return this.data.map((a) => {
      const out = a.slice(0, L);
      for (let i = 0; i < N; i++) { const g = i / N; out[i] = a[i] * g + a[L + i] * (1 - g); }
      // After a silent head, the audio fades in over N samples (no click where it starts).
      for (let i = 0; i < N && this.headAt > 0 && this.headAt + i < L; i++) out[this.headAt + i] *= i / N;
      return out;
    });
  }

  /** Starts over (a new run). */
  reset() {
    this.data.forEach((a) => a.fill(0));
    this.mask.fill(0);
    this.filled = 0;
    this.headAt = 0;
  }

  /** Zeroes and lets go of the audio. The buffer is unusable after. */
  drop() {
    this.reset();
    this.data = [];
  }
}
