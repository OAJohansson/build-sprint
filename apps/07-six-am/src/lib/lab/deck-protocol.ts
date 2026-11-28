// The Deck control protocol (L150): the Lab and the Deck window (which plays SoundCloud and is the
// tab the Lab captures) talk over one BroadcastChannel. The Lab sends play / pause / seek; the Deck
// reports its position every ~100 ms. Only commands and numbers cross it, never audio. Shared by
// the Deck page and the Lab (and the dev spike).

export const DECK_CHANNEL = "sixam-deck";
/** The Deck window's fixed title: Chrome's --auto-select-tab-capture-source-by-title matches it. */
export const DECK_TITLE = "Six AM Deck";
/** How often the Deck reports (ms). */
export const DECK_REPORT_MS = 100;
/** No report for this long → the Deck is treated as closed. */
export const DECK_GONE_MS = 2000;

/** `landed` (slice 4, W10): sent once, the moment a seek lands: the seek's target ms, and `pos` is
 *  the position the player reported right then. Numbers only. */
export type DeckState = { kind: "state"; url: string; title: string; pos: number; playing: boolean; durationMs: number; landed?: number };
export type DeckCmd =
  | { kind: "cmd"; cmd: "play" }
  | { kind: "cmd"; cmd: "pause" }
  /** Seek to `ms` and play (the Lab only seeks while playing; a paused Lab seeks on Play). */
  | { kind: "cmd"; cmd: "seek"; ms: number };
export type DeckMsg = DeckState | DeckCmd;

const isMsg = (m: unknown): m is DeckMsg =>
  !!m && typeof m === "object" && ((m as DeckMsg).kind === "state" || (m as DeckMsg).kind === "cmd");

/** The Deck's URL for a track, opened as a small window named "sixam-deck" (one Deck at a time). */
export const deckUrl = (trackUrl: string, path = "/deck") => `${path}?url=${encodeURIComponent(trackUrl)}`;

/** The Lab's side: send commands, hear the Deck's reports, know whether a Deck is open. */
export class DeckRemote {
  private ch: BroadcastChannel;
  private lastAt = -Infinity;
  last: DeckState | null = null;

  /** `url`: only reports from a Deck playing this track count (another track's Deck is ignored). */
  constructor(private url: string | null, onState: (s: DeckState) => void) {
    this.ch = new BroadcastChannel(DECK_CHANNEL);
    this.ch.onmessage = (e: MessageEvent<unknown>) => {
      const m = e.data;
      if (!isMsg(m) || m.kind !== "state") return;
      if (this.url && m.url && m.url !== this.url) return;
      this.last = m;
      this.lastAt = performance.now();
      onState(m);
    };
  }

  /** A Deck has reported recently. */
  get open() { return performance.now() - this.lastAt < DECK_GONE_MS; }

  play() { this.send({ kind: "cmd", cmd: "play" }); }
  pause() { this.send({ kind: "cmd", cmd: "pause" }); }
  seek(ms: number) { this.send({ kind: "cmd", cmd: "seek", ms: Math.max(0, Math.round(ms)) }); }

  /** Opens (or re-points) the Deck window. Call from a click. */
  openWindow(trackUrl: string, path = "/deck") {
    this.url = trackUrl;
    return window.open(deckUrl(trackUrl, path), "sixam-deck", "width=520,height=240");
  }

  close() { this.ch.close(); }
  private send(m: DeckCmd) { this.ch.postMessage(m); }
}

/** The Deck's side: report state on a timer, run commands. `read` returns the player's state. */
export function serveDeck(o: {
  url: string;
  read: () => Promise<{ pos: number; playing: boolean; title: string; durationMs: number }>;
  /** May return the position a seek landed at (ms); the Deck then reports it at once (W10). */
  onCmd: (c: DeckCmd) => void | Promise<number | void>;
}) {
  const ch = new BroadcastChannel(DECK_CHANNEL);
  ch.onmessage = (e: MessageEvent<unknown>) => {
    if (!isMsg(e.data) || e.data.kind !== "cmd") return;
    const c = e.data;
    const r = o.onCmd(c);
    if (c.cmd === "seek" && r instanceof Promise) {
      r.then(async (pos) => {
        if (typeof pos !== "number") return;
        const s = await o.read().catch(() => null);
        if (s) ch.postMessage({ kind: "state", url: o.url, ...s, pos, playing: true, landed: c.ms } satisfies DeckState);
      }, () => { /* the seek didn't land; the timer's reports go on */ });
    }
  };
  let busy = false;
  const t = setInterval(async () => {
    if (busy) return;
    busy = true;
    try {
      const s = await o.read();
      ch.postMessage({ kind: "state", url: o.url, ...s } satisfies DeckState);
    } catch { /* player not answering this tick */ }
    busy = false;
  }, DECK_REPORT_MS);
  return () => { clearInterval(t); ch.close(); };
}
