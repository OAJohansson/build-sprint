// The Lab's transport (L155, L161): drives the Deck over its protocol and the live separation, and
// adds what a player needs on top of LiveParts: play / pause / seek with a real "catching up…"
// (muted until new audio plays, timing.ts), section loops replayed seamlessly from memory
// (loop-buffer.ts), chord estimates per 8 bars (chords.ts) and the model's download progress.
// No UI. Rights (L143, L161): live regions play once and are dropped; a loop's parts live in memory
// only while the loop is on (max 16 bars) and are zeroed when it ends, the loop changes or the
// transport stops; chords are kept as names only. Nothing is stored, exported or uploaded.
import { BarLevels, type PartLevels } from "./activity";
import { ChordCells } from "./chords";
import { DeckRemote, type DeckState } from "./deck-protocol";
import { LiveError, LiveParts, type LiveStats, type Region } from "./live";
import { LoopBuffer } from "./loop-buffer";
import { bandShareDb, StereoMeter } from "@/lib/make/meter";
import { analyseLoop, band, closeness, stepEnergy, type Closeness, type LoopReport } from "@/lib/make/closeness";
import { drumsCloseness, drumsReport, type DrumsCloseness } from "@/lib/make/drums-make";
import { lufs, rmsDb } from "@/lib/make/level";
import { RecentParts, faded } from "./recent";
import { Separator } from "./separator-client";
import { gateResume, isCatching, loopFillEtaS, loopPositionMs, msToSamples, playTimeOf, runOffset } from "./timing";

/** Seconds of the track played before a loop's start while it fills, so the Deck's seek settles. */
const PRE_ROLL_MS = 1000;
/** Samples past a loop's end kept for the wrap crossfade (10 ms). */
const TAIL_S = 0.01;
const POLL_MS = 50;
const KEEP_MARKS = 600; // 60 s of Deck reports
/** How long a seek usually takes to bring new audio (measured ~5.8 s): the length played from
 *  recent parts while the Deck catches up behind it. */
const CATCH_S = 6.5;

export type ModelProgress = {
  /** Bytes so far and in all (0 when unknown); `downloading` false when it came from the cache. */
  loaded: number;
  total: number;
  downloading: boolean;
  /** Seconds left at the speed so far (null before there is a speed). */
  etaS: number | null;
  ready: boolean;
  error: string | null;
};

export type LoopState = {
  startMs: number; endMs: number; state: "filling" | "memory"; filled: number;
  /** While filling: seconds until it's in memory (estimate), and how many times a pass fell short. */
  etaS: number | null; laps: number;
};

export type TransportState = {
  /** A Deck window for this track has reported in the last 2 s. */
  deckOpen: boolean;
  /** idle → listening (sharing, model loading) → ready; stopped after Chrome's "Stop sharing". */
  phase: "idle" | "starting" | "ready" | "stopped";
  model: ModelProgress | null;
  playing: boolean;
  /** What you hear now (the seek target while catching up), track ms. */
  heardMs: number;
  catching: boolean;
  /** Seconds until new audio, roughly, while catching up (null otherwise). */
  catchLeftS: number | null;
  /** The parts were playing and the Deck went away (window closed, sharing stopped). */
  deckClosed: boolean;
  loop: LoopState | null;
  chords: (string | null)[];
  stats: LiveStats | null;
  error: string | null;
};

type Gate = { since: number; targetMs: number; fromMs: number; captureFrom: number | null };
type Run = { captureFrom: number; offsetS: number };
type Loop = {
  startMs: number; endMs: number; state: "filling" | "memory";
  buf: LoopBuffer | null;
  audio: AudioBuffer[] | null; // memory: one stereo buffer per part
  sources: AudioBufferSourceNode[];
  t0: number; // memory: ctx time at which the loop was at startMs
  laps: number; // passes that reached the loop's end without all of it
  graceAt?: number; // ctx time a nearly full pass started waiting for its last regions
};

export type TransportOptions = {
  url: string;
  bpm: number;
  originSec: number;
  bars: number;
  durationMs: number;
  /** Chords already known (from the saved map), one per 8 bars. */
  knownChords?: (string | null)[];
  /** Graders' runs: no sound out. */
  quiet?: boolean;
  /** Where the Deck page lives (the dev spike has its own). */
  deckPath?: string;
  hopS?: number;
  guardS?: number;
  /** Any change worth redrawing (not the moving playhead: poll `heardMs()` for that). */
  onChange?: (s: TransportState) => void;
  /** New chord names (cells that changed). Names only: save them with the map if wanted. */
  onChords?: (cells: (string | null)[], changed: number[]) => void;
  /** "catching up…" is over: new audio is playing. */
  onCaughtUp?: () => void;
  /** Part levels per bar already known (from the saved map). */
  knownLevels?: PartLevels | null;
  /** The separated parts' levels per bar changed (numbers only; save them with the map if wanted). */
  onLevels?: (levels: PartLevels) => void;
};

