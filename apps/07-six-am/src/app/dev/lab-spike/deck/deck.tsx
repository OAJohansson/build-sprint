"use client";

import { useEffect, useRef, useState } from "react";
import { Player, widgetSrc } from "@/lib/ears/widget";

export type DeckMsg = { kind: "state"; pos: number; playing: boolean; title: string } | { kind: "cmd"; cmd: "play" | "pause" | "seek"; ms?: number };

export function Deck({ url, auto }: { url: string; auto: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Loading the player…");

  useEffect(() => {
    if (!url || !frame.current) return;
    const ch = new BroadcastChannel("sixam-deck");
    let player: Player | null = null;
    let title = "";
    let tick = 0;
    Player.attach(frame.current).then(async (p) => {
      player = p;
      title = (await p.currentSound().catch(() => null))?.title ?? "";
      setStatus(title || "Ready");
      if (auto) p.play();
      tick = window.setInterval(() => ch.postMessage({ kind: "state", pos: p.positionMs, playing: p.playing, title } satisfies DeckMsg), 250);
    }).catch((e) => setStatus(String(e?.message ?? e)));
    ch.onmessage = (e: MessageEvent<DeckMsg>) => {
      const m = e.data;
      if (m.kind !== "cmd" || !player) return;
      if (m.cmd === "play") player.play();
      else if (m.cmd === "pause") player.pause();
      else if (m.cmd === "seek" && typeof m.ms === "number") player.seekAndPlay(m.ms).catch(() => {});
    };
    return () => { clearInterval(tick); ch.close(); };
  }, [url, auto]);

  if (!url) return <p style={{ padding: 16 }}>No track: open this from the Lab spike.</p>;
  return (
    <main style={{ padding: 12, fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#ccc", background: "#111", minHeight: "100vh" }}>
      <p style={{ margin: "0 0 8px" }}>Six AM Deck · {status} · share this tab when Chrome asks</p>
      <iframe ref={frame} title="SoundCloud player" src={widgetSrc(url)} width="100%" height="120" allow="autoplay" style={{ border: 0 }} />
    </main>
  );
}
