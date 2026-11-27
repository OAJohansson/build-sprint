"use client";

// Rebuild the song (Phase 7 slice 3, approved design p7-final "3 Rebuild"): lane names once on the
// left, the original's sections as columns sized by their bars, one slot per section × lane. Pick a
// slot, then a part you saved in Make; it repeats to the section's end. Gold "has kick" = the
// original has it there and it's still yours to fill; blank = it doesn't (measured lanes) or no hint
// (lanes the map can't measure). The strip under the top bar (always 36 px) says what the empty
// rebuild is, or sums it up, and on the right whether the original can play (slice 4, the Deck).
// The rules live in @/lib/rebuild; edits go through the timeline (undo, autosave, playback).
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { libLaneType } from "@/lib/make/lib-loop";
import type { LibrarySound } from "@/lib/make/library";
import {
  REBUILD_LANES, emptySlot, fillSlot, leaveSlot, partFits, rebuildLane, sectionIndexAt, slotHint, slotState, toFill,
  type Hint, type RebuildSection,
} from "@/lib/rebuild";
import { colorOf } from "@/lib/studio-lanes";
import type { Doc } from "@/lib/timeline";
import type { MySounds } from "./crate";
import type { Timeline } from "./use-timeline";
import type { CompareHook, MaybeCompare } from "./use-compare";
import { cx } from "./lanes";
import r from "./rebuild.module.css";

/** What a lane's parts are called in "No saved … yet". */
const NOUN: Record<string, string> = { kick: "kicks", claps: "claps", hats: "hats", perc: "percussion", bass: "bass", chords: "chords", pads: "pads", lead: "leads", fx: "FX", vocals: "vocals" };
/** The Make tab that makes a lane's parts (Lab: ?mode=make&make=…; Bass is Make's first tab). */
const MAKE_TAB: Record<string, [string, string | null]> = {
  kick: ["Drums", "drums"], claps: ["Drums", "drums"], hats: ["Drums", "drums"], perc: ["Drums", "drums"],
  bass: ["Bass", null], chords: ["Melody", "melody"], pads: ["Melody", "melody"], lead: ["Melody", "melody"], fx: ["FX", "fx"],
};
const makeHref = (mapId: string, lane: string) => `/map?id=${encodeURIComponent(mapId)}&mode=make${MAKE_TAB[lane]?.[1] ? `&make=${MAKE_TAB[lane][1]}` : ""}`;
/** A section is never narrower than the longest name a map gives ("Breakdown 2") and "2 to fill". */
const MIN_W = 114;
const RIGHT_PAD = 24;

type Pick = { i: number; lane: string } | null;
type Hook = {
  mapId: string; bars: number; bpm: number | undefined;
  sections: { name: string; start: number; bars: number; has: string[]; toFill: number }[];
  slots: { section: number; sectionName: string; lane: string; hint: Hint; state: "empty" | "filled" | "left"; part: string | null; partName: string | null; start: number | null; length: number | null }[];
  counts: { toFill: number; filled: number; left: number };
  picked: { section: number; lane: string } | null;
  playhead: number;
  /** Slice 4 (W10): Mine / Original, what the Deck reports, and the last switch's landing. */
  compare: CompareHook | null;
};
declare global { interface Window { __sixamRebuild?: Hook } }

