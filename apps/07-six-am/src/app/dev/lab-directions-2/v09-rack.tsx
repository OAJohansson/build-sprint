"use client";
// 9 Rack: the map on top; under it one row of equal modules, read left to right like a signal
// chain: Mentor → Original vs mine → Your synth → Save.
import { Deck, AB, Lanes, Macros, MatchRow, Mentor, PresetHead, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

export function V09Rack() {
  return (
    <Shell>
      <TrackHead small><Transport compact /><Deck /></TrackHead>
      <Lanes laneH={74} />
      <div className={v.k9}>
        <section className={v.k9mod}><Mentor short context={false} /></section>
        <section className={v.k9mod}><span className={s.who}>Compare</span><AB /><p className={s.muted} style={{ margin: 0, fontSize: 12 }}>Bass alone, Drop 1, looping. Same loudness both sides.</p><MatchRow /></section>
        <section className={`${v.k9mod} ${v.k9wide}`}><PresetHead /><Macros size={48} /><Suggest /></section>
        <section className={v.k9mod}><span className={s.who}>Keep it</span><SaveRow stacked /></section>
      </div>
    </Shell>
  );
}
