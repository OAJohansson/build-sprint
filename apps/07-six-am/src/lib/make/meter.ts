// One level measure for Make's A/B (F2, evals 26 Oct): RMS over both channels, the same as
// level.ts rmsDb, which the A/B match uses. A mono meter (an AnalyserNode's down-mix) read Reese
// 1.1 dB quieter, because its Width layer cancels in the mono sum. `stereoDb` is the pure maths
// (tested); `StereoMeter` taps a Web Audio node with it.

/** dB RMS of two channels' samples together (−120 floor), as rmsDb does over a whole loop. */
export function stereoDb(left: Float32Array, right: Float32Array): number {
  const n = Math.min(left.length, right.length);
  let e = 0;
  for (let i = 0; i < n; i++) e += left[i] * left[i] + right[i] * right[i];
  return n ? Math.max(-120, Math.round(10 * Math.log10(e / (2 * n) + 1e-12) * 10) / 10) : -120;
}

/** A level tap on a node: both channels, ~186 ms window (8192 samples at 44.1 kHz). Mono is spread to both. */
export class StereoMeter {
  private l: AnalyserNode;
  private r: AnalyserNode;
  private bl: Float32Array<ArrayBuffer>;
  private br: Float32Array<ArrayBuffer>;
  constructor(ctx: BaseAudioContext, from: AudioNode) {
    const up = new GainNode(ctx, { channelCount: 2, channelCountMode: "explicit", channelInterpretation: "speakers" });
    const split = ctx.createChannelSplitter(2);
    this.l = new AnalyserNode(ctx, { fftSize: 8192 });
    this.r = new AnalyserNode(ctx, { fftSize: 8192 });
    from.connect(up).connect(split);
    split.connect(this.l, 0);
    split.connect(this.r, 1);
    this.bl = new Float32Array(8192);
    this.br = new Float32Array(8192);
  }
  db(): number {
    this.l.getFloatTimeDomainData(this.bl);
    this.r.getFloatTimeDomainData(this.br);
    return stereoDb(this.bl, this.br);
  }
}

/**
 * Share of a stereo sound's energy below `hz` (dB re its total; 0 = all of it), by a 4th-order
 * Linkwitz–Riley low-pass (two Butterworth biquads) on the mid signal: how much "weight" a bass has.
 */
export function bandShareDb(left: Float32Array, right: Float32Array, rate: number, hz = 100): number {
  const w = Math.tan((Math.PI * hz) / rate), q = Math.SQRT1_2;
  const n0 = 1 / (1 + w / q + w * w);
  const b0 = w * w * n0, b1 = 2 * b0, b2 = b0, a1 = 2 * (w * w - 1) * n0, a2 = (1 - w / q + w * w) * n0;
  const st = [[0, 0, 0, 0], [0, 0, 0, 0]];
  let lo = 0, all = 0;
  const n = Math.min(left.length, right.length);
  for (let i = 0; i < n; i++) {
    const x = (left[i] + right[i]) / 2;
    let y = x;
    for (const s of st) { const o = b0 * y + b1 * s[0] + b2 * s[1] - a1 * s[2] - a2 * s[3]; s[1] = s[0]; s[0] = y; s[3] = s[2]; s[2] = o; y = o; }
    lo += y * y; all += x * x;
  }
  return all > 0 ? Math.round(10 * Math.log10(lo / all + 1e-12) * 10) / 10 : -120;
}
