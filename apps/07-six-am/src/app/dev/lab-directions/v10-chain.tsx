"use client";
// 10 Chain (sounds wrong): a pedalboard. The signal runs left to right, from the Deck to your library.
import { KNOBS, MENTOR_SHORT } from "./data";
import { Deck, Knob, Shell, Strip, TrackHead, part, s } from "./shared";
import v from "./v.module.css";

export function V10Chain() {
  return (
    <Shell>
      <TrackHead small />
      <div className={v.x10strip}><Strip part={part("bass")} /></div>
      <div className={v.x10chain}>
        <div className={v.x10box}><span className={s.who}>1 · Deck</span><Deck look="block" /></div>
        <i className={v.x10wire} />
        <div className={v.x10box} style={{ borderColor: part("bass").color }}>
          <span className={s.who}>2 · Part</span>
          <div className={v.x10parts}>{["Drums", "Bass", "Other", "Vocals"].map((x) => <button key={x} aria-pressed={x === "Bass"}>{x}</button>)}</div>
          <small className={s.muted}>Bass alone, 5 s behind</small>
        </div>
        <i className={v.x10wire} />
        <div className={v.x10box}><span className={s.who}>3 · Mentor</span><p className={v.x10text}>{MENTOR_SHORT}</p></div>
        <i className={v.x10wire} />
        <div className={v.x10box}><span className={s.who}>4 · Yours</span><div className={v.knobs}>{KNOBS.map((k) => <Knob key={k.name} {...k} size={48} />)}</div></div>
        <i className={v.x10wire} />
        <div className={v.x10box}><span className={s.who}>5 · Keep</span><input className={v.input} defaultValue="rubber sub" aria-label="Name" /><button className={s.gold}>Save</button></div>
      </div>
    </Shell>
  );
}
