"use client";
// 6 Mentor: the Mentor leads. A conversation column; the map shrinks to a strip above it.
import { MENTOR, NOW, PARTS } from "./data";
import { Deck, Shell, Strip, part, s } from "./shared";
import v from "./v.module.css";

export function V06Mentor() {
  return (
    <Shell>
      <div className={v.m6}>
        <div className={v.m6top}>
          <div><h1 className={v.m6title}>Lost in The Loop</h1><span className={s.muted}>Mason Flint · 124 BPM · A minor</span></div>
          <Deck look="pill" />
        </div>
        <Strip part={part("bass")} />
        <div className={v.m6parts}>
          <span className={s.muted}>Hearing</span>
          {PARTS.map((p) => <button key={p.id} aria-pressed={p.id === "bass"} style={{ "--c": p.color } as React.CSSProperties}>{p.name}</button>)}
          <span className={s.muted} style={{ marginLeft: "auto" }}>bar {NOW.bar} · {NOW.section}</span>
        </div>
        <div className={v.m6chat}>
          <div className={v.m6you}>What makes this bass bounce?</div>
          <div className={v.m6them}>
            <p className={s.mentor}>{MENTOR}</p>
            <div className={v.row}>
              <button className={s.gold}>Make one like it</button>
              <button className={s.ghost}>Hear it with the drums</button>
              <button className={s.ghost}>Why A1?</button>
            </div>
          </div>
        </div>
        <input className={v.m6ask} placeholder="Ask about what you hear" aria-label="Ask the Mentor" />
      </div>
    </Shell>
  );
}
