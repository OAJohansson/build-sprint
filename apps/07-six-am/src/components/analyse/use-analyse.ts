"use client";

// The live Analyse view's state: the pasted link and its tracks, the SoundCloud widget, tab
// listening, the lazily loaded model and the queue (engine in @/lib/ears). Only metadata and
// measurements are kept (localStorage); audio stays in memory for one snippet and is gone.
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { CaptureError, startTabCapture, type TabCapture } from "@/lib/ears/capture";
import { EarsClient } from "@/lib/ears/ears-client";
import { activeItem, type QueueState, type QueueTrack } from "@/lib/ears/queue";
import type { EarsAnalysis } from "@/lib/ears/results";
import { parseSoundCloudList } from "@/lib/ears/soundcloud-url";
import { useEarsQueue } from "@/lib/ears/use-ears-queue";
import { LoadError, oembedTitle, Player, soundUrl, type ScSound } from "@/lib/ears/widget";
import { useLocalStorage } from "@/lib/use-local-storage";
import { appendToSource, sanitiseSource, SOURCE_KEY, type Row, type Source, type SourceTrack } from "./rows";

export type Listening = "unknown" | "unsupported" | "off" | "on";
export type ModelState = { state: "idle" | "loading" | "downloading" | "ready" | "error"; fraction: number | null };
export type Busy = { text: string; fraction: number | null } | null;
/** One line of news; an error the user can fix has its action (Retry, Enable listening). */
export type Message = { tone: "error" | "info"; text: string; detail?: string; action?: { label: string; run(): void } } | null;

export type AnalyseModel = {
  demo: boolean;
  results: EarsAnalysis[];
  queue: QueueState;
  source: Source | null;
  listening: Listening;
  model: ModelState;
  busy: Busy;
  message: Message;
  dismiss(): void;
  embedUrl: string | null;
  onIframe(el: HTMLIFrameElement | null): void;
  load(text: string): void;
  enable(): void;
  stopListening(): void;
  analyse(rows: Row[]): void;
  cancel(): void;
  retry(id: string): void;
  /** Empty the list: pasted tracks, the queue and the stored results. */
  clearList(): void;
};

/** NF4: desktop Chrome/Chromium only. Firefox has getDisplayMedia but can't share a tab's audio; Safari can't either. */
function detectSupport(): boolean {
  if (!navigator.mediaDevices?.getDisplayMedia) return false;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[]; mobile?: boolean } }).userAgentData;
  if (brands?.brands?.length) return !brands.mobile && brands.brands.some((b) => /Chromium|Google Chrome/.test(b.brand));
  const ua = navigator.userAgent;
  return /Chrome\/\d+/.test(ua) && !/Firefox|FxiOS|Mobile/.test(ua);
}
const noSubscribe = () => () => {};
const useSupport = () => useSyncExternalStore(noSubscribe, () => (detectSupport() ? "yes" : "no"), () => "unknown");

const toTrack = (s: ScSound, fallbackUrl?: string): SourceTrack | null => {
  const url = soundUrl(s) ?? fallbackUrl;
  if (!url) return null;
  return { url, trackId: typeof s.id === "number" ? s.id : undefined, title: s.title, uploader: s.user?.username, durationMs: s.full_duration ?? s.duration, blocked: s.policy === "BLOCK", preview: s.policy === "SNIP" };
};

