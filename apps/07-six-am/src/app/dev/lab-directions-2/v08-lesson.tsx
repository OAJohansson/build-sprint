"use client";
// 8 Lesson: the conversation leads. A compact map stays pinned on top; the Mentor's answers come
// as a page you read down, and the synth and the save arrive inline as cards in the thread.
import { ASK, MEASURED, MENTOR } from "./data";
import { AB, Deck, Lanes, Macros, MatchRow, PresetHead, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

export function V08Lesson() {
  return (
    <Shell>
      <TrackHead small><Transport compact /><Deck /></TrackHead>
      <Lanes laneH={50} subs="solo" compact label={128} />
      <div className={v.l8}>
        <p className={s.you}>{ASK}</p>
        <p className={v.l8text}>{MENTOR}</p>
        <span className={s.tags}>{MEASURED.map((t) => <i key={t}>{t}</i>)}</span>
        <div className={v.l8card}>
          <div className={v.rowBetween}><PresetHead /><AB /></div>
          <Macros size={50} />
          <div className={v.rowBetween}><Suggest /><MatchRow /></div>
        </div>
        <div className={v.l8card}><SaveRow /></div>
        <input className={s.ask} placeholder="Ask about the bass, or say what to change…" aria-label="Ask the Mentor" />
      </div>
    </Shell>
  );
}
