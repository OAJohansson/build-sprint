// Grades the AI-loop bake-off files: tempo, key, length/loop point, quality proxies.
// Run: node analyse.ts <bakeoffDir> <pcmDir>   (Node 24, type stripping)
import fs from "node:fs";
import path from "node:path";
import { melFrames, estimateBpm, estimateKey, rankKeys, chromaProfile } from "./ears/features.ts";

const [BAKE, PCM] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(path.join(BAKE, "manifest.json"), "utf8"));
const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const KK_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];

type Audio = { sr: number; L: Float32Array; R: Float32Array };

function readWav(file: string): Audio {
  const b = fs.readFileSync(file);
  let p = 12, fmt: any = null;
  while (p < b.length - 8) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") fmt = { ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) };
    if (id === "data") {
      const n = Math.floor(size / (2 * fmt.ch));
      const L = new Float32Array(n), R = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        L[i] = b.readInt16LE(p + 8 + i * 2 * fmt.ch) / 32768;
        R[i] = fmt.ch > 1 ? b.readInt16LE(p + 8 + i * 2 * fmt.ch + 2) / 32768 : L[i];
      }
      return { sr: fmt.sr, L, R };
    }
    p += 8 + size + (size & 1);
  }
  throw new Error("no data chunk " + file);
}
function readF32(base: string): Audio {
  const meta = JSON.parse(fs.readFileSync(base + ".json", "utf8"));
  const buf = fs.readFileSync(base + ".f32");
  const all = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
  const n = all.length / 2, L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) { L[i] = all[2 * i]; R[i] = all[2 * i + 1]; }
  return { sr: meta.sr, L, R };
}
const mono = (a: Audio) => { const m = new Float32Array(a.L.length); for (let i = 0; i < m.length; i++) m[i] = 0.5 * (a.L[i] + a.R[i]); return m; };

// Windowed-sinc resampler to 16 kHz (low-pass at 7.2 kHz), for the app's Ears code.
function resample(x: Float32Array, from: number, to: number): Float32Array {
  const ratio = from / to, n = Math.floor(x.length / ratio), out = new Float32Array(n);
  const fc = (0.45 * to) / from, half = 32;
  for (let i = 0; i < n; i++) {
    const c = i * ratio, c0 = Math.floor(c);
    let s = 0, w = 0;
    for (let k = c0 - half + 1; k <= c0 + half; k++) {
      if (k < 0 || k >= x.length) continue;
      const t = k - c;
      const sinc = t === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * t) / (Math.PI * t);
      const win = 0.5 + 0.5 * Math.cos((Math.PI * t) / half);
      s += x[k] * sinc * win; w += sinc * win;
    }
    out[i] = w ? s / w : 0;
  }
  return out;
}

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
function spectra(x: Float32Array, size: number, hop: number, cb: (pow: Float64Array, i: number) => void) {
  const win = new Float64Array(size).map((_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / size));
  const re = new Float64Array(size), im = new Float64Array(size), pow = new Float64Array(size / 2 + 1);
  for (let f = 0, s = 0; s + size <= x.length; s += hop, f++) {
    for (let i = 0; i < size; i++) { re[i] = x[s + i] * win[i]; im[i] = 0; }
    fft(re, im);
    for (let k = 0; k <= size / 2; k++) pow[k] = re[k] * re[k] + im[k] * im[k];
    cb(pow, f);
  }
}
const pearson = (a: number[], b: number[]) => {
  const n = a.length, ma = a.reduce((s, x) => s + x, 0) / n, mb = b.reduce((s, x) => s + x, 0) / n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; }
  return da && db ? num / Math.sqrt(da * db) : 0;
};
function keyRank(chroma: number[]) {
  const all: { key: string; scale: string; r: number }[] = [];
  for (let t = 0; t < 12; t++) {
    const rot = chroma.map((_, i) => chroma[(i + t) % 12]);
    all.push({ key: NOTES[t], scale: "major", r: pearson(rot, KK_MAJOR) });
    all.push({ key: NOTES[t], scale: "minor", r: pearson(rot, KK_MINOR) });
  }
  return all.sort((a, b) => b.r - a.r);
}
// Second opinion for key: bass-range chroma (30–400 Hz) at full rate, 16384-pt frames (2.7 Hz bins).
function bassChroma(x: Float32Array, sr: number) {
  const size = 16384, binHz = sr / size, chroma = new Array(12).fill(0);
  const lo = Math.ceil(30 / binHz), hi = Math.floor(400 / binHz);
  spectra(x, size, 4096, (pow) => {
    const mag = pow.map(Math.sqrt);
    let frame = 0; for (let k = lo; k <= hi; k++) frame += mag[k];
    if (frame <= 0) return;
    for (let k = lo; k <= hi; k++) {
      const a = mag[k - 1], b = mag[k], c = mag[k + 1];
      if (b <= a || b < c) continue;
      const d = a - 2 * b + c, hz = (k + (d !== 0 ? (0.5 * (a - c)) / d : 0)) * binHz;
      const pc = (((Math.round(12 * Math.log2(hz / 440)) + 9) % 12) + 12) % 12;
      chroma[pc] += b / frame;
    }
  });
  return chroma;
}
const pcOf = (k: string) => NOTES.indexOf(k);
function keyVerdict(reqKey: string, reqScale: string, key: string, scale: string) {
  const r = pcOf(reqKey), g = pcOf(key);
  if (r === g && reqScale === scale) return "same";
  const rel = reqScale === "minor" ? (r + 3) % 12 : (r + 9) % 12;
  if (g === rel && scale !== reqScale) return "relative";
  if (r === g) return "parallel";
  if ((g - r + 12) % 12 === 7 || (r - g + 12) % 12 === 7) return "fifth";
  return "other";
}

