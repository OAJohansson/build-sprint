"use client";
// 5 Bench: everything visible; the map on the left, a workbench for your sound on the right.
import { useState } from "react";
import { KNOBS, MENTOR_SHORT } from "./data";
import { Deck, Knob, Lanes, Shell, TrackHead, s, soloState } from "./shared";
import v from "./v.module.css";

export function V05Bench() {
  const [solo, setSolo] = useState(soloState());
  const [ab, setAb] = useState<"theirs" | "yours">("theirs");
  return (
    <Shell>
      <TrackHead><Deck /></TrackHead>
      <div className={v.b5}>
        <div className={v.b5map}>
          <Lanes state={solo} onSolo={(id) => setSolo(soloState(id))} laneH={132} />
          <p className={v.b5note}><span className={s.who}>Mentor</span> {MENTOR_SHORT}</p>
        </div>
        <aside className={v.b5bench}>
          <span className={s.who}>Bench · a bass like this one</span>
          <div className={v.seg}>
            <button aria-pressed={ab === "theirs"} onClick={() => setAb("theirs")}>Theirs</button>
            <button aria-pressed={ab === "yours"} onClick={() => setAb("yours")}>Yours</button>
          </div>
          <div className={v.seg2}><button aria-pressed>Shape</button><button>Describe</button></div>
          <div className={v.knobs}>{KNOBS.map((k) => <Knob key={k.name} {...k} size={64} />)}</div>
          <p className={s.muted} style={{ margin: 0, fontSize: 12 }}>Set from the Mentor: dark tone, eighth-note length, fast pitch drop. In A, at 124 BPM.</p>
          <div className={v.b5save}>
            <input className={v.input} defaultValue="rubber sub" aria-label="Name" />
            <button className={s.gold}>Save</button>
          </div>
        </aside>
      </div>
    </Shell>
  );
}
