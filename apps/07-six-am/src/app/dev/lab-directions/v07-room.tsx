"use client";
// 7 Room: the listening room. Almost nothing: the part you hear, big, and where you are.
import { MENTOR_SHORT, NOW, PARTS, SOLO } from "./data";
import { Deck, Shell, Strip, part, s } from "./shared";
import v from "./v.module.css";

export function V07Room() {
  const p = part(SOLO);
  return (
    <Shell>
      <div className={v.r7}>
        <div className={v.r7corner}><Deck look="pill" /></div>
        <div className={v.r7center}>
          <span className={s.muted}>Lost in The Loop · {NOW.section} · bar {NOW.bar}</span>
          <h2 className={v.r7big} style={{ color: p.color }}>{p.name}</h2>
          <p className={v.r7line}>{MENTOR_SHORT}</p>
          <button className={s.textBtn}>Make one like it</button>
        </div>
        <div className={v.r7foot}>
          <div className={v.r7parts}>
            {PARTS.map((x, i) => <button key={x.id} aria-pressed={x.id === SOLO}><kbd>{i + 1}</kbd>{x.name}</button>)}
          </div>
          <Strip part={p} />
        </div>
      </div>
    </Shell>
  );
}