// Second opinion for tempo: spectral-flux onset ACF at 100 fps over the whole file, comb of 8 beat
// multiples, 0.05 BPM grid, 60–200 BPM, no prior. Also the comb score at exactly the requested tempo.
function ownTempo(x: Float32Array, sr: number, req: number) {
  const hop = Math.round(sr / 100), size = 2048, fps = sr / hop, prev = new Float64Array(size / 2 + 1);
  const on: number[] = [];
  spectra(x, size, hop, (pow, f) => {
    let s = 0;
    for (let k = 1; k <= size / 2; k++) { const v = Math.log(1 + 1000 * pow[k]); const d = v - prev[k]; if (d > 0 && f > 0) s += d; prev[k] = v; }
    on.push(s);
  });
  const n = on.length, m = on.reduce((a, b) => a + b, 0) / n;
  const o = on.map((v) => v - m);
  const maxLag = Math.min(n - 1, Math.ceil(fps * 8 * 1.0)); // 8 beats at 60 BPM
  const ac = new Float64Array(maxLag + 1);
  for (let l = 0; l <= maxLag; l++) { let s = 0; for (let i = l; i < n; i++) s += o[i] * o[i - l]; ac[l] = s / (n - l); }
  const a0 = ac[0]; for (let l = 0; l <= maxLag; l++) ac[l] /= a0;
  const at = (x: number) => { const i = Math.floor(x), t = x - i; return i + 1 > maxLag ? NaN : ac[i] * (1 - t) + ac[i + 1] * t; };
  const score = (bpm: number) => { const lag = (fps * 60) / bpm; let s = 0, c = 0; for (let k = 1; k <= 8; k++) { const v = at(k * lag); if (!isNaN(v)) { s += v; c++; } } return c ? s / c : 0; };
  let best = 0, bs = -Infinity;
  for (let b = 60; b <= 200; b += 0.05) { const s = score(b); if (s > bs) { bs = s; best = b; } }
  // best within ±3% of requested (does the requested tempo have a peak nearby?)
  let near = 0, ns = -Infinity;
  for (let b = req * 0.97; b <= req * 1.03; b += 0.05) { const s = score(b); if (s > ns) { ns = s; near = b; } }
  return { bpm: Math.round(best * 10) / 10, score: bs, nearReq: Math.round(near * 10) / 10, nearScore: ns, atReq: score(req), half: score(req / 2), dbl: score(req * 2) };
}

