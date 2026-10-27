"use client";
// 6 Twin lane: your sound is a lane on the map, right under the bass it copies, looping over the
// same bars. A/B is choosing which of the two lanes you hear. Macros open in its lane head; the
// Mentor speaks in a line under the map.
import { LOOP, MENTOR_SHORT, pct, w } from "./data";
import { Deck, Knob, Lanes, MatchRow, SaveRow, Shell, Suggest, TrackHead, Transport, s } from "./shared";
import { MACROS } from "./data";
import v from "./v.module.css";

export function V06Twin() {
  const twin = (
    <>
      <div className={v.t6head}>
        <div className={v.t6name}><span className={v.t6dot} />Mine · Round sub ▾</div>
        <div className={v.t6ab}><button aria-pressed>A</button><button>B</button><span className={s.faint}>level-matched</span></div>
      </div>
      <div className={v.t6lane}>
        <span className={v.t6block} style={{ left: pct(LOOP.from), width: w(LOOP.from, LOOP.to) }}>
          <span className={v.t6knobs}>{MACROS.map((k) => <Knob key={k.name} {...k} size={40} />)}</span>
        </span>
      </div>
    </>
  );
  return (
    <Shell>
      <TrackHead small><Transport compact /><Deck /></TrackHead>
      <Lanes laneH={80} subs="solo" extra={twin} extraH={128} />
      <div className={v.t6foot}>
        <p className={v.t6sub}><span className={s.who}>Mentor</span> {MENTOR_SHORT}</p>
        <input className={s.ask} placeholder="Ask about the bass…" aria-label="Ask the Mentor" style={{ width: 300 }} />
      </div>
      <div className={v.t6foot}>
        <Suggest />
        <MatchRow />
        <div style={{ flex: 1 }}><SaveRow /></div>
      </div>
    </Shell>
  );
}
