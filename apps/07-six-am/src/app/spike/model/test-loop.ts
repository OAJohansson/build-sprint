// Synthetic test loop for the model spike's ?test=tone mode: no tab capture needed.
// Four-on-the-floor kick, offbeat A bass (55 + 110 Hz sines), offbeat noise hat, A minor stab per bar.
export const TEST_BPM = 124;

export async function renderTestLoop(rate: number, seconds: number): Promise<Float32Array<ArrayBuffer>> {
  const ctx = new OfflineAudioContext(1, rate * seconds, rate);
  const beat = 60 / TEST_BPM;

  const noise = ctx.createBuffer(1, Math.ceil(rate * 0.03), rate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;

  const voice = (freq: number, start: number, len: number, peak: number, decay: number, sweepFrom?: number) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.frequency.setValueAtTime(sweepFrom ?? freq, start);
    if (sweepFrom) osc.frequency.setTargetAtTime(freq, start, 0.03);
    g.gain.setValueAtTime(peak, start);
    g.gain.setTargetAtTime(0, start, decay);
    osc.connect(g).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + len);
  };

  for (let t = 0; t + 0.001 < seconds; t += beat) {
    voice(45, t, 0.4, 0.8, 0.15, 150); // kick
    const off = t + beat / 2;
    voice(55, off, 0.18, 0.3, 0.1); // bass
    voice(110, off, 0.18, 0.15, 0.1);
    const hat = ctx.createBufferSource();
    const hg = ctx.createGain();
    hat.buffer = noise;
    hg.gain.setValueAtTime(0.12, off);
    hg.gain.setTargetAtTime(0, off, 0.01);
    hat.connect(hg).connect(ctx.destination);
    hat.start(off);
  }
  for (let t = 0; t + 0.001 < seconds; t += beat * 4) {
    for (const f of [220, 261.63, 329.63]) voice(f, t, 0.5, 0.08, 0.25); // A minor stab
  }

  const out = await ctx.startRendering();
  return new Float32Array(out.getChannelData(0));
}