// shortcut: queue and results are shared by every tab through localStorage, and a tab that opens
// resets any "mid-analysis" item to queued; run Ears in one tab at a time (add a tab lock if needed).
export function useAnalyse(): AnalyseModel {
  const support = useSupport();
  const [rawSource, setSource] = useLocalStorage<Source | null>(SOURCE_KEY, null);
  const source = useMemo(() => sanitiseSource(rawSource), [rawSource]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [capture, setCapture] = useState<TabCapture | null>(null);
  const [ears, setEars] = useState<EarsClient | null>(null);
  const [model, setModel] = useState<ModelState>({ state: "idle", fraction: null });
  const [busy, setBusy] = useState<Busy>(null);
  const [message, setMessage] = useState<Message>(null);
  const q = useEarsQueue({ player: busy ? null : player, capture, ears });

  // The widget: mounted with the first link we have (the saved one after a reload), never re-pointed
  // by src (that would detach the Widget API); later links load through player.load().
  const firstUrl = source?.url ?? q.queue.items.find((i) => i.status !== "done")?.url ?? null;
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  if (!embedUrl && firstUrl) setEmbedUrl(firstUrl);
  const waiting = useRef<{ resolve: (p: Player) => void; reject: (e: Error) => void }[]>([]);
  const playerRef = useRef<Player | null>(null);
  const onIframe = useCallback((el: HTMLIFrameElement | null) => {
    if (!el) return;
    Player.attach(el).then(
      (p) => { playerRef.current = p; setPlayer(p); waiting.current.splice(0).forEach((w) => w.resolve(p)); },
      (e: Error) => { setMessage({ tone: "error", text: `The SoundCloud player didn't load: ${e.message}` }); waiting.current.splice(0).forEach((w) => w.reject(e)); },
    );
  }, []);
  const getPlayer = (url: string) =>
    playerRef.current
      ? Promise.resolve(playerRef.current)
      : new Promise<Player>((resolve, reject) => { waiting.current.push({ resolve, reject }); setEmbedUrl((u) => u ?? url); });

  // The model (18 MB) loads on first use (NF3), from the browser cache after the first time.
  const earsRef = useRef<EarsClient | null>(null);
  const ensureEars = (): void => {
    if (earsRef.current) return;
    const client = new EarsClient();
    earsRef.current = client;
    setModel({ state: "loading", fraction: null });
    // Progress events come only while the file downloads (not from the cache); without a
    // content-length the fraction is null and the bar stays empty but the size is still shown.
    let ready = false;
    client.onProgress = (f) => { if (!ready) setModel({ state: "downloading", fraction: f }); };
    // The worker already retried 3 times; a fresh worker on Retry starts the download again.
    client.onError = (m) => {
      setModel({ state: "error", fraction: null });
      setMessage({ tone: "error", text: "Couldn't get Six AM's ears ready", detail: m, action: { label: "Retry", run: retryModel } });
    };
    client.ready().then(() => { ready = true; setModel({ state: "ready", fraction: null }); setEars(client); });
  };
  const retryModel = () => {
    earsRef.current?.terminate();
    earsRef.current = null;
    setEars(null);
    setMessage(null);
    ensureEars();
  };
  useEffect(() => () => earsRef.current?.terminate(), []);
  useEffect(() => () => capture?.stop(), [capture]);

  // Errors from the runner that aren't a row's own state (rare: worker or player trouble).
  const lastError = q.lastError;
  const [seenError, setSeenError] = useState<string | null>(null);
  if (lastError && lastError !== seenError) {
    setSeenError(lastError);
    setMessage({ tone: "error", text: lastError });
  }

  const load = async (text: string) => {
    const { valid, invalid } = parseSoundCloudList(text);
    if (!valid.length) { setMessage({ tone: "error", text: invalid[0]?.message ?? "Paste a SoundCloud track or playlist link." }); return; }
    if (activeItem(q.queue)) { setMessage({ tone: "info", text: "A track is being analysed. Wait for it, or Cancel it, then load the link." }); return; }
    setMessage(null);
    setBusy({ text: "Loading the player…", fraction: null });
    const tracks: SourceTrack[] = [];
    const problems: string[] = invalid.map((i) => `${i.input}: ${i.message}`);
    try {
      const p = await getPlayer(valid[0].url);
      for (const link of valid) {
        if (link.kind === "set") {
          setBusy({ text: "Reading the playlist…", fraction: null });
          try {
            await p.load(link.url);
          } catch (e) {
            problems.push(e instanceof LoadError && e.reason === "geo-blocked" ? "That playlist isn't available in your country." : "That playlist didn't load: it may be private or removed, or the link is wrong.");
            continue;
          }
          const sounds = await p.loadSetDetails((done, of) => setBusy({ text: `Reading the playlist · ${done}/${of}`, fraction: done / of }));
          if (!sounds.length) { problems.push("That playlist is empty or private."); continue; }
          for (const s of sounds.filter((x) => !x.title)) {
            const url = soundUrl(s);
            const o = url ? await oembedTitle(url) : null;
            if (o) { s.title = o.title; s.user = { username: o.uploader }; }
          }
          for (const s of sounds) { const t = toTrack(s); if (t) tracks.push(t); }
        } else {
          setBusy({ text: "Loading the track…", fraction: null });
          try {
            const s = await p.load(link.url);
            const t = toTrack(s, link.url);
            if (t) tracks.push(t);
          } catch (e) {
            if (e instanceof LoadError && e.reason === "geo-blocked") {
              const o = await oembedTitle(link.url);
              tracks.push({ url: link.url, title: o?.title, uploader: o?.uploader, blocked: true });
            } else problems.push(e instanceof Error ? e.message : String(e));
          }
        }
      }
      // A pasted link adds to the list (owner, 23 Oct); repeats are skipped.
      let added = 0;
      if (tracks.length) {
        const r = appendToSource(source, tracks, valid[0].url, valid.length > 1 ? "list" : valid[0].kind === "set" ? "set" : "track");
        added = r.added;
        setSource(r.source);
      }
      const blocked = tracks.filter((t) => t.blocked).length;
      const repeats = tracks.length - added;
      if (problems.length) setMessage({ tone: "error", text: problems.join(" · ") });
      else if (source && tracks.length) setMessage({ tone: "info", text: `Added ${added} track${added === 1 ? "" : "s"}${repeats ? ` · ${repeats} already on the list` : ""}${blocked ? ` · ${blocked} not available in your region` : ""}` });
      else if (blocked) setMessage({ tone: "info", text: `${blocked} track${blocked > 1 ? "s aren't" : " isn't"} available in your region.` });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(null);
    }
  };

  const enable = async () => {
    if (support === "no") return;
    setMessage(null);
    if (q.queue.items.some((i) => i.status === "queued")) ensureEars();
    try {
      const c = await startTabCapture(() => {
        setCapture(null);
        setMessage({ tone: "info", text: "Listening stopped. Queued tracks wait.", action: { label: "Enable listening", run: () => void enable() } });
      });
      setCapture(c);
    } catch (e) {
      const text = e instanceof CaptureError
        ? e.reason === "cancelled" ? "Sharing was cancelled. Press Enable listening, pick this tab, keep “Also share tab audio” on, then Share."
          : e.message
        : String(e);
      setMessage({ tone: "error", text, action: { label: "Retry", run: () => void enable() } });
    }
  };

  const analyse = (rows: Row[]) => {
    const tracks: QueueTrack[] = rows
      .filter((r) => r.state !== "blocked")
      .map((r) => ({ url: r.url, title: r.title || undefined, uploader: r.uploader || undefined, durationMs: r.durationMs ?? undefined }));
    if (!tracks.length) return;
    ensureEars();
    q.add(tracks);
  };

  return {
    demo: false,
    results: q.results,
    queue: q.queue,
    source,
    listening: support === "unknown" ? "unknown" : support === "no" ? "unsupported" : capture ? "on" : "off",
    model,
    busy,
    message,
    dismiss: () => setMessage(null),
    embedUrl,
    onIframe,
    load: (t) => void load(t),
    enable: () => void enable(),
    stopListening: () => capture?.stop(),
    analyse,
    cancel: q.cancel,
    retry: (id) => { ensureEars(); q.retry(id); },
    clearList: () => { q.clear(); q.clearResults(); setSource(null); setMessage(null); },
  };
}
