"use client";
// 5 Margin notes: the Mentor writes on the timeline. Its answers pin to the bar and part they're
// about, like comments on a score; ask at the playhead. Make sits as one strip under the map.
import { ASK, MENTOR_SHORT, pct } from "./data";
import { AB, Deck, Lanes, Macros, MatchRow, PresetHead, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

export function V05Margin() {
  return (
    <Shell>
      <TrackHead small><Transport compact /><Deck /></TrackHead>
      <div className={v.m5wrap}>
        <Lanes laneH={92} subs="solo" />
        <div className={v.m5layer} style={{ left: 148 }}>
          <span className={v.m5pin} style={{ left: pct(17), top: 186 }}>1</span>
          <span className={v.m5pin} style={{ left: pct(205), top: 186 }}>2</span>
          <div className={v.m5note} style={{ left: `calc(${pct(97)} + 14px)`, top: 150 }}>
            <span className={s.ctx}>Bass · bar 97 · you asked</span>
            <p className={s.you}>{ASK}</p>
            <p className={s.mentor}>{MENTOR_SHORT} I measure pitch, timing and loudness, not tone.</p>
            <input className={s.ask} placeholder="Reply, or ask about bar 97…" aria-label="Ask the Mentor" />
          </div>
        </div>
      </div>
      <section className={v.m5make}>
        <div className={v.col}><span className={s.who}>Make · a bass like this</span><PresetHead /><AB /></div>
        <Macros size={46} tight />
        <div className={v.col}><Suggest /><MatchRow /></div>
        <div className={v.col} style={{ minWidth: 300 }}><SaveRow stacked /></div>
      </section>
    </Shell>
  );
}
