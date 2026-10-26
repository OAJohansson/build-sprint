"use client";

// The Deck window's page: the SoundCloud player, driven by the Lab over the Deck protocol
// (play / pause / seek in, position out, src/lib/lab/deck-protocol.ts). It plays; the Lab, which
// captures this tab, is where you hear the parts. Nothing is recorded or kept here.
import { useEffect, useRef, useState } from "react";
import { serveDeck } from "@/lib/lab/deck-protocol";
import { Player, widgetSrc } from "@/lib/ears/widget";

const box: React.CSSProperties = { margin: 0, padding: 14, minHeight: "100dvh", boxSizing: "border-box", background: "#131110", color: "#aa9c88", fontFamily: "var(--f-mono), ui-monospace, monospace", fontSize: 12, lineHeight: 1.6 };

export function Deck({ url }: { url: string }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [status, setStatus] = useState("Loading the player…");

  useEffect(() => {
    if (!url || !frame.current) return;
    let stop = () => {};
    let on = true;
    Player.attach(frame.current).then(async (p) => {
      if (!on) return;
      const title = (await p.currentSound().catch(() => null))?.title ?? "";
      const durationMs = await p.duration().catch(() => 0);
      setStatus(title || "Ready");
      stop = serveDeck({
        url,
        read: async () => ({ pos: await p.position(), playing: p.playing, title, durationMs }),
        onCmd: (c) => {
          if (c.cmd === "play") p.play();
          else if (c.cmd === "pause") p.pause();
          else p.seekAndPlay(c.ms).catch(() => {});
        },
      });
    }).catch((e) => setStatus(String(e?.message ?? e)));
    return () => { on = false; stop(); };
  }, [url]);

  if (!url) return <main style={box}>This window plays a track for the Lab. Open a track in Analyse, then press Play there.</main>;
  return (
    <main style={box}>
      <p style={{ margin: "0 0 10px" }}><span style={{ color: "#f1e6d3" }}>Six AM Deck</span> · {status}<br />Keep this window open: it plays the song for the Lab, where you hear the parts.</p>
      <iframe ref={frame} title="SoundCloud player" src={widgetSrc(url)} width="100%" height="120" allow="autoplay" style={{ border: 0 }} />
    </main>
  );
}
