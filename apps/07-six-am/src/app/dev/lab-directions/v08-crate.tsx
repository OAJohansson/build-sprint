"use client";
// 8 Crate: your sound library frames the screen; the map is what you're studying, the crate what you keep.
import { useState } from "react";
import { LIBRARY, MENTOR_SHORT, NOW } from "./data";
import { Deck, Lanes, Shell, TrackHead, s, soloState } from "./shared";
import v from "./v.module.css";

export function V08Crate() {
  const [solo, setSolo] = useState(soloState());
  return (
    <Shell>
      <div className={v.k8}>
        <aside className={v.k8crate}>
          <span className={s.who}>My sounds</span>
          <button className={v.k8new}>+ New bass, from this one<small>Mentor’s settings, ready to shape</small></button>
          {LIBRARY.map((x) => (
            <div key={x.name} className={v.k8item}>
              <button className={s.round} aria-label={`Play ${x.name}`}>▶</button>
              <div><b>{x.name}</b><small>{x.tags.join(" · ")} · {x.made}</small></div>
            </div>
          ))}
        </aside>
        <div className={v.k8main}>
          <TrackHead small><Deck /></TrackHead>
          <Lanes state={solo} onSolo={(id) => setSolo(soloState(id))} laneH={124} />
          <p className={v.k8note}><span className={s.who}>Mentor · bar {NOW.bar}</span><br />{MENTOR_SHORT}</p>
        </div>
      </div>
    </Shell>
  );
}
