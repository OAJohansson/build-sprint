// SoundCloud Widget API adapter (F2): load, play, pause, seek, current sound, events, and the full
// track list of a playlist (US1). https://developers.soundcloud.com/docs/api/html5-widget

export type ScSound = {
  id?: number;
  kind?: string;
  title?: string;
  permalink_url?: string;
  user?: { username?: string };
  /** "ALLOW" | "MONETIZE" | "SNIP" (30 s preview) | "BLOCK" (geo-blocked) */
  policy?: string;
  /** For SNIP this is the preview length (30000); getDuration() returns the full length instead. */
  duration?: number;
  full_duration?: number;
  genre?: string | null;
  tag_list?: string | null;
  playable?: boolean;
};
type ScWidget = {
  bind(ev: string, cb: (e?: { currentPosition?: number }) => void): void;
  unbind(ev: string): void;
  load(url: string, opts: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  seekTo(ms: number): void;
  skip(index: number): void;
  setVolume(v: number): void;
  getVolume(cb: (v: number) => void): void;
  getCurrentSound(cb: (s: ScSound | null) => void): void;
  getSounds(cb: (s: ScSound[] | null) => void): void;
  getPosition(cb: (ms: number) => void): void;
  getDuration(cb: (ms: number) => void): void;
  isPaused(cb: (p: boolean) => void): void;
};
type ScApi = { Widget: ((el: HTMLIFrameElement) => ScWidget) & { Events: Record<string, string> } };
declare global {
  interface Window { SC?: ScApi }
}

let apiPromise: Promise<ScApi> | null = null;
export function loadWidgetApi(): Promise<ScApi> {
  if (typeof window !== "undefined" && window.SC) return Promise.resolve(window.SC);
  apiPromise ??= new Promise<ScApi>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.onload = () => (window.SC ? resolve(window.SC) : reject(new Error("SoundCloud widget API missing")));
    s.onerror = () => { apiPromise = null; reject(new Error("Couldn't load the SoundCloud widget API")); };
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function widgetSrc(url: string) {
  return "https://w.soundcloud.com/player/?url=" + encodeURIComponent(url) + "&auto_play=false&visual=false&show_comments=false&hide_related=true";
}

const ask = <T,>(fn: (cb: (v: T) => void) => void, timeoutMs = 5000) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("SoundCloud player didn't answer")), timeoutMs);
    fn((v) => { clearTimeout(t); resolve(v); });
  });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class LoadError extends Error {
  constructor(public reason: "geo-blocked" | "unavailable", message: string) {
    super(message);
  }
}

/**
 * One embedded player. Tracks playing state and position from widget events, so capture code can
 * count audio only while it really plays (`playing`) and know where the playhead is (`positionMs`).
 */
export class Player {
  playing = false;
  positionMs = 0;
  private finishListeners = new Set<() => void>();
  private errored = false;

  private constructor(private w: ScWidget) {}

