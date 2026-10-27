"use client";
// 3 Tabs (seed 3): the four parts are the page's big tabs. One part fills the screen.
import { useState } from "react";
import { KNOBS, MENTOR_SHORT, NOW, PARTS, type PartId } from "./data";
import { Deck, Knob, Lanes, Shell, TrackHead, part, s, soloState } from "./shared";
import v from "./v.module.css";

export function V03Tabs() {
  const [on, setOn] = useState<PartId>("bass");
  return (
    <Shell>
      <TrackHead small><Deck /></TrackHead>
      <nav className={v.t3tabs}>
        {PARTS.map((p) => (
          <button key={p.id} onClick={() => setOn(p.id)} aria-current={on === p.id || undefined} style={{ borderColor: on === p.id ? p.color : "transparent" }}>{p.name}</button>
        ))}
        <span className={s.muted}>bar {NOW.bar} · {NOW.section}</span>
      </nav>
      <Lanes state={soloState(on)} only={[on]} laneH={210} label={0} sm={false} />
      <div className={v.t3below}>
        <blockquote className={v.t3quote}>“{MENTOR_SHORT}”<cite>Mentor, on the {part(on).name.toLowerCase()}</cite></blockquote>
        <div className={v.t3make}>
          <span className={s.who}>Make your own</span>
          <div className={v.knobs}>{KNOBS.map((k) => <Knob key={k.name} {...k} />)}</div>
          <button className={s.gold}>Save to my sounds</button>
        </div>
      </div>
    </Shell>
  );
}
