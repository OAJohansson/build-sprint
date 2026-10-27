"use client";
// 10 Command line (the one that sounds wrong): no panels at all. The map fills the screen and one
// bar at the bottom takes words: ask, solo, loop, make. Answers and the synth float above it and
// close again.
import { ASK, MENTOR_SHORT } from "./data";
import { AB, Deck, Lanes, Macros, MatchRow, PresetHead, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

export function V10Command() {
  return (
    <Shell>
      <TrackHead small><Transport /><Deck /></TrackHead>
      <Lanes laneH={150} />
      <div className={v.c10float}>
        <div className={v.c10card}>
          <span className={s.ctx}>Mentor · bass · bar 97</span>
          <p className={s.mentor}>{MENTOR_SHORT}</p>
        </div>
        <div className={v.c10card}>
          <div className={v.rowBetween}><PresetHead /><button className={s.textBtn}>×</button></div>
          <AB />
          <Macros size={40} tight />
          <Suggest />
          <MatchRow />
          <SaveRow stacked />
        </div>
      </div>
      <div className={v.c10bar}>
        <span className={v.c10prompt}>›</span>
        <input className={v.c10input} defaultValue={`make a bass like this`} aria-label="Ask or do" />
        <span className={s.faint}>last: “{ASK}”</span>
      </div>
    </Shell>
  );
}