const lw = (w: number) => (w < 1360 ? 170 : 180);
const sideW = (w: number) => (w < 1360 ? 276 : 300);
const fits = (txt: string, px: number, size = 13, pad = 22) => txt.length * size * 0.6 + pad <= px;
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export function RebuildView({ t, mine, cmp }: { t: Timeline; mine: MySounds; cmp: MaybeCompare }) {
  const doc = t.doc, rb = doc.rebuild!;
  const [pick, setPick] = useState<Pick>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [winW, setWinW] = useState(1440);
  const [edge, setEdge] = useState({ left: false, right: false });

  // The grid's width decides bar widths; it scrolls sideways when the minimum widths don't fit.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => { setWidth(el.clientWidth); setWinW(window.innerWidth); };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const LW = lw(winW);
  const lay = useMemo(() => {
    const room = Math.max(200, width - LW - RIGHT_PAD);
    // Bar for bar, except that a short section gets MIN_W and the others share what's left; when
    // even that doesn't fit, the grid scrolls sideways.
    const short = new Set<number>();
    let ppb = 0;
    for (let k = 0; k <= rb.sections.length; k++) {
      const rest = rb.sections.reduce((n, s, i) => (short.has(i) ? n : n + s.bars), 0);
      ppb = rest ? Math.max(0, room - short.size * MIN_W) / rest : 0;
      const more = rb.sections.findIndex((s, i) => !short.has(i) && s.bars * ppb < MIN_W);
      if (more < 0) break;
      short.add(more);
    }
    const ws = rb.sections.map((s, i) => (short.has(i) ? MIN_W : Math.max(s.bars * ppb, MIN_W)));
    const at = ws.map((w, i) => ({ x: ws.slice(0, i).reduce((a, v) => a + v, 0), w }));
    return { at, total: Math.max(ws.reduce((a, v) => a + v, 0), room) };
  }, [width, LW, rb.sections]);
  const barX = (bar: number) => {
    const i = sectionIndexAt(rb, bar), s = rb.sections[i], o = lay.at[i];
    return o.x + Math.min(1, Math.max(0, (bar - s.start) / s.bars)) * o.w;
  };

  // The scroll cue: a fade and a button at the side panel's edge while more of the song is to the right.
  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const left = el.scrollLeft > 2, right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    setEdge((e) => (e.left === left && e.right === right ? e : { left, right }));
  };
  useEffect(onScroll, [lay]);
  // While playing, keep the playhead in view.
  const phX = LW + barX(t.playhead);
  useEffect(() => {
    const el = scroller.current;
    if (!el || !t.playing || el.scrollWidth <= el.clientWidth) return;
    if (phX < el.scrollLeft + LW || phX > el.scrollLeft + el.clientWidth - 40) el.scrollTo({ left: Math.max(0, phX - LW - 40) });
  }, [phX, t.playing, LW]);

  // Esc closes the slot panel.
  useEffect(() => {
    if (!pick) return;
    const on = (e: KeyboardEvent) => { if (e.key === "Escape") setPick(null); };
    addEventListener("keydown", on);
    return () => removeEventListener("keydown", on);
  }, [pick]);

  const sounds = useMemo(() => (mine.is === "ready" ? mine.sounds : []), [mine]);
  const fill = (i: number, lane: string, part: LibrarySound) => t.edit((d: Doc) => fillSlot(d, i, lane, part));

  // Dev hook for graders (W9, R7-S6/S7): sections, every slot's hint and state, the counts.
  useEffect(() => {
    const slots: Hook["slots"] = [];
    rb.sections.forEach((s, i) => REBUILD_LANES.forEach((l) => {
      const st = slotState(doc, i, l.id);
      const x = st.state === "filled" ? doc.sounds?.find((y) => y.id === st.region.loopId) : undefined;
      slots.push({
        section: i, sectionName: s.name, lane: l.id, hint: slotHint(s, l.id), state: st.state,
        part: x?.source === "lib" ? x.libId : null, partName: x?.name ?? null,
        start: st.state === "filled" ? st.region.start : null, length: st.state === "filled" ? st.region.length : null,
      });
    }));
    window.__sixamRebuild = {
      mapId: rb.mapId, bars: doc.bars ?? 64, bpm: doc.bpm,
      sections: rb.sections.map((s, i) => ({ name: s.name, start: s.start, bars: s.bars, has: s.has, toFill: toFill(doc, i).length })),
      slots,
      counts: { toFill: rb.sections.reduce((n, _s, i) => n + toFill(doc, i).length, 0), filled: slots.filter((x) => x.state === "filled").length, left: slots.filter((x) => x.state === "left").length },
      picked: pick ? { section: pick.i, lane: pick.lane } : null,
      playhead: t.playhead,
      compare: cmp.on ? {
        mode: cmp.mode, ready: cmp.ready, lastSwitch: cmp.lastSwitch,
        // Read live: the Deck's freshest report, not the last render's.
        get deck() { const d = cmp.deck.last(); return { open: cmp.deck.open, url: d?.url ?? null, posMs: d ? Math.round(d.pos) : null, playing: !!d?.playing }; },
      } : null,
    };
  }, [doc, rb, pick, t.playhead, cmp]);

  const empty = doc.regions.length === 0 && !(rb.left ?? []).length;
  // U7-24: the strip never sits empty: what's still to fill, filled and left empty.
  const sum = (() => {
    const n = rb.sections.reduce((a, _s, i) => a + toFill(doc, i).length, 0);
    const filled = rb.sections.reduce((a, s, i) => a + REBUILD_LANES.filter((l) => slotState(doc, i, l.id).state === "filled").length, 0);
    const left = (rb.left ?? []).length;
    const key = doc.key ? `${doc.key.key}${doc.key.scale === "minor" ? "m" : ""}` : "Am";
    return [n ? `${n} to fill` : "nothing left to fill", `${filled} filled`, ...(left ? [`${left} left empty`] : []), `${doc.bpm ?? ""} bpm · ${key}`].join(" · ");
  })();
  const bar = Math.floor(t.playhead);
  const tight = winW < 1360;

  return (
    <div className={r.root} style={{ "--lw": `${LW}px`, "--side": `${sideW(winW)}px` } as React.CSSProperties}>
      {/* Always 36 px: the controls above and below never move. */}
      <div className={r.strip}>
        {/* At 1280 the long note and the Deck's message don't both fit: the summary stands in. */}
        {empty && !(cmp.on && (!cmp.ready || cmp.mode === "orig")) ? (
          <span><b>The original&rsquo;s {plural(rb.sections.length, "section")}, bar for bar.</b> Every slot starts empty: pick one, then a part you saved in Make. Gold &ldquo;has kick&rdquo; shows what the original has there.</span>
        ) : <span>{sum}</span>}
        {!cmp.on ? null : !cmp.ready ? (
          <span className={r.warn} role="status">Original is off: the Deck isn&rsquo;t open. <button onClick={cmp.openDeck}>Open the Deck</button> to hear the original from bar {bar}.</span>
        ) : cmp.mode === "orig" ? (
          <span className={cx(r.warn, r.playingOrig)} role="status">Playing the original from bar {cmp.fromBar ?? bar}, in the Deck</span>
        ) : null}
      </div>
      <div className={r.body}>
        <div className={r.arrWrap}>
          <div className={r.arr} ref={scroller} onScroll={onScroll}>
            <div className={r.arrin} style={{ width: LW + lay.total + RIGHT_PAD }}>
              <div className={r.head}>
                <span className={r.corner} />
                <div className={r.tl}>
                  {rb.sections.map((s, i) => <SectionHead key={i} s={s} n={toFill(doc, i).length} hinted={REBUILD_LANES.some((l) => slotHint(s, l.id) === "has")} x={lay.at[i].x} w={lay.at[i].w} onSeek={() => (cmp.on ? cmp.seek(s.start) : t.jumpTo(s.start))} />)}
                </div>
              </div>
              <div className={r.lanes} style={{ gridTemplateRows: `repeat(${REBUILD_LANES.length}, minmax(${tight ? 38 : 42}px, 1fr))` }}>
                {REBUILD_LANES.map((l) => {
                  const lane = t.lanes.find((x) => x.id === l.id);
                  return (
                    <div key={l.id} className={r.lane}>
                      <div className={r.lname} style={{ "--c": colorOf(l.type) } as React.CSSProperties}>
                        <span>{l.name}</span>
                        {lane ? <button className={r.mbtn} aria-pressed={lane.muted} aria-label={`Mute ${l.name}`} title="Mute this lane" onClick={() => t.toggleMute(lane.id)}>Mute</button> : null}
                      </div>
                      <div className={r.tl}>
                        {rb.sections.map((s, i) => <i key={i} className={r.secline} style={{ left: lay.at[i].x }} />)}
                        {rb.sections.map((s, i) => (
                          <Slot key={i} doc={doc} i={i} s={s} lane={l.id} x={lay.at[i].x} w={lay.at[i].w}
                            open={pick?.i === i && pick.lane === l.id} onPick={() => setPick(pick?.i === i && pick.lane === l.id ? null : { i, lane: l.id })} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <span className={r.ph} style={{ left: phX }} aria-hidden />
            </div>
          </div>
          {edge.right ? (
            <button className={r.cueR} onClick={() => scroller.current?.scrollBy({ left: scroller.current.clientWidth * 0.7, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} aria-label="Scroll to the later sections">
              <span aria-hidden>›</span>
            </button>
          ) : null}
          {edge.left ? <span className={r.cueL} aria-hidden /> : null}
        </div>
        <aside className={r.side} aria-label={pick ? "Fill this slot" : "My saved parts"}>
          {pick ? (
            <SlotPanel doc={doc} pick={pick} sounds={sounds} loading={mine.is === "loading"} onClose={() => setPick(null)}
              onFill={(p) => fill(pick.i, pick.lane, p)}
              onEmpty={() => t.edit((d) => emptySlot(d, pick.i, pick.lane))}
              onLeave={(on) => t.edit((d) => leaveSlot(d, pick.i, pick.lane, on))} />
          ) : (
            <AllParts sounds={sounds} mine={mine} />
          )}
        </aside>
      </div>
    </div>
  );
}

function SectionHead({ s, n, hinted, x, w, onSeek }: { s: RebuildSection; n: number; hinted: boolean; x: number; w: number; onSeek: () => void }) {
  const range = `${s.start}–${s.start + s.bars - 1}`;
  const roomy = s.name.length * 8.4 + range.length * 6.9 + 40 <= w;
  // One phrase everywhere (L295): "N to fill", "nothing left to fill" (shortened to "none left" when
  // narrow); never a bare number. A section without measured parts shows no count.
  const count = !hinted ? "" : n ? `${n} to fill` : fits("nothing left to fill", w, 11.5, 17) ? "nothing left to fill" : "none left";
  const shown = count && fits(count, w, 11.5, 17) ? count : "";
  // U7-23: the bar range on every header that fits it: beside the name, else beside the count.
  const range2 = !roomy && fits(`${shown}${shown ? "  " : ""}${range}`, w, 11.5, 17);
  return (
    <button className={r.sech} style={{ left: x, width: w }} onClick={onSeek} title={`${s.name}, bars ${range}. Play from bar ${s.start}`}>
      <span className={r.l1}><span className={r.sn}>{s.name}</span>{roomy ? <span className={r.range}>{range}</span> : null}</span>
      <span className={r.count}><span className={n > 0 ? r.gold : undefined}>{shown}</span>{range2 ? <span className={r.range}>{shown ? "  " : ""}{range}</span> : null}</span>
    </button>
  );
}

function Slot({ doc, i, s, lane, x, w, open, onPick }: { doc: Doc; i: number; s: RebuildSection; lane: string; x: number; w: number; open: boolean; onPick: () => void }) {
  const L = rebuildLane(lane)!, hint = slotHint(s, lane), st = slotState(doc, i, lane);
  const px = w - 6;
  let kind: "f" | "h" | "v" | "l" | "n" | "e", text = "", short: string[] = [];
  if (st.state === "filled") { kind = "f"; text = doc.sounds?.find((y) => y.id === st.region.loopId)?.name ?? "A saved part"; }
  else if (st.state === "left") { kind = "l"; text = "left empty"; short = ["left"]; }
  else if (hint === "has") { kind = "h"; text = `has ${L.name.toLowerCase()}`; short = [L.name.toLowerCase()]; }
  else if (hint === "vocals") { kind = "v"; text = "has vocals · not yet"; short = ["vocals · not yet", "not yet"]; }
  else kind = hint === "none" ? "n" : "e";
  // Shorter words for narrow slots before cutting (a labelled slot is never left blank).
  const label = !text ? "" : kind === "f" || fits(text, px) ? text : short.find((y) => fits(y, px)) ?? short.at(-1) ?? text;
  const none = `The original has no ${L.name.toLowerCase()} here`;
  const what = text || (hint === "none" ? `${none.toLowerCase()}; add a part` : "empty, add a part");
  const color = colorOf(L.type);
  return (
    <button
      className={cx(r.slot, r[kind])} aria-expanded={open} aria-label={`${s.name}, ${L.name}: ${what}`} title={text || (hint === "none" ? `${none}. Add a part` : "Add a part")} onClick={onPick}
      style={{ left: x + 3, width: w - 6, ...(kind === "f" ? { background: `color-mix(in srgb, ${color} 28%, #1a1715)`, boxShadow: `inset 3px 0 ${color}` } : {}) }}
    >
      {label ? <span className={r.tx}>{label}</span> : <span className={r.plus} aria-hidden>+</span>}
    </button>
  );
}

function PartItem({ p, onClick, on }: { p: LibrarySound; onClick?: () => void; on?: boolean }) {
  const type = libLaneType(p), lane = REBUILD_LANES.find((l) => l.type === type);
  const inner = (
    <>
      <i style={{ background: colorOf(type) }} />
      <span className={r.pn}><b title={p.name}>{p.name}</b><small>{lane?.name ?? type} · {plural(p.pattern.bars, "bar")}</small></span>
    </>
  );
  return onClick ? <button className={r.part} onClick={onClick} aria-pressed={!!on}>{inner}</button> : <div className={cx(r.part, r.partStatic)}>{inner}</div>;
}

function AllParts({ sounds, mine }: { sounds: LibrarySound[]; mine: MySounds }) {
  return (
    <>
      <span className={r.hd}>My saved parts</span>
      <span className={r.lbl}>Pick a slot, then a part to fill it.</span>
      {mine.is === "loading" ? <span className={r.lbl}>Loading your saved parts…</span>
        : mine.is === "error" ? <span className={r.lbl}>Your saved parts didn&rsquo;t load. Reload the page to try again.</span>
        : !sounds.length ? <span className={r.lbl}>Nothing saved yet. Make a part in Make, then save it.</span>
        : <div className={r.lib}>{sounds.map((p) => <PartItem key={p.id} p={p} />)}</div>}
    </>
  );
}

function SlotPanel({ doc, pick, sounds, loading, onClose, onFill, onEmpty, onLeave }: {
  doc: Doc; pick: { i: number; lane: string }; sounds: LibrarySound[]; loading: boolean;
  onClose: () => void; onFill: (p: LibrarySound) => void; onEmpty: () => void; onLeave: (on: boolean) => void;
}) {
  const s = doc.rebuild!.sections[pick.i], L = rebuildLane(pick.lane)!, hint = slotHint(s, pick.lane), st = slotState(doc, pick.i, pick.lane);
  const parts = sounds.filter((p) => partFits(p, pick.lane));
  const inSlot = st.state === "filled" ? doc.sounds?.find((y) => y.id === st.region.loopId) : undefined;
  // L295: say so when the list mixes chords and pads (one family, both fit).
  const types = new Set(parts.map((p) => libLaneType(p)));
  const harmonyMix = types.has("chords") && types.has("pads");
  const noun = L.name.toLowerCase();
  const sentence = hint === "vocals" ? "The original has vocals here. Six AM can’t make vocals yet."
    : hint === "has" ? `The original has ${noun} here.`
    : hint === "none" ? `The original has no ${noun} here.`
    : `No hint: Six AM can’t hear ${noun} in the original yet.`;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, [pick.i, pick.lane]);
  return (
    <div className={r.panel} ref={ref} tabIndex={-1}>
      <div className={r.ph1}><span className={r.hd}>{s.name} · {L.name}</span><button className={r.x} onClick={onClose} aria-label="Close">✕</button></div>
      <span className={r.lbl}>Bars {s.start}–{s.start + s.bars - 1}. A part repeats to the section&rsquo;s end.</span>
      <span className={hint === "has" && st.state === "empty" ? r.gold : r.muted}>{sentence}</span>
      {inSlot ? <span className={r.lbl}>In this slot: <span className={r.inSlot}>{inSlot.name}</span></span> : null}
      {harmonyMix ? <span className={r.lbl}>{pick.lane === "pads" ? "Pads and chords fit here." : "Chords and pads fit here."}</span> : null}
      {pick.lane === "vocals" ? null
        : loading ? <span className={r.lbl}>Loading your saved parts…</span>
        : parts.length ? (
          <div className={r.lib}>
            {parts.map((p) => <PartItem key={p.id} p={p} on={inSlot?.source === "lib" && inSlot.libId === p.id} onClick={() => onFill(p)} />)}
          </div>
        ) : (
          <p className={r.lbl}>No saved {NOUN[pick.lane] ?? noun} yet. <a className={cx(r.link, r.nowrap)} href={makeHref(doc.rebuild!.mapId, pick.lane)}>Build one in Make → {MAKE_TAB[pick.lane]?.[0] ?? "Bass"}</a></p>
        )}
      {st.state === "filled" ? <button className={r.link} onClick={onEmpty}>Empty this slot</button>
        : st.state === "left" ? <span className={r.lbl} role="status">Left empty · <button className={r.link} onClick={() => onLeave(false)}>Undo</button></span>
        : hint === "has" ? <button className={r.link} onClick={() => onLeave(true)}>Leave empty</button> : null}
    </div>
  );
}