const db = (x: number) => (x > 0 ? 20 * Math.log10(x) : -Infinity);
function rms(x: Float32Array, a: number, b: number) { let s = 0; a = Math.max(0, a); b = Math.min(x.length, b); for (let i = a; i < b; i++) s += x[i] * x[i]; return Math.sqrt(s / Math.max(1, b - a)); }

function quality(a: Audio, x: Float32Array) {
  let peak = 0, clip = 0;
  for (const ch of [a.L, a.R]) for (let i = 0; i < ch.length; i++) { const v = Math.abs(ch[i]); if (v > peak) peak = v; if (v >= 0.999) clip++; }
  // silence: 50 ms windows below -60 dBFS
  const w = Math.round(a.sr * 0.05); let sil = 0, tot = 0;
  for (let s = 0; s + w <= x.length; s += w) { tot++; if (db(rms(x, s, s + w)) < -60) sil++; }
  // leading silence: first 5 ms window above -40 dBFS
  const w5 = Math.round(a.sr * 0.005); let lead = 0;
  for (let s = 0; s + w5 <= x.length; s += w5) { if (db(rms(x, s, s + w5)) > -40) { lead = s / a.sr; break; } }
  // spectral: flatness (mean over non-silent frames), energy share below 250 Hz and above 4 kHz
  const size = 4096, binHz = a.sr / size; let flat = 0, nf = 0, low = 0, high = 0, all = 0;
  spectra(x, size, 2048, (pow) => {
    let sum = 0, logs = 0, cnt = 0;
    for (let k = 1; k < pow.length; k++) { const p = pow[k] + 1e-12; sum += p; logs += Math.log(p); cnt++; if (k * binHz < 250) low += pow[k]; if (k * binHz > 4000) high += pow[k]; all += pow[k]; }
    if (sum / cnt > 1e-7) { flat += Math.exp(logs / cnt) / (sum / cnt); nf++; }
  });
  return { peakDb: db(peak), clipSamples: clip, rmsDb: db(rms(x, 0, x.length)), silencePct: (100 * sil) / Math.max(1, tot), leadSilenceMs: lead * 1000, flatness: nf ? flat / nf : 0, lowShare: low / all, highShare: high / all };
}

// Loop seam: wrapping the region [0, end) back to 0. Level jump = RMS of last 20 ms vs first 20 ms.
// Click = |last sample − first sample| over the 99th-percentile sample-to-sample step in the region.
function seam(x: Float32Array, sr: number, end: number) {
  const w = Math.round(sr * 0.02);
  const tail = rms(x, end - w, end), head = rms(x, 0, w);
  const steps: number[] = []; for (let i = 1; i < end; i += 7) steps.push(Math.abs(x[i] - x[i - 1]));
  steps.sort((p, q) => p - q); const p99 = steps[Math.floor(steps.length * 0.99)] || 1e-9;
  const jump = Math.abs(x[end - 1] - x[0]);
  // fade-out proxy: RMS of the last 250 ms vs the whole region
  const fade = db(rms(x, end - Math.round(sr * 0.25), end)) - db(rms(x, 0, end));
  return { levelJumpDb: +(db(Math.max(tail,1e-6)) - db(Math.max(head,1e-6))).toFixed(1), clickRatio: jump / p99, tailVsAllDb: fade };
}
// Does the phrase repeat? Correlation of the low-band (< 400 Hz) spectrogram between successive phrases.
function phraseRepeat(x: Float32Array, sr: number, phraseSec: number) {
  const size = 4096, hop = 1024, binHz = sr / size, kHi = Math.floor(400 / binHz), frames: number[][] = [];
  spectra(x, size, hop, (pow) => { const v: number[] = []; for (let k = 1; k <= kHi; k++) v.push(Math.log(1 + 1e4 * pow[k])); frames.push(v); });
  const fps = sr / hop, L = Math.round(phraseSec * fps), out: number[] = [];
  for (let p = 1; (p + 1) * L <= frames.length; p++) {
    const a = frames.slice(0, L).flat(), b = frames.slice(p * L, (p + 1) * L).flat();
    out.push(Math.round(pearson(a, b) * 100) / 100);
  }
  return out;
}

