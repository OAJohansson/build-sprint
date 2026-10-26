"use client";
// 3 Two rooms (seed 3): a mode switch. Listen is the full map; Make (shown) shrinks the song to a
// strip and gives the page to the loop, your sound and the Mentor, side by side.
import { useState } from "react";
import { LOOP } from "./data";
import { AB, Deck, Macros, MatchRow, Mentor, PartChips, PresetHead, SaveRow, Shell, Strip, Suggest, TrackHead, Transport, Zoom, part, s } from "./shared";
import v from "./v.module.css";

export function V03Rooms() {
  const [mode, setMode] = useState("make");
  const bass = part("bass");
  return (
    <Shell>
      <TrackHead small>
        <div className={v.r3switch}>
          <button aria-pressed={mode === "listen"} onClick={() => setMode("listen")}>Listen</button>
          <button aria-pressed={mode === "make"} onClick={() => setMode("make")}>Make</button>
        </div>
        <Deck />
      </TrackHead>
      <div className={v.pad}><Strip /></div>
      <div className={v.pad}><Transport /></div>
      <div className={v.r3}>
        <section className={v.col}>
          <span className={s.who}>The original · {bass.name} alone · {LOOP.name}</span>
          <Zoom height={120} />
          <PartChips />
          <AB />
        </section>
        <section className={v.col}>
          <span className={s.who}>Yours</span>
          <PresetHead />
          <Macros size={60} />
          <Suggest />
          <MatchRow />
          <div className={v.foot}><SaveRow stacked /></div>
        </section>
        <section className={`${v.col} ${v.r3mentor}`}><Mentor /></section>
      </div>
    </Shell>
  );
}
