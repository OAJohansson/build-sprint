"use client";
// 1 Map: the map as it is, with headphones on. Lane names solo a part; one Mentor line under it.
import { useState } from "react";
import { MENTOR, NOW } from "./data";
import { Deck, Lanes, Shell, TrackHead, part, s, soloState } from "./shared";
import v from "./v.module.css";

export function V01Map() {
  const [solo, setSolo] = useState(soloState());
  const on = Object.entries(solo).find(([, x]) => x === "solo")?.[0] as keyof typeof solo;
  return (
    <Shell>
      <TrackHead>
        <Deck />
        <button className={s.gold}>Make one like it</button>
      </TrackHead>
      <div className={v.info}>
        <span>Hearing <b style={{ color: part(on).color }}>{part(on).name}</b> alone · bar {NOW.bar} · {NOW.section}</span>
        <span className={s.muted}>Click a part to hear it alone · parts play 5 s after the Deck</span>
      </div>
      <Lanes state={solo} onSolo={(id) => setSolo(soloState(id))} laneH={118} />
      <section className={v.m1}>
        <span className={s.who}>Mentor</span>
        <p className={s.mentor}>{MENTOR}</p>
      </section>
    </Shell>
  );
}