const rows: any[] = [];
for (const it of manifest.items) {
  const variant = it.model;
  const audio = it.file.endsWith(".wav") ? readWav(path.join(BAKE, it.file)) : readF32(path.join(PCM, it.file.replace("/", "_")));
  const x = mono(audio);
  const dur = x.length / audio.sr;
  const phrase = (it.requested.bars * 4 * 60) / it.requested.bpm;
  const pcm16 = resample(x, audio.sr, 16000);
  const appBpm = estimateBpm(melFrames(pcm16));
  const appKey = estimateKey(pcm16);
  const appRank = rankKeys(chromaProfile(pcm16)).slice(0, 3).map((k) => `${k.key} ${k.scale} ${k.strength.toFixed(2)}`);
  const bc = bassChroma(x, audio.sr); const bass = keyRank(bc);
  const own = ownTempo(x, audio.sr, it.requested.bpm);
  const req = it.requested.bpm;
  const tempoVerdict = (b: number) => Math.abs(b - req) <= 1 ? "pass" : Math.abs(b - req / 2) <= 1 || Math.abs(b - req * 2) <= 1 ? "half/double" : "fail";
  const kv = keyVerdict(it.requested.key, it.requested.scale, appKey.key, appKey.scale);
  const kvBass = keyVerdict(it.requested.key, it.requested.scale, bass[0].key, bass[0].scale);
  const endSamples = Math.min(x.length, Math.round(phrase * audio.sr));
  const row = {
    variant, n: it.n, req: `${req} ${it.requested.key} ${it.requested.scale} ${it.requested.bars}b`,
    durSec: +dur.toFixed(3), phraseSec: +phrase.toFixed(3), lenErrMs: Math.round((dur - phrase) * 1000),
    appBpm: appBpm.bpm, appConf: appBpm.confidence, appAlt: appBpm.alternative ? `${appBpm.alternative.bpm} (${appBpm.alternative.relation}, ${appBpm.alternative.ratio})` : null,
    ownBpm: own.bpm, ownNearReq: own.nearReq, ownScoreBest: +own.score.toFixed(3), ownScoreAtReq: +own.atReq.toFixed(3),
    tempo: tempoVerdict(appBpm.bpm), tempoOwn: tempoVerdict(own.bpm),
    appKey: `${appKey.key} ${appKey.scale} (${appKey.strength.toFixed(2)})`, appTop3: appRank, keyV: kv,
    bassKey: `${bass[0].key} ${bass[0].scale} (${bass[0].r.toFixed(2)})`, bassKeyV: kvBass,
    seamWhole: seam(x, audio.sr, x.length), seamPhrase: endSamples < x.length ? seam(x, audio.sr, endSamples) : null,
    repeat: phraseRepeat(x, audio.sr, phrase),
    q: quality(audio, x), bc: (()=>{const t=NOTES.indexOf(it.requested.key);const s=bc.reduce((a,b)=>a+b,0);const r=(i:number)=>Math.round(100*bc[(t+i)%12]/s);return {root:r(0),m3:r(3),M3:r(4),p5:r(7),m6:r(8),m7:r(10),M7:r(11),M6:r(9),inScalePct:(()=>{const mn=[0,2,3,5,7,8,10],mj=[0,2,4,5,7,9,11];const sc=it.requested.scale==="minor"?mn:mj;return sc.reduce((a,i)=>a+r(i),0)})()}})(), secondsTaken: it.secondsTaken, costUsd: it.costUsd,
  };
  rows.push(row);
  console.error(variant, it.n, "done");
}
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "results.json"), JSON.stringify(rows, null, 1));
for (const r of rows) console.log(JSON.stringify(r));
