"use client";
// 4 Steps (seed 4): one step at a time, Listen → Understand → Make → Keep. Shown at step 2.
import { MENTOR } from "./data";
import { Deck, Lanes, Shell, TrackHead, s, soloState } from "./shared";
import v from "./v.module.css";

const STEPS = ["Listen", "Understand", "Make", "Keep"];

export function V04Steps() {
  const at = 1;
  return (
    <Shell>
      <TrackHead small><Deck /></TrackHead>
      <ol className={v.s4steps}>
        {STEPS.map((x, i) => <li key={x} data-at={i === at || undefined} data-done={i < at || undefined}><b>{i + 1}</b>{x}</li>)}
      </ol>
      <Lanes state={soloState()} laneH={46} compact />
      <div className={v.s4card}>
        <span className={s.who}>Understand the bass</span>
        <p className={v.s4text}>{MENTOR}</p>
        <div className={v.row}>
          <button className={s.ghost}>← Hear another part</button>
          <button className={s.gold}>Next: make one like it →</button>
        </div>
      </div>
    </Shell>
  );
}