export class LabTransport {
  private sep: Separator | null = null;
  private live: LiveParts | null = null;
  private deck: DeckRemote;
  private marks: { at: number; posMs: number; playing: boolean }[] = [];
  private gate: Gate | null = null;
  private run: Run | null = null;
  private unmuteAt: number | null = null;
  private loopS: Loop | null = null;
  private pausedMs = 0;
  private playingS = false;
  private phase: TransportState["phase"] = "idle";
  private model: ModelProgress | null = null;
  private stats: LiveStats | null = null;
  private error: string | null = null;
  private chordCells: ChordCells;
  private barLevels: BarLevels;
  private deckStoppedAt: number | null = null;
  private wasCatching = false;
  private lastKey = "";
  private timer: ReturnType<typeof setInterval>;
  private dlStart = 0;
  private deckWaiters = new Set<() => void>();
  private recent: RecentParts | null = null;
  /** Playing from recent parts while the Deck catches up behind (LS1-4). */
  private mem: { t0: number; startMs: number; endMs: number; endAt: number; sources: AudioBufferSourceNode[] } | null = null;
  private analysers: StereoMeter[] = [];
  // Make (S3): "Mine" loops with the memory loop, in sync; B on the A/B turns it up (mineOn).
  private mine: { buf: AudioBuffer; src: AudioBufferSourceNode | null; fade: GainNode | null } | null = null;
  private mineOut: { gain: GainNode; an: StereoMeter } | null = null;
  private mineOnS = false;
  private deckClosed = false;
  private lastOrphanPause = 0;
  private dl = { t: 0, loaded: 0, speed: 0 };

  constructor(private o: TransportOptions) {
    this.chordCells = new ChordCells(o.bars, o.bpm, o.originSec, o.knownChords);
    this.barLevels = new BarLevels(o.bars, o.bpm, o.originSec, o.knownLevels);
    this.deck = new DeckRemote(o.url, (s) => this.onDeck(s));
    this.timer = setInterval(() => this.poll(), POLL_MS);
  }

  // ── Setup ──────────────────────────────────────────────────────────────────────────────────────

  /** Starts the model download (cached after the first time). Safe to call more than once. */
  prepare() {
    if (this.sep) return this.sep;
    this.model = { loaded: 0, total: 0, downloading: false, etaS: null, ready: false, error: null };
    this.sep = new Separator((loaded, total) => {
      if (!this.model) return;
      const now = performance.now();
      if (!this.model.downloading) { this.dlStart = now; this.dl = { t: now, loaded, speed: 0 }; }
      // A moving average of the speed, and no estimate for the first 3 s (LS1-7).
      const dt = (now - this.dl.t) / 1000;
      if (dt > 0.2) {
        const inst = (loaded - this.dl.loaded) / dt;
        this.dl = { t: now, loaded, speed: this.dl.speed ? 0.8 * this.dl.speed + 0.2 * inst : inst };
      }
      const el = (now - this.dlStart) / 1000;
      const etaS = el >= 3 && this.dl.speed > 0 && total ? Math.max(0, (total - loaded) / this.dl.speed) : null;
      this.model = { ...this.model, loaded, total, downloading: true, etaS };
      this.emit(true);
    });
    this.sep.loaded.then(
      (m) => { this.model = { ...this.model!, loaded: m.bytes, total: m.bytes, etaS: 0, ready: true }; this.emit(true); },
      (e: Error) => { this.model = { ...this.model!, error: e.message }; this.emit(true); },
    );
    return this.sep;
  }

  /** Opens the Deck window for this track. Call from a click. */
  openDeck() {
    this.prepare();
    return this.deck.openWindow(this.o.url, this.o.deckPath);
  }

  /**
   * L178, the first Play, from one click: opens the Deck window, waits for its first report (it
   * has loaded and carries its title, ~2 s), then asks Chrome to share it. Checked in Chrome 155
   * with fresh profiles (`/dev/lab-spike/share-test`):
   * - window.open uses up the click's activation, yet getDisplayMedia still opens the picker
   *   afterwards (no activation needed in Chrome 155);
   * - asking right after window.open (same task) opens the picker before the Deck tab has its
   *   title, so --auto-select-tab-capture-source-by-title missed it 3 of 4 times; sharing first, or
   *   an about:blank window navigated after, missed it every time;
   * - waiting for the Deck's first report, then asking: auto-select found it 2 of 2 (~2.3 s), and
   *   without the flag the picker opens with the Deck already listed.
   * With a Deck already open it shares at once, in the click (the dependable path, and the fallback
   * if a later Chrome requires the activation: the first Play leaves the Deck open, the second shares).
   * Throws LiveError("popup") when the Deck window was blocked (nothing is asked then).
   */
  async openDeckAndListen(waitMs = 5000) {
    if (this.deck.open) return this.listen(); // shares in this click
    const w = this.openDeck();
    if (!w) {
      this.error = "Chrome blocked the Deck window. Allow pop-ups for Six AM, then press Play again.";
      this.emit(true);
      throw new LiveError("popup", this.error);
    }
    this.phase = "starting";
    this.emit(true);
    await this.waitForDeck(waitMs);
    return this.listen();
  }

