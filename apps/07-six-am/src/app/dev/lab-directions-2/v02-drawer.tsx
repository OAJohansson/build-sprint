"use client";
// 2 Drawer (seed 2): the map keeps the whole width. One drawer at the bottom holds one job at a
// time (Ask, Make, Library); shown open on Make with the Mentor's last line in its edge.
import { useState } from "react";
import { MENTOR_SHORT } from "./data";
import { AB, Deck, Lanes, Macros, MatchRow, PresetHead, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

export function V02Drawer() {
  const [tab, setTab] = useState("make");
  return (
    <Shell>
      <TrackHead small><Transport compact /><Deck /></TrackHead>
      <Lanes laneH={76} />
      <section className={v.d2}>
        <div className={v.d2tabs}>
          {[["ask", "Ask the Mentor"], ["make", "Make a bass like this"], ["lib", "Library · 2"]].map(([id, label]) => (
            <button key={id} aria-current={tab === id ? "true" : undefined} onClick={() => setTab(id)}>{label}</button>
          ))}
          <span className={v.d2last}><span className={s.who}>Mentor</span> {MENTOR_SHORT}</span>
          <button className={s.textBtn}>Close ▾</button>
        </div>
        <div className={v.d2body}>
          <div className={v.col}><PresetHead /><AB /><MatchRow /></div>
          <div className={v.col}><Macros size={52} /><Suggest /></div>
          <div className={v.col}><span className={s.who}>Save</span><SaveRow stacked /></div>
        </div>
      </section>
    </Shell>
  );
}
