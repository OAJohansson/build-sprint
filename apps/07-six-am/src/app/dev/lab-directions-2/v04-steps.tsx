"use client";
// 4 Steps (seed 4): progressive. A numbered rail down the left (See, Listen, Ask, Make, Save);
// done steps fold to one line of what you did; the current step (Make) opens under the map.
import { AB, Deck, Lanes, Macros, MatchRow, PresetHead, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import v from "./v.module.css";

const STEPS = [
  { n: 1, t: "See the song", done: "6 sections · 4 parts · chords" },
  { n: 2, t: "Listen", done: "Bass alone · Drop 1 looping" },
  { n: 3, t: "Ask", done: "“Short A1 notes between the kicks: that gap is the bounce.”" },
  { n: 4, t: "Make", at: true },
  { n: 5, t: "Save", next: "Rubbery bass, from Lost in The Loop" },
];

export function V04Steps() {
  return (
    <Shell>
      <div className={v.s4}>
        <ol className={v.s4rail}>
          {STEPS.map((x) => (
            <li key={x.n} data-at={x.at ? "" : undefined} data-done={x.done ? "" : undefined}>
              <b>{x.done ? "✓" : x.n}</b>
              <div><span>{x.t}</span>{x.done && <small>{x.done}</small>}{x.next && <small>{x.next}</small>}</div>
            </li>
          ))}
          <li className={v.s4deck}><Deck /></li>
        </ol>
        <div className={v.s4main}>
          <TrackHead small><Transport compact /></TrackHead>
          <Lanes laneH={64} subs="solo" label={128} />
          <section className={v.s4card}>
            <div className={v.s4cardHead}><span className={s.who}>Step 4 · Make a bass like this one</span><button className={s.gold}>Next: save →</button></div>
            <div className={v.s4cols}>
              <div className={v.col}><PresetHead /><AB /><MatchRow /></div>
              <div className={v.col}><Macros size={56} /><Suggest /></div>
            </div>
          </section>
        </div>
      </div>
    </Shell>
  );
}