  /** Resolves on the Deck's next report, or after `ms` (true if it reported). */
  waitForDeck(ms: number) {
    return new Promise<boolean>((resolve) => {
      const t = setTimeout(() => { this.deckWaiters.delete(done); resolve(false); }, ms);
      const done = () => { clearTimeout(t); resolve(true); };
      this.deckWaiters.add(done);
    });
  }

  /**
   * Shares the Deck tab (Chrome's dialog) and starts separating, then plays from the start. Call
   * from a click on this visible tab. Throws LiveError (cancelled, no audio, hidden, unsupported).
   */
  async listen() {
    const sep = this.prepare();
    this.phase = "starting";
    this.error = null;
    this.emit(true);
    try {
      this.live = await LiveParts.start(sep, {
        hopS: this.o.hopS, guardS: this.o.guardS, muted: this.o.quiet, gated: true,
        onStats: (st) => { this.stats = st; },
        onRegion: (r) => this.onRegion(r),
        onEnded: () => this.onLiveEnded(),
      });
    } catch (e) {
      this.phase = "idle";
      this.error = e instanceof Error ? e.message : String(e);
      this.emit(true);
      throw e;
    }
    this.phase = "ready";
    this.deckClosed = false;
    // LS1-3: Deck reports are timed on the AudioContext's clock, and a new listen has a new one.
    // Old reports (from before the Deck was closed) would skew the new run's offset for as long as
    // they outnumbered new ones: the Lab waited ~30 s and resumed ~26 s late.
    this.marks = [];
    this.recent = new RecentParts(this.live.rate);
    // Graders (LS1 tester): what each part sends out after hear-only/mute, as a level.
    // Both channels' RMS (F2), the measure Make's A/B matches with (level.ts rmsDb).
    this.analysers = this.live.gains.map((g) => new StereoMeter(this.live!.ctx, g));
    this.play();
  }

  // ── Transport ──────────────────────────────────────────────────────────────────────────────────

  get playing() { return this.playingS; }

  play() {
    if (!this.live) return;
    const l = this.loopS;
    if (l?.state === "memory") { this.startLoopSources(this.pausedMs); this.playingS = true; this.emit(true); return; }
    if (this.pausedMs >= this.o.durationMs - 1000) this.pausedMs = 0; // at the end: from the top
    if (!this.startRecent(this.pausedMs)) this.seekLive(this.pausedMs);
  }

  pause() {
    if (!this.live || !this.playingS) return;
    this.pausedMs = this.heardMs();
    this.playingS = false;
    this.stopRecent();
    if (this.loopS?.state === "memory") this.stopLoopSources();
    else {
      this.deck.pause();
      this.setLive(false);
      this.gate = null;
      this.run = null;
      this.unmuteAt = null;
    }
    this.emit(true);
  }

  /** Seek to a track position. Inside a memory loop it jumps at once; elsewhere it catches up. */
  seek(ms: number) {
    ms = Math.max(0, Math.min(this.o.durationMs, ms));
    const l = this.loopS;
    if (l && (ms < l.startMs || ms >= l.endMs)) this.setLoop(null, false);
    else if (l?.state === "memory") {
      this.pausedMs = ms;
      if (this.playingS) this.startLoopSources(ms);
      this.emit(true);
      return;
    }
    if (this.playingS) { if (!this.startRecent(ms)) this.seekLive(ms); }
    else { this.pausedMs = ms; this.emit(true); }
  }

  /** Which parts are heard: drums, bass, other, vocals. */
  setParts(on: boolean[]) { this.live?.setParts(on); }

  /**
   * Loops [startMs, endMs) (at most 16 bars, timing.ts loopBars), or ends the loop with null. The
   * first pass plays live and fills the buffer; from then on it replays from memory.
   */
  setLoop(range: { startMs: number; endMs: number } | null, resume = true) {
    const wasMemory = this.loopS?.state === "memory";
    const at = this.heardMs();
    this.dropLoop();
    if (!range) {
      if (wasMemory && resume) { if (this.playingS) this.seekLive(at); else this.pausedMs = at; }
      this.emit(true);
      return;
    }
    const rate = this.live?.rate ?? 44100;
    const len = msToSamples(range.endMs - range.startMs, rate);
    this.loopS = { ...range, state: "filling", buf: new LoopBuffer(len, Math.round(TAIL_S * rate)), audio: null, sources: [], t0: 0, laps: 0 };
    const inside = at >= range.startMs && at < range.endMs;
    // Owner bug (27 Oct): looping from mid-section kept playing to the loop's end, then threw that
    // pass away and filled a whole second pass (~50 s for 16 bars, "Make never starts"). Now the
    // stretch already heard comes from the recent parts in memory (the same run, so the joins line
    // up); if they don't reach back to the loop's start, it goes back to the start at once.
    if (this.playingS && this.run && inside && !wasMemory) { if (!this.prefillLoop(this.loopS, at)) this.seekLive(range.startMs); }
    else if (this.playingS) this.seekLive(range.startMs);
    else this.pausedMs = range.startMs;
    this.emit(true);
  }

