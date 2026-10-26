"use client";

// L178 check: the orders one click can try. Each button logs to window.__shareTest: whether the
// popup opened, the click's user activation before and after each call, and how getDisplayMedia
// ended (resolved with which tab, rejected with which error, or still pending = Chrome's picker open).
import { useState } from "react";
import { deckUrl } from "@/lib/lab/deck-protocol";

type Result = Record<string, unknown>;
declare global { interface Window { __shareTest?: Result[] } }

const OPTS = {
  video: true,
  audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, suppressLocalAudioPlayback: true } as MediaTrackConstraints,
  ...({ preferCurrentTab: false, selfBrowserSurface: "exclude", surfaceSwitching: "exclude", systemAudio: "exclude", monitorTypeSurfaces: "exclude" } as object),
};

export function ShareTest({ url }: { url: string }) {
  const [log, setLog] = useState<string[]>([]);
  const deck = deckUrl(url, "/dev/lab-spike/deck");

  const run = async (order: "open-then-share" | "share-then-open" | "blank-share-navigate" | "share-only" | "open-wait-share") => {
    const r: Result = { order, t0: performance.now(), visible: document.visibilityState };
    const act = () => navigator.userActivation?.isActive ?? null;
    r.activeAtClick = act();
    let w: Window | null = null;
    let p: Promise<MediaStream> | null = null;
    const share = () => { try { p = navigator.mediaDevices.getDisplayMedia(OPTS); } catch (e) { r.gdmThrew = String(e); } r.activeAfterShare = act(); };
    if (order === "open-then-share") { w = window.open(deck, "sixam-deck", "width=520,height=240"); r.activeAfterOpen = act(); share(); }
    else if (order === "share-then-open") { share(); w = window.open(deck, "sixam-deck", "width=520,height=240"); r.activeAfterOpen = act(); }
    else if (order === "blank-share-navigate") { w = window.open("about:blank", "sixam-deck", "width=520,height=240"); r.activeAfterOpen = act(); share(); if (w) w.location.href = deck; }
    else if (order === "open-wait-share") {
      w = window.open(deck, "sixam-deck", "width=520,height=240");
      r.activeAfterOpen = act();
      // Wait for the Deck's first report (it is loaded and titled), at most 5 s.
      r.waitMs = await new Promise<number>((res) => {
        const t0 = performance.now(), ch = new BroadcastChannel("sixam-deck");
        const end = () => { ch.close(); res(Math.round(performance.now() - t0)); };
        ch.onmessage = (e) => { if (e.data?.kind === "state") end(); };
        setTimeout(end, 5000);
      });
      r.activeBeforeShare = act();
      share();
    }
    else share();
    r.popup = order === "share-only" ? "n/a" : w ? "opened" : "blocked";
    r.visibleAfter = document.visibilityState;
    r.gdm = "pending";
    const done = (x: Partial<Result>) => {
      Object.assign(r, x, { ms: Math.round(performance.now() - (r.t0 as number)) });
      setLog((l) => [...l, JSON.stringify(r)]);
    };
    window.__shareTest = [...(window.__shareTest ?? []), r];
    (p as Promise<MediaStream> | null)?.then(
      (s) => {
        const a = s.getAudioTracks()[0], v = s.getVideoTracks()[0];
        const set = (a?.getSettings() ?? {}) as MediaTrackSettings & { suppressLocalAudioPlayback?: boolean };
        done({ gdm: "resolved", videoLabel: v?.label, surface: (v?.getSettings() as { displaySurface?: string })?.displaySurface, audio: !!a, suppressed: set.suppressLocalAudioPlayback });
        s.getTracks().forEach((t) => t.stop());
      },
      (e: Error) => done({ gdm: "rejected", error: `${e.name}: ${e.message}` }),
    );
    setTimeout(() => { if (r.gdm === "pending") setLog((l) => [...l, JSON.stringify({ ...r, note: "still pending after 4 s: the picker is open" })]); }, 4000);
  };

  const btn: React.CSSProperties = { display: "block", margin: "8px 0", minHeight: 36, padding: "6px 14px" };
  return (
    <main style={{ padding: 24, fontFamily: "ui-monospace, monospace", fontSize: 13 }}>
      <h1 style={{ fontSize: 16 }}>Deck + share from one click (L178)</h1>
      <button id="a" style={btn} onClick={() => run("open-then-share")}>A · open the Deck, then share</button>
      <button id="b" style={btn} onClick={() => run("share-then-open")}>B · share, then open the Deck</button>
      <button id="c" style={btn} onClick={() => run("blank-share-navigate")}>C · open about:blank, share, then load the Deck</button>
      <button id="e" style={btn} onClick={() => run("open-wait-share")}>E · open the Deck, wait for it, then share</button>
      <button id="d" style={btn} onClick={() => run("share-only")}>D · share only (Deck already open)</button>
      <pre style={{ whiteSpace: "pre-wrap" }}>{log.join("\n")}</pre>
    </main>
  );
}
