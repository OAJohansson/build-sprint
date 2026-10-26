// The Lab's transport (L155, L161): drives the Deck over its protocol and the live separation, and
// adds what a player needs on top of LiveParts: play / pause / seek with a real "catching up…"
// (muted until new audio plays, timing.ts), section loops replayed seamlessly from memory
// (loop-buffer.ts), chord estimates per 8 bars (chords.ts) and the model's download progress.
// No UI. Rights (L143, L161): live regions play once and are dropped; a loop's parts live in memory
// only while the loop is on (max 16 bars) and are zeroed when it ends, the loop changes or the
// transport stops; chords are kept as names only. Nothing is stored, exported or uploaded.
import { ChordCells } from "./chords";
import { DeckRemote, type DeckState } from "./deck-protocol";
import { LiveParts, type LiveStats, type Region } from "./live";
import { LoopBuffer } from "./loop-buffer";
import { Separator } from "./separator-client";
import { gateResume, isCatching, loopPositionMs, msToSamples, playTimeOf, runOffset } from "./timing";

/** Seconds of the track played before a loop's start while it fills, so the Deck's seek settles. */
const PRE_ROLL_MS = 1000;
/** Samples past a loop's end kept for the wrap crossfade (10 ms). */
const TAIL_S = 0.01;
const POLL_MS = 50;
const KEEP_MARKS = 600; // 60 s of Deck reports

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

export type LoopState = { startMs: number; endMs: number; state: "filling" | "memory"; filled: number };

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
  private deckStoppedAt: number | null = null;
  private wasCatching = false;
  private lastKey = "";
  private timer: ReturnType<typeof setInterval>;
  private dlStart = 0;

  constructor(private o: TransportOptions) {
    this.chordCells = new ChordCells(o.bars, o.bpm, o.originSec, o.knownChords);
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
      if (!this.model.downloading) this.dlStart = performance.now();
      const el = (performance.now() - this.dlStart) / 1000;
      const speed = el > 0.5 && loaded > 0 ? loaded / el : 0;
      this.model = { ...this.model, loaded, total, downloading: true, etaS: speed && total ? Math.max(0, (total - loaded) / speed) : null };
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
    this.play();
  }

  // ── Transport ──────────────────────────────────────────────────────────────────────────────────

  get playing() { return this.playingS; }

  play() {
    if (!this.live) return;
    const l = this.loopS;
    if (l?.state === "memory") { this.startLoopSources(this.pausedMs); this.playingS = true; this.emit(true); return; }
    if (this.pausedMs >= this.o.durationMs - 1000) this.pausedMs = 0; // at the end: from the top
    this.seekLive(this.pausedMs);
  }

  pause() {
    if (!this.live || !this.playingS) return;
    this.pausedMs = this.heardMs();
    this.playingS = false;
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
    if (this.playingS) this.seekLive(ms);
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
    this.loopS = { ...range, state: "filling", buf: new LoopBuffer(len, Math.round(TAIL_S * rate)), audio: null, sources: [], t0: 0 };
    const inside = at >= range.startMs && at < range.endMs;
    if (this.playingS && this.run && inside && !wasMemory) { /* keep playing; fills from here, refills at the end */ }
    else if (this.playingS) this.seekLive(range.startMs);
    else this.pausedMs = range.startMs;
    this.emit(true);
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

  /** What you hear now, track ms. */
  heardMs(): number {
    const live = this.live;
    if (!live) return this.pausedMs;
    const now = live.ctx.currentTime;
    const l = this.loopS;
    if (!this.playingS) return this.pausedMs;
    if (l?.state === "memory") return loopPositionMs(l.startMs, l.endMs, l.t0, now);
    if (this.gate) return this.gate.fromMs;
    if (!this.run || (this.unmuteAt !== null && now < this.unmuteAt)) return this.pausedMs;
    return Math.min(this.o.durationMs, (now - live.delayS + this.run.offsetS) * 1000);
  }

  get catching() {
    if (!this.live || !this.playingS || this.loopS?.state === "memory") return false;
    return isCatching(!!this.gate, this.unmuteAt, this.live.ctx.currentTime);
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
      loop: l ? { startMs: l.startMs, endMs: l.endMs, state: l.state, filled: l.state === "memory" ? 1 : l.buf?.progress ?? 0 } : null,
      chords: [...this.chordCells.cells],
      stats: this.stats,
      error: this.error,
    };
  }

  /** Stops everything: sharing, the worker, the loop's memory, the Deck's playback. */
  dispose() {
    clearInterval(this.timer);
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
  private seekLive(ms: number) {
    const live = this.live;
    if (!live) return;
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
    const live = this.live;
    if (!live) { this.emit(); return; }
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
      this.unmuteAt = t;
      this.gate = null;
      this.setLive(true, t);
      this.loopS?.buf?.reset(); // a loop fills from one run only, so its joins line up
    }
    const run = this.run;
    if (!run) return;
    const skip = Math.max(0, Math.round((run.captureFrom - cs) * rate));
    const startSec = cs + run.offsetS; // track time of the region's first sample

    // Chords: bass + other, read into chroma and dropped.
    if (skip < r.length) {
      const n = r.length - skip, mono = new Float32Array(n);
      for (let i = 0; i < n; i++) mono[i] = (r.parts[2][skip + i] + r.parts[3][skip + i] + r.parts[4][skip + i] + r.parts[5][skip + i]) / 4;
      const changed = this.chordCells.add(mono, rate, startSec + skip / rate);
      if (changed.length) this.o.onChords?.([...this.chordCells.cells], changed);
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
  }

  private stopLoopSources() {
    const l = this.loopS;
    if (!l) return;
    for (const s of l.sources) { try { s.stop(); } catch { /* not started */ } s.disconnect(); }
    l.sources = [];
  }

  /** Ends the loop and zeroes its audio (L161). */
  private dropLoop() {
    const l = this.loopS;
    if (!l) return;
    this.stopLoopSources();
    l.buf?.drop();
    l.audio?.forEach((b) => { for (let c = 0; c < b.numberOfChannels; c++) b.getChannelData(c).fill(0); });
    l.audio = null;
    l.buf = null;
    this.loopS = null;
  }

  private onLiveEnded() {
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
      // shortcut: if separation runs late (regions arrive after their play time), the buffer may still be
      // filling at the loop's end and this re-seeks every lap; fine at 3–4× real time, add a
      // "wait for the last region" grace if a slower Mac shows it.
      // The first pass reached the loop's end without all of it (the loop began mid-way): go
      // back to its start and fill it in one run.
      if (l?.state === "filling" && run && !this.gate && now >= playTimeOf(l.endMs, run.offsetS, live.delayS) - 0.02) this.seekLive(l.startMs);
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
    const key = JSON.stringify([s.deckOpen, s.phase, s.playing, s.catching, s.loop?.state, s.loop?.startMs, Math.round((s.loop?.filled ?? 0) * 20), s.error, s.model?.ready]);
    if (!force && key === this.lastKey) return;
    this.lastKey = key;
    this.o.onChange(s);
  }
}