  /** Copies the loop's start up to now from the recent parts into its buffer; false when they don't reach back. */
  private prefillLoop(l: Loop, atMs: number): boolean {
    const recent = this.recent, rate = this.live?.rate;
    if (!recent || !rate || !l.buf) return false;
    if (atMs - l.startMs < 300) return true; // just started: this pass fills it
    const start = Math.round((l.startMs / 1000) * rate);
    // At the track's start a run begins a little after 0 (≤ 1 s): that head counts as silence.
    const from = l.startMs < PRE_ROLL_MS ? recent.firstHeld(start, rate) ?? start : start;
    const until = recent.coveredUntil(from);
    if (until === null || until < Math.round((atMs / 1000) * rate) - rate * 0.5) return false;
    const chans = recent.build(from, Math.min(until, start + l.buf.total));
    if (!chans) return false;
    if (from > start) l.buf.fillSilence(from - start);
    l.buf.write(chans, from - start);
    chans.forEach((a) => a.fill(0));
    return true;
  }

  /**
   * One part of the loop held in memory (0 drums, 1 bass, 2 other, 3 vocals), for Make's pattern,
   * patch matching and A/B (L161): the in-memory arrays themselves, valid only while the loop is
   * on. Null before the loop is in memory. Read it; never store or send it.
   */
  loopPart(p: number): { left: Float32Array; right: Float32Array; rate: number; startMs: number; endMs: number } | null {
    const l = this.loopS;
    const b = l?.state === "memory" ? l.audio?.[p] : null;
    return b && l ? { left: b.getChannelData(0), right: b.getChannelData(1), rate: b.sampleRate, startMs: l.startMs, endMs: l.endMs } : null;
  }

  /**
   * Make's "Mine" (S3): a stereo buffer that loops with the memory loop, starting with it at the
   * loop's start (its own length repeats; a buffer within 1% of the loop's length is fitted to it).
   * Swapped in place while playing, in sync, with a 15 ms crossfade. Null removes it. Not original
   * audio: it is the owner's own render (or an AI loop).
   */
  setMine(m: { left: Float32Array; right: Float32Array; rate: number } | null, owner: "bass" | "drums" = "bass") {
    const live = this.live;
    if (!m || !live) { this.stopMine(); this.mine = null; this.mineOwnerS = null; return; }
    this.mineOwnerS = owner;
    const loopLen = this.loopS?.audio?.[0]?.length ?? 0;
    const n = loopLen && Math.abs(m.left.length - loopLen) <= loopLen * 0.01 ? loopLen : m.left.length;
    const buf = live.ctx.createBuffer(2, n, m.rate);
    buf.copyToChannel(m.left.subarray(0, n) as Float32Array<ArrayBuffer>, 0);
    buf.copyToChannel(m.right.subarray(0, n) as Float32Array<ArrayBuffer>, 1);
    this.mine = { buf, src: this.mine?.src ?? null, fade: this.mine?.fade ?? null };
    if (this.playingS && this.loopS?.state === "memory") this.startMine();
  }

  /** Phase 5: which Make family's sound Mine holds now (one buffer for every family). */
  get mineOwner() { return this.mine ? this.mineOwnerS : null; }
  private mineOwnerS: "bass" | "drums" | null = null;

  /** B on Make's A/B: Mine heard (the parts' gains are set separately with setParts). */
  setMineOn(on: boolean) {
    this.mineOnS = on;
    const o = this.mineOutput();
    if (o) o.gain.gain.setTargetAtTime(on ? 1 : 0, o.gain.context.currentTime, 0.01);
  }

  /** Mine's level now (dB RMS of both channels over ~186 ms, before the master), for graders; −120 when silent. */
  mineLevel(): number {
    return this.mineOut?.an.db() ?? -120;
  }

  /** Graders (owner's "thinner" note, 27 Oct): energy below 100 and 400 Hz, dB re total, of the original bass in the loop and of Mine. Numbers only. */
  weight(): { original: [number, number] | null; mine: [number, number] | null } {
    const o = this.loopPart(1), m = this.mine?.buf;
    const two = (l: Float32Array, r: Float32Array, rate: number): [number, number] => [bandShareDb(l, r, rate, 100), bandShareDb(l, r, rate, 400)];
    return { original: o ? two(o.left, o.right, o.rate) : null, mine: m ? two(m.getChannelData(0), m.getChannelData(1), m.sampleRate) : null };
  }