  /** Wraps an iframe whose src is widgetSrc(...); resolves once the widget is READY. */
  static async attach(iframe: HTMLIFrameElement, timeoutMs = 15000): Promise<Player> {
    const SC = await loadWidgetApi();
    const w = SC.Widget(iframe);
    const p = new Player(w);
    const E = SC.Widget.Events;
    w.bind(E.PLAY, () => { p.playing = true; });
    w.bind(E.PAUSE, () => { p.playing = false; });
    w.bind(E.FINISH, () => { p.playing = false; p.finishListeners.forEach((f) => f()); });
    w.bind(E.PLAY_PROGRESS, (e) => { if (typeof e?.currentPosition === "number") p.positionMs = e.currentPosition; });
    w.bind(E.SEEK, (e) => { if (typeof e?.currentPosition === "number") p.positionMs = e.currentPosition; });
    w.bind(E.ERROR, () => { p.errored = true; });
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new LoadError("unavailable", "The SoundCloud player didn't load.")), timeoutMs);
      w.bind(E.READY, () => { clearTimeout(t); resolve(); });
    });
    return p;
  }

  onFinish(fn: () => void) {
    this.finishListeners.add(fn);
    return () => this.finishListeners.delete(fn);
  }

  /** Load a track or set into the same widget. Null sound or a widget ERROR → unavailable; policy BLOCK → geo-blocked. */
  async load(url: string, timeoutMs = 15000): Promise<ScSound> {
    this.errored = false;
    this.playing = false;
    this.positionMs = 0;
    await new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new LoadError("unavailable", "The track didn't load in time.")), timeoutMs);
      this.w.load(url, { auto_play: false, visual: false, show_comments: false, hide_related: true, callback: () => { clearTimeout(t); resolve(); } });
    });
    const sound = await this.currentSound();
    if (!sound || this.errored) throw new LoadError("unavailable", "SoundCloud says this track isn't available (private, removed or a bad link).");
    if (sound.policy === "BLOCK") throw new LoadError("geo-blocked", "This track isn't available in your country.");
    return sound;
  }

  currentSound() {
    return ask<ScSound | null>((cb) => this.w.getCurrentSound(cb));
  }
  sounds() {
    return ask<ScSound[] | null>((cb) => this.w.getSounds(cb)).then((s) => s ?? []);
  }
  /** Full length in ms (for a SNIP preview this is the full track; use sound.duration for what plays). */
  duration() {
    return ask<number>((cb) => this.w.getDuration(cb));
  }
  position() {
    return ask<number>((cb) => this.w.getPosition(cb));
  }
  isPaused() {
    return ask<boolean>((cb) => this.w.isPaused(cb));
  }
  play() { this.w.play(); }
  pause() { this.w.pause(); }
  setVolume(v: number) { this.w.setVolume(v); }
  volume() { return ask<number>((cb) => this.w.getVolume(cb)); }

  /**
   * Seek to `ms` and play; resolves once the widget reports playing near the target, so the
   * caller can start counting audio. Retries the seek once (the widget sometimes ignores a seek
   * sent before playback has started).
   */
  async seekAndPlay(ms: number, signal?: AbortSignal, timeoutMs = 12000) {
    const near = () => this.playing && Math.abs(this.positionMs - ms) < 2500;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (!this.playing) this.play();
      this.w.seekTo(ms);
      const started = performance.now();
      while (performance.now() - started < timeoutMs / 2) {
        if (signal?.aborted) throw new DOMException("aborted", "AbortError");
        await sleep(100);
        if (near()) return;
        // Refresh the position in case PLAY_PROGRESS events are throttled.
        this.positionMs = await this.position().catch(() => this.positionMs);
        if (this.playing === false) this.playing = !(await this.isPaused().catch(() => true));
      }
    }
    throw new LoadError("unavailable", "The player didn't start playing at the snippet.");
  }

  /**
   * Every track of the loaded set with full details. The widget only returns details for the
   * first ~20 tracks (later ones are stubs with id and policy, no title); skipping to a stub
   * makes the widget fetch it, after which getSounds() includes it. Volume is 0 and the player is
   * paused during the walk; about 1 s per stub. Returns the sounds (stubs left as is on timeout).
   */
  // shortcut: the skip-walk relies on undocumented widget behaviour (stubs past ~20, skip fills
  // them) and takes ~1 s per stub (~40 s for 56 tracks); if SoundCloud changes it, fall back to
  // oembedTitle for titles only, or the official API with a client id.
  async loadSetDetails(onProgress?: (done: number, of: number) => void, signal?: AbortSignal): Promise<ScSound[]> {
    let sounds = await this.sounds();
    const missing = sounds.map((s, i) => (s?.title ? -1 : i)).filter((i) => i >= 0);
    if (!missing.length) return sounds;
    const vol = await this.volume().catch(() => 100);
    this.setVolume(0);
    try {
      for (let n = 0; n < missing.length; n++) {
        if (signal?.aborted) break;
        const i = missing[n];
        this.w.skip(i);
        for (let k = 0; k < 40; k++) {
          await sleep(100);
          sounds = await this.sounds();
          if (sounds[i]?.title) break;
        }
        this.pause();
        onProgress?.(n + 1, missing.length);
      }
    } finally {
      this.pause();
      this.w.skip(0);
      await sleep(300);
      this.pause();
      this.setVolume(vol || 100);
    }
    return sounds;
  }
}

/** A queue entry from a set's sound: its permalink, or the API URL the widget also accepts. */
export function soundUrl(s: ScSound): string | null {
  if (s.permalink_url) return s.permalink_url.split("?")[0];
  return typeof s.id === "number" ? `https://api.soundcloud.com/tracks/${s.id}` : null;
}

/**
 * Title and uploader from SoundCloud's public oEmbed endpoint (no key, CORS open). Fallback for
 * stubs the skip-walk couldn't fill. Has no duration.
 */
export async function oembedTitle(trackUrl: string): Promise<{ title: string; uploader: string } | null> {
  try {
    const r = await fetch("https://soundcloud.com/oembed?format=json&url=" + encodeURIComponent(trackUrl));
    if (!r.ok) return null;
    const j = (await r.json()) as { title?: string; author_name?: string };
    const uploader = j.author_name ?? "";
    let title = j.title ?? "";
    if (uploader && title.endsWith(` by ${uploader}`)) title = title.slice(0, -(` by ${uploader}`).length);
    return title ? { title, uploader } : null;
  } catch {
    return null;
  }
}
