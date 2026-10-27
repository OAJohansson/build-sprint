"use client";
// 9 Subtitles: the map fills the screen; the Mentor speaks in a subtitle line along the bottom.
import { useState } from "react";
import { MENTOR_SHORT } from "./data";
import { Deck, Lanes, Shell, TrackHead, s, soloState } from "./shared";
import v from "./v.module.css";

export function V09Subtitles() {
  const [solo, setSolo] = useState(soloState());
  return (
    <Shell>
      <TrackHead />
      <Lanes state={solo} onSolo={(id) => setSolo(soloState(id))} laneH={140} />
      <div className={v.u9dock}>
        <Deck look="block" />
        <p className={v.u9sub}>{MENTOR_SHORT}</p>
        <button className={s.gold}>Make one like it</button>
      </div>
    </Shell>
  );
}