  /**
   * Graders (the closeness test, 27 Oct): the looped original bass analysed (closeness.ts, numbers
   * only), the drums' sub and low band per 16th (where the kick is), and Mine's report if there is one.
   */
  capture(onsets: number[]): { bass: LoopReport; kick: number[][]; mine: LoopReport | null; closeness: Closeness | null } | null {
    const b = this.loopPart(1), d = this.loopPart(0), m = this.mine?.buf;
    if (!b || !d) return null;
    const bpm = this.o.bpm;
    const mono = new Float32Array(d.left.length);
    for (let i = 0; i < mono.length; i++) mono[i] = (d.left[i] + d.right[i]) / 2;
    const kick = [band(mono, d.rate, 30, 60), band(mono, d.rate, 60, 120)].map((x) => stepEnergy(x, d.rate, bpm));
    const bass = analyseLoop(b.left, b.right, b.rate, bpm, onsets), mine = m ? analyseLoop(m.getChannelData(0), m.getChannelData(1), m.sampleRate, bpm, onsets) : null;
    return { bass, kick, mine, closeness: mine ? closeness(bass, mine) : null };
  }

  /**
   * Graders (Phase 5, Z5): the loudness of a looped part (0 drums, 1 bass, 2 other, 3 vocals) and of
   * Mine, RMS dB and LUFS over the whole loop, so A/B can be checked level-matched. Numbers only.
   */
  compareLevels(p: number): { original: { rmsDb: number; lufs: number } | null; mine: { rmsDb: number; lufs: number } | null } {
    const o = this.loopPart(p), m = this.mine?.buf;
    const lv = (s: { left: Float32Array; right: Float32Array; rate: number }) => ({ rmsDb: Math.round(rmsDb(s) * 100) / 100, lufs: Math.round(lufs(s) * 100) / 100 });
    return { original: o ? lv(o) : null, mine: m ? lv({ left: m.getChannelData(0), right: m.getChannelData(1), rate: m.sampleRate }) : null };
  }

  /** Graders (Phase 5, P8): the drums closeness of Mine against the looped drum part, measured here. Numbers only. */
  captureDrums(): DrumsCloseness | null {
    const d = this.loopPart(0), m = this.mine?.buf;
    if (!d || !m) return null;
    return drumsCloseness(drumsReport(d.left, d.right, d.rate, this.o.bpm), drumsReport(m.getChannelData(0), m.getChannelData(1), m.sampleRate, this.o.bpm));
  }

  private mineOutput() {
    const live = this.live;
    if (!live) return null;
    if (this.mineOut && this.mineOut.gain.context === live.ctx) return this.mineOut;
    const gain = live.ctx.createGain();
    gain.gain.value = this.mineOnS ? 1 : 0;
    gain.connect(live.master);
    this.mineOut = { gain, an: new StereoMeter(live.ctx, gain) };
    return this.mineOut;
  }

  /** Starts Mine in step with the memory loop (at `when`, default just ahead), replacing the old source. */
  private startMine(when?: number) {
    const live = this.live, l = this.loopS, m = this.mine, out = this.mineOutput();
    if (!live || !l || l.state !== "memory" || !m || !out) return;
    const ctx = live.ctx;
    const t = when ?? ctx.currentTime + 0.03;
    this.stopMine(t);
    const src = ctx.createBufferSource();
    src.buffer = m.buf;
    src.loop = true;
    src.loopStart = 0;
    src.loopEnd = m.buf.duration;
    const fade = ctx.createGain();
    fade.gain.setValueAtTime(0, t);
    fade.gain.linearRampToValueAtTime(1, t + 0.015);
    src.connect(fade).connect(out.gain);
    const off = (((t - l.t0) % m.buf.duration) + m.buf.duration) % m.buf.duration;
    src.start(t, off);
    m.src = src; m.fade = fade;
  }

  private stopMine(at?: number) {
    const m = this.mine;
    if (!m?.src) return;
    const src = m.src, fade = m.fade, ctx = src.context, t = Math.max(at ?? 0, ctx.currentTime);
    if (fade) { fade.gain.cancelScheduledValues(t); fade.gain.setValueAtTime(fade.gain.value, t); fade.gain.linearRampToValueAtTime(0, t + 0.015); }
    try { src.stop(t + 0.02); } catch { /* not started */ }
    src.onended = () => { src.disconnect(); fade?.disconnect(); };
    m.src = null; m.fade = null;
  }

  /** Each part's level per bar as heard so far (a copy). */
  levels(): PartLevels { return this.barLevels.levels.map((a) => [...a]); }

  /** What you hear now, track ms. */
  heardMs(): number {
    const live = this.live;
    if (!live) return this.pausedMs;
    const now = live.ctx.currentTime;
    const l = this.loopS;
    if (!this.playingS) return this.pausedMs;
    if (l?.state === "memory") return loopPositionMs(l.startMs, l.endMs, l.t0, now);
    if (this.mem && now < this.mem.endAt) return this.mem.startMs + Math.max(0, now - this.mem.t0) * 1000;
    if (this.gate) return this.gate.fromMs;
    if (!this.run || (this.unmuteAt !== null && now < this.unmuteAt)) return this.pausedMs;
    return Math.min(this.o.durationMs, (now - live.delayS + this.run.offsetS) * 1000);
  }

