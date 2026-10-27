// Lab spike bench (L144): Six AM's own synthetic house loop, rendered offline as four known parts
// (drums, bass, other, vocals = silence) and their sum. Lets a grader measure separation speed and
// quality without any streamed audio.
export const BENCH_RATE = 44100;

export type BenchMix = { mix: [Float32Array<ArrayBuffer>, Float32Array<ArrayBuffer>]; parts: Float32Array<ArrayBuffer>[]; seconds: number; bpm: number };

async function render(seconds: number, draw: (ctx: OfflineAudioContext, beat: number) => void): Promise<Float32Array<ArrayBuffer>> {
  const ctx = new OfflineAudioContext(1, Math.round(seconds * BENCH_RATE), BENCH_RATE);
  draw(ctx, 60 / 124);
  return (await ctx.startRendering()).getChannelData(0).slice();
}

export async function benchMix(seconds = 40): Promise<BenchMix> {
  const drums = await render(seconds, (ctx, beat) => {
    const noise = ctx.createBuffer(1, BENCH_RATE, BENCH_RATE);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    for (let t = 0; t < seconds; t += beat) {
      const o = ctx.createOscillator(); // kick: pitch drop 150 → 45 Hz
      const g = ctx.createGain();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.4);
      const h = ctx.createBufferSource(); // offbeat open-ish hat
      const hp = ctx.createBiquadFilter();
      const hg = ctx.createGain();
      h.buffer = noise;
      hp.type = "highpass";
      hp.frequency.value = 7000;
      hg.gain.setValueAtTime(0.25, t + beat / 2);
      hg.gain.exponentialRampToValueAtTime(0.001, t + beat / 2 + 0.12);
      h.connect(hp).connect(hg).connect(ctx.destination);
      h.start(t + beat / 2);
      h.stop(t + beat / 2 + 0.15);
    }
  });
  const bassNotes = [55, 55, 65.41, 49]; // A1 A1 C2 G1 per bar
  const bass = await render(seconds, (ctx, beat) => {
    for (let t = 0, i = 0; t < seconds; t += beat / 2, i++) {
      if (i % 2 === 0) continue; // offbeat eighths
      const f = bassNotes[Math.floor(t / (beat * 4)) % 4];
      const o = ctx.createOscillator();
      const lp = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = "sawtooth";
      o.frequency.value = f;
      lp.type = "lowpass";
      lp.frequency.value = 400;
      lp.Q.value = 6;
      g.gain.setValueAtTime(0.5, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + beat / 2 - 0.01);
      o.connect(lp).connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + beat / 2);
    }
  });
  const chords = [[220, 261.63, 329.63], [174.61, 220, 261.63], [261.63, 329.63, 392], [196, 246.94, 293.66]]; // Am F C G
  const other = await render(seconds, (ctx, beat) => {
    for (let t = 0, bar = 0; t < seconds; t += beat * 4, bar++) {
      for (const f of chords[bar % 4]) {
        for (const stab of [0, 1.5, 2.5]) {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          const s = t + stab * beat;
          o.type = "triangle";
          o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, s);
          g.gain.exponentialRampToValueAtTime(0.12, s + 0.01);
          g.gain.exponentialRampToValueAtTime(0.001, s + beat * 0.8);
          o.connect(g).connect(ctx.destination);
          o.start(s);
          o.stop(s + beat);
        }
      }
    }
  });
  const vocals = new Float32Array(drums.length);
  const sum = new Float32Array(drums.length);
  for (let i = 0; i < sum.length; i++) sum[i] = drums[i] + bass[i] + other[i];
  return { mix: [sum, sum.slice()], parts: [drums, bass, other, vocals], seconds, bpm: 124 };
}

/** Signal-to-distortion ratio in dB of an estimate against the truth (mono, same length). */
export function sdr(truth: Float32Array, est: Float32Array, from = 0, to = truth.length) {
  let s = 0;
  let e = 0;
  for (let i = from; i < to; i++) {
    s += truth[i] * truth[i];
    const d = truth[i] - est[i];
    e += d * d;
  }
  return 10 * Math.log10((s + 1e-12) / (e + 1e-12));
}
