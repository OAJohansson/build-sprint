"use client";
// 2 Columns (seed 2): time runs down the page; the parts stand side by side, the one you hear wide.
import type { CSSProperties } from "react";
import { MENTOR, NOW, PARTS, SECTIONS, SOLO, TRACK } from "./data";
import { Deck, Shell, TrackHead, s } from "./shared";
import v from "./v.module.css";

const top = (bar: number) => `${((bar - 1) / TRACK.bars) * 100}%`;
const h = (a: number, b: number) => `${((b - a) / TRACK.bars) * 100}%`;

export function V02Columns() {
  return (
    <Shell>
      <TrackHead small><Deck /></TrackHead>
      <div className={v.c2}>
        <div className={v.c2axis}>
          {SECTIONS.map((x, i) => <span key={i} style={{ top: top(x.from) }}>{x.name}<small>{x.from}</small></span>)}
        </div>
        {PARTS.map((p) => (
          <div key={p.id} className={v.c2col} data-on={p.id === SOLO || undefined} style={{ "--c": p.color } as CSSProperties}>
            <button className={v.c2name}>{p.name}{p.id === SOLO ? <small>alone</small> : null}</button>
            <div className={v.c2lane}>
              {SECTIONS.slice(1).map((x) => <i key={x.from} className={v.c2line} style={{ top: top(x.from) }} />)}
              {p.blocks.map(([a, b]) => <span key={a} className={v.c2block} style={{ top: top(a), height: h(a, b) }} />)}
            </div>
          </div>
        ))}
        <i className={v.c2now} style={{ top: `calc(44px + (100% - 44px) * ${(NOW.bar - 1) / TRACK.bars})` }}><span>bar {NOW.bar}</span></i>
        <aside className={v.c2side}>
          <span className={s.who}>Bass, now</span>
          <p className={s.mentor}>{MENTOR}</p>
          <button className={s.gold}>Make one like it</button>
        </aside>
      </div>
    </Shell>
  );
}