  get catching() {
    if (!this.live || !this.playingS || this.loopS?.state === "memory") return false;
    const now = this.live.ctx.currentTime;
    if (this.mem && now < this.mem.endAt) return false;
    return isCatching(!!this.gate, this.unmuteAt, now);
  }

  /** Roughly how many seconds until new audio while catching up. */
  get catchLeftS(): number | null {
    if (!this.catching || !this.live) return null;
    const now = this.live.ctx.currentTime;
    // Counts down; past the usual wait the number goes (no "1 s" that never ends, LS1-N2).
    if (this.gate) { const left = Math.ceil(this.gate.since + CATCH_S - now); return left >= 1 ? left : null; }
    return this.unmuteAt !== null ? Math.max(1, Math.ceil(this.unmuteAt - now)) : null;
  }

  /** What each part (drums, bass, other, vocals) is sending out now, RMS dB after hear-only/mute
   *  (−120 for silence or before the parts play). For graders: a part you hear only should be
   *  well above −60 dB where its lane shows a block. */
  partLevels(): number[] {
    return [0, 1, 2, 3].map((p) => {
      return this.analysers[p]?.db() ?? -120;
    });
  }

  get state(): TransportState {
    const l = this.loopS;
    return {
      deckOpen: this.deck.open,
      phase: this.phase,
      model: this.model,
      playing: this.playingS,
      heardMs: this.heardMs(),
      catching: this.catching,
      catchLeftS: this.catchLeftS,
      deckClosed: this.deckClosed,
      loop: l ? { startMs: l.startMs, endMs: l.endMs, state: l.state, filled: l.state === "memory" ? 1 : l.buf?.progress ?? 0, etaS: this.fillEta(l), laps: l.laps } : null,
      chords: [...this.chordCells.cells],
      stats: this.stats,
      error: this.error,
    };
  }

  private fillEta(l: Loop): number | null {
    if (l.state !== "filling" || !l.buf || !this.playingS) return null;
    const rate = this.live?.rate ?? 44100;
    return loopFillEtaS({
      loopS: (l.endMs - l.startMs) / 1000, posS: (this.heardMs() - l.startMs) / 1000, filledS: (l.buf.progress * l.buf.total) / rate,
      catchLeftS: this.gate ? this.catchLeftS ?? 1 : null, catchS: CATCH_S,
    });
  }

  /** Stops everything: sharing, the worker, the loop's memory, the Deck's playback. */
  dispose() {
    clearInterval(this.timer);
    this.stopRecent();
    this.recent?.clear();
    this.dropLoop();
    if (this.live) this.deck.pause();
    this.live?.stop();
    this.live = null;
    this.sep?.stop();
    this.sep = null;
    this.deck.close();
  }

  // ── Internals ──────────────────────────────────────────────────────────────────────────────────

  /** Seek the Deck to `ms` (a pre-roll before a loop's start) and mute until new audio plays. */
  private seekLive(ms: number, keepRecent = false) {
    const live = this.live;
    if (!live) return;
    if (!keepRecent) this.stopRecent();
    const pre = this.loopS && Math.abs(ms - this.loopS.startMs) < 1 ? PRE_ROLL_MS : 0;
    const target = Math.max(0, ms - pre);
    this.setLive(false);
    this.gate = { since: live.ctx.currentTime, targetMs: target, fromMs: ms, captureFrom: null };
    this.run = null;
    this.unmuteAt = null;
    this.pausedMs = ms;
    this.playingS = true;
    this.deckStoppedAt = null;
    this.deck.seek(target);
    this.emit(true);
  }

  private setLive(on: boolean, at?: number, hard = false) {
    const live = this.live;
    if (!live) return;
    const now = live.ctx.currentTime;
    const t = Math.max(now, at ?? now);
    for (const g of live.liveIn) {
      g.gain.cancelScheduledValues(now);
      if (hard) g.gain.setValueAtTime(on ? 1 : 0, t);
      else g.gain.setTargetAtTime(on ? 1 : 0, t, 0.005);
    }
  }

  private onDeck(s: DeckState) {
    this.deckWaiters.forEach((f) => f());
    this.deckWaiters.clear();
    const live = this.live;
    if (!live) {
      // A Deck left playing (the Lab was reloaded, sharing stopped): nobody hears its parts, and
      // without sharing its sound is the original, so stop it (LS1-8).
      if (s.playing && performance.now() - this.lastOrphanPause > 1000) { this.lastOrphanPause = performance.now(); this.deck.pause(); }
      this.emit();
      return;
    }
    live.noteDeck(s.pos, s.playing);
    const at = live.ctx.currentTime;
    this.marks.push({ at, posMs: s.pos, playing: s.playing });
    if (this.marks.length > KEEP_MARKS) this.marks.splice(0, this.marks.length - KEEP_MARKS);
    const g = this.gate;
    // The Deck is at the seek target: audio captured from now on is the new position.
    if (g && g.captureFrom === null && s.playing && at > g.since + 0.15 && Math.abs(s.pos - g.targetMs) < 1500) g.captureFrom = at + 0.05;
    // The Deck stopped by itself (the track ended, or someone paused it in its window).
    if (this.playingS && !g && this.loopS?.state !== "memory") this.deckStoppedAt = s.playing ? null : this.deckStoppedAt ?? at;
  }

