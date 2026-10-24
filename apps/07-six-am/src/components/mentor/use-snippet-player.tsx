"use client";

// A few seconds of a track through the official SoundCloud player (setup previews, taste
// sessions). Its own hidden widget, so the Ears queue's player is never touched. Nothing is
// captured or recorded: it only plays, like pressing play on SoundCloud.
import { useCallback, useEffect, useRef, useState } from "react";
import { Player, widgetSrc } from "@/lib/ears/widget";

export type SnippetState = { url: string | null; status: "idle" | "loading" | "playing"; error: string | null };

export function useSnippetPlayer(seconds = 10) {
  const [src, setSrc] = useState<string | null>(null);
  const [state, setState] = useState<SnippetState>({ url: null, status: "idle", error: null });
  const player = useRef<Player | null>(null);
  const waiting = useRef<((p: Player | null) => void)[]>([]);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = useRef(0);

  const onIframe = useCallback((el: HTMLIFrameElement | null) => {
    if (!el) return;
    Player.attach(el).then(
      (p) => { player.current = p; waiting.current.splice(0).forEach((w) => w(p)); },
      () => { waiting.current.splice(0).forEach((w) => w(null)); },
    );
  }, []);

  const stop = useCallback(() => {
    run.current += 1;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    try { player.current?.pause(); } catch { /* the widget's iframe is gone */ }
    setState((s) => ({ ...s, url: null, status: "idle" }));
  }, []);
  // On unmount the iframe may already be gone: pausing it then throws inside the widget API, so
  // only the timer is cleared (callers stop() before closing).
  useEffect(() => () => { run.current += 1; if (stopTimer.current) clearTimeout(stopTimer.current); player.current = null; }, []);

  const play = useCallback(async (url: string) => {
    const me = ++run.current;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    setState({ url, status: "loading", error: null });
    try {
      let p = player.current;
      let first = false;
      if (!p) {
        first = true;
        p = await new Promise<Player | null>((resolve) => { waiting.current.push(resolve); setSrc((s) => s ?? url); });
        if (!p) throw new Error("The SoundCloud player didn't load.");
      }
      p.pause();
      const sound = first ? await p.currentSound() : await p.load(url);
      if (me !== run.current) return;
      // A 30 s preview starts near its beginning; a full track in the middle.
      const full = sound?.policy === "SNIP" ? sound.duration ?? 30000 : await p.duration().catch(() => sound?.full_duration ?? sound?.duration ?? 0);
      const at = sound?.policy === "SNIP" ? 5000 : Math.max(0, Math.round(full * 0.45));
      p.setVolume(100);
      await p.seekAndPlay(at);
      if (me !== run.current) { p.pause(); return; }
      setState({ url, status: "playing", error: null });
      stopTimer.current = setTimeout(() => { if (me === run.current) stop(); }, seconds * 1000);
    } catch (e) {
      if (me !== run.current) return;
      player.current?.pause();
      setState({ url: null, status: "idle", error: e instanceof Error ? e.message : "That track didn't play." });
    }
  }, [seconds, stop]);

  const frame = src ? (
    <iframe
      ref={onIframe}
      title="SoundCloud player for previews"
      aria-hidden="true"
      tabIndex={-1}
      allow="autoplay"
      src={widgetSrc(src)}
      style={{ position: "fixed", left: -9999, top: 0, width: 300, height: 20, border: 0, opacity: 0, pointerEvents: "none" }}
    />
  ) : null;

  return { state, play, stop, frame };
}
