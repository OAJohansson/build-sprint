"use client";

// Dev spike Deck: the SoundCloud player in its own window, speaking the Deck protocol
// (src/lib/lab/deck-protocol.ts) so the spike's transport can drive it.
import { useEffect, useRef, useState } from "react";
import { serveDeck } from "@/lib/lab/deck-protocol";
import { Player, widgetSrc } from "@/lib/ears/widget";

export function Deck({ url, auto }: { url: string; auto: boolean }) {
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
      if (auto) p.play();
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
  }, [url, auto]);

  if (!url) return <p style={{ padding: 16 }}>No track: open this from the Lab spike.</p>;
  return (
    <main style={{ padding: 12, fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#ccc", background: "#111", minHeight: "100vh" }}>
      <p style={{ margin: "0 0 8px" }}>Six AM Deck · {status} · share this tab when Chrome asks</p>
      <iframe ref={frame} title="SoundCloud player" src={widgetSrc(url)} width="100%" height="120" allow="autoplay" style={{ border: 0 }} />
    </main>
  );
}