  private onRegion(r: Region) {
    const live = this.live;
    if (!live) return;
    const rate = live.rate;
    const cs = r.captureStart, ce = cs + r.length / rate;
    const g = this.gate;
    if (g) {
      if (g.captureFrom === null) return;
      const offsetS = runOffset(this.marks, g.captureFrom);
      const t = gateResume({ cs, ce, captureFrom: g.captureFrom, offsetS, fromMs: g.fromMs, delayS: live.delayS });
      if (t === null || offsetS === null) return;
      this.run = { captureFrom: g.captureFrom, offsetS };
      // While recent parts still play, the live parts take over where they end (a jump of a few
      // hundred ms at most if the Deck was quicker than usual).
      const at = this.mem ? Math.max(t, this.mem.endAt) : t;
      this.unmuteAt = at;
      this.gate = null;
      this.setLive(true, at);
      const l = this.loopS;
      l?.buf?.reset(); // a loop fills from one run only, so its joins line up
      // A loop at the track's start has no pre-roll: what comes before the run's first sample is
      // the first moment of the track (≤ 1 s), taken as silence so the loop can complete.
      if (l?.buf && l.startMs < PRE_ROLL_MS && g.fromMs === l.startMs) {
        const firstMs = (Math.max(cs, g.captureFrom) + offsetS) * 1000;
        if (firstMs > l.startMs && firstMs - l.startMs <= PRE_ROLL_MS) l.buf.fillSilence(((firstMs - l.startMs) / 1000) * rate);
      }
    }
    const run = this.run;
    if (!run) return;
    const skip = Math.max(0, Math.round((run.captureFrom - cs) * rate));
    const startSec = cs + run.offsetS; // track time of the region's first sample

    // Recent parts (LS1-4): as played, crossfades and all, at their track position.
    if (this.recent && skip < r.length) this.recent.add(Math.round((startSec + skip / rate) * rate), r.parts.map((a) => faded(a.subarray(skip), Math.min(r.fade, r.length - skip))));

    // Chords: bass + other, read into chroma and dropped.
    if (skip < r.length) {
      const n = r.length - skip, mono = new Float32Array(n);
      for (let i = 0; i < n; i++) mono[i] = (r.parts[2][skip + i] + r.parts[3][skip + i] + r.parts[4][skip + i] + r.parts[5][skip + i]) / 4;
      const changed = this.chordCells.add(mono, rate, startSec + skip / rate);
      if (changed.length) this.o.onChords?.([...this.chordCells.cells], changed);
      // What each separated part plays, per bar (LS1-N1): a few numbers, the audio dropped.
      if (this.barLevels.add(r.parts, skip, r.length - skip, startSec + skip / rate, rate, run.captureFrom).length) this.o.onLevels?.(this.levels());
    }

    const l = this.loopS;
    if (l?.state === "filling" && l.buf) {
      l.buf.write(r.parts, Math.round((startSec - l.startMs / 1000) * rate), skip, r.fade);
      if (l.buf.complete) this.toMemory(l, run);
    }
  }

  /** The loop is all in memory: from its end on, replay it from there and let the Deck rest. */
  private toMemory(l: Loop, run: Run) {
    const live = this.live!;
    const ctx = live.ctx;
    const chans = l.buf!.build();
    l.buf!.drop();
    l.buf = null;
    l.audio = [0, 1, 2, 3].map((p) => {
      const b = ctx.createBuffer(2, chans[0].length, live.rate);
      b.copyToChannel(chans[p * 2], 0);
      b.copyToChannel(chans[p * 2 + 1], 1);
      chans[p * 2].fill(0); chans[p * 2 + 1].fill(0);
      return b;
    });
    l.state = "memory";
    const T = playTimeOf(l.endMs, run.offsetS, live.delayS);
    const when = Math.max(T, ctx.currentTime + 0.02);
    this.setLive(false, when, true);
    this.startLoopSources(loopPositionMs(l.startMs, l.endMs, T, when), when);
    this.run = null;
    this.unmuteAt = null;
    this.deck.pause();
    this.emit(true);
  }

  private startLoopSources(posMs: number, when?: number) {
    const live = this.live, l = this.loopS;
    if (!live || !l?.audio) return;
    this.stopLoopSources();
    const ctx = live.ctx;
    const t = when ?? ctx.currentTime + 0.02;
    const lenS = (l.endMs - l.startMs) / 1000;
    const offset = Math.max(0, Math.min(lenS - 1e-3, (posMs - l.startMs) / 1000));
    l.sources = l.audio.map((b, p) => {
      const s = ctx.createBufferSource();
      s.buffer = b;
      s.loop = true;
      s.loopStart = 0;
      s.loopEnd = b.duration;
      s.connect(live.gains[p]);
      s.start(t, offset);
      return s;
    });
    l.t0 = t - offset;
    this.startMine(t);
  }

