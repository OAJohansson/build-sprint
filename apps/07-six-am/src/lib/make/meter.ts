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