  private stopLoopSources() {
    const l = this.loopS;
    if (!l) return;
    for (const s of l.sources) { try { s.stop(); } catch { /* not started */ } s.disconnect(); }
    l.sources = [];
    this.stopMine();
  }

  /**
   * Plays from recent parts at `ms` at once, for CATCH_S seconds, while the Deck seeks to where
   * they end and the live parts take over there (LS1-4). False when they don't hold `ms`.
   */
  private startRecent(ms: number): boolean {
    const live = this.live, recent = this.recent;
    if (!live || !recent) return false;
    const rate = live.rate, from = Math.round((ms / 1000) * rate);
    const until = recent.coveredUntil(from);
    if (until === null) return false;
    const endMs = Math.min((until / rate) * 1000 - 20, ms + CATCH_S * 1000);
    // Only when memory covers the whole catch-up (LS1-N3): a short stretch of memory, then silence
    // while the Deck catches up, then the parts again, is worse than one clean wait.
    if (endMs - ms < CATCH_S * 1000 - 50) return false;
    const chans = recent.build(from, Math.round((endMs / 1000) * rate));
    if (!chans) return false;
    this.stopRecent();
    const ctx = live.ctx, when = ctx.currentTime + 0.03;
    const sources = [0, 1, 2, 3].map((p) => {
      const b = ctx.createBuffer(2, chans[0].length, rate);
      b.copyToChannel(chans[p * 2], 0);
      b.copyToChannel(chans[p * 2 + 1], 1);
      const src = ctx.createBufferSource();
      src.buffer = b;
      src.connect(live.gains[p]);
      src.onended = () => src.disconnect();
      src.start(when);
      return src;
    });
    chans.forEach((a) => a.fill(0));
    this.mem = { t0: when, startMs: ms, endMs, endAt: when + (endMs - ms) / 1000, sources };
    this.seekLive(endMs, true);
    return true;
  }

  private stopRecent() {
    if (!this.mem) return;
    for (const src of this.mem.sources) { try { src.stop(); } catch { /* not started */ } src.disconnect(); }
    this.mem = null;
  }

  /** Ends the loop and zeroes its audio (L161). */
  private dropLoop() {
    const l = this.loopS;
    if (!l) return;
    this.stopLoopSources();
    this.mine = null; // Mine belongs to this loop's reading
    l.buf?.drop();
    l.audio?.forEach((b) => { for (let c = 0; c < b.numberOfChannels; c++) b.getChannelData(c).fill(0); });
    l.audio = null;
    l.buf = null;
    this.loopS = null;
  }

  private onLiveEnded() {
    // Resume where you were (LS1-3), not where the Deck had got to.
    if (this.live && this.phase === "ready") this.pausedMs = this.heardMs();
    this.deckClosed = this.phase === "ready";
    this.stopRecent();
    this.recent?.clear();
    this.recent = null;
    this.analysers = [];
    this.dropLoop();
    this.live = null;
    this.gate = null;
    this.run = null;
    this.playingS = false;
    this.phase = "stopped";
    this.emit(true);
  }

  private poll() {
    const live = this.live;
    if (live && this.playingS) {
      const now = live.ctx.currentTime;
      const l = this.loopS, run = this.run;
      // A pass reached the loop's end without all of it: go back to its start and fill it in one
      // run. A nearly full pass first waits up to 1.5 s for its last regions (separation running
      // late on a busy Mac used to re-seek every lap, so the loop never got into memory).
      if (l?.state === "filling" && l.buf && run && !this.gate && now >= playTimeOf(l.endMs, run.offsetS, live.delayS) - 0.02) {
        const nearly = l.buf.progress >= 0.95;
        if (nearly && l.graceAt === undefined) l.graceAt = now;
        if (!nearly || now - (l.graceAt ?? now) > 1.5) { l.laps++; l.graceAt = undefined; this.seekLive(l.startMs); }
      }
      // The Deck stopped by itself and what it played has been heard.
      if (this.deckStoppedAt !== null && now - this.deckStoppedAt > live.delayS + 0.3) {
        this.pausedMs = this.heardMs();
        this.playingS = false;
        this.deckStoppedAt = null;
        this.run = null;
        this.setLive(false);
        this.emit(true);
      }
      const c = this.catching;
      if (this.wasCatching && !c) this.o.onCaughtUp?.();
      this.wasCatching = c;
    }
    this.emit();
  }

  /** Calls onChange when something discrete changed (or always, with force). */
  private emit(force = false) {
    if (!this.o.onChange) return;
    const s = this.state;
    const key = JSON.stringify([s.deckOpen, s.phase, s.playing, s.catching, s.catchLeftS, s.loop?.state, s.loop?.startMs, Math.round((s.loop?.filled ?? 0) * 20), s.loop?.etaS, s.loop?.laps, s.error, s.model?.ready]);
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    this.o.onChange(s);
  }
}
