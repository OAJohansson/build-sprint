"use client";

// The Mentor on the map (S2, B6; handoff Listen §6, L171, T87): every exchange is a small dot on
// the focus part's lane at the bar it was asked about (no numbers; questions within 3% of the
// track share one larger dot; hover shows the questions; the open dot is gold). "+ Ask" sits left
// of the playhead at the lane's foot. The open dot hangs a card below the lane (beside the dot when
// the focus lane is the last or there's no room below), on the side away from the playhead.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import type { PartName } from "@/lib/lab/live";
import { barsNamed, cardLeft, groupNotes, partNoun, whatDoing } from "@/lib/mentor/lab";
import { Composer, Turn, useEdgeFades, type ThreadTurn } from "./mentor-thread";
import s from "./lab.module.css";

export type LabTurn = ThreadTurn & { createdAt: string };

const CARD_W = 420;
/** "Make a bass like this →", "Make drums like this →". */
const MAKE_WHAT: Record<string, string> = { bass: "a bass", drums: "drums", other: "a sound", vocals: "vocals" };
/** Below the lane needs about this much height under it; otherwise the card goes beside the dot. */
/** T110 + PM: the card goes below (or above) the focus lane only when its thread gets ~300 px
 *  there (head, composer and padding take ~110), else beside the dot (~374 px of thread at a 734 px
 *  page), never over the playhead, on the side away from the bars its answer names. */
const NEED = 410;
/** The ruler and chord lane above the part lanes: a card above or beside never covers them. */
const HEAD_ROWS = 72;
/** Space kept under the card at the bottom of the Lab. */
const FOOT = 12;

type Props = {
  bars: number;
  turns: LabTurn[];
  partName: string;
  /** The playhead's bar (whole bars). */
  playheadBar: number;
  /** The open dot (its first bar) or null; `asking` = the bar a new question will pin at. */
  openBar: number | null;
  setOpenBar: (bar: number | null) => void;
  asking: number | null;
  setAsking: (bar: number | null) => void;
  knows: (bar: number) => string;
  onAsk: (q: string, bar: number) => void;
  onRetry: (id: string) => void;
  onSeek: (bar: number) => void;
  onMake: () => void;
  lastLane: boolean;
  busy: boolean;
  note: string | null;
};

export function LabNotes(p: Props) {
  const box = useRef<HTMLDivElement>(null);
  // LS2-M1: where the card goes. Below the lane when there's room for a ~300 px thread; else above
  // when there's that room above; else beside the dot, spanning the lane stack (never the ruler).
  const [geo, setGeo] = useState({ w: 1240, mode: "below" as "below" | "above" | "beside", maxH: 400, laneTop: 0, minTop: 0, bottom: 900 });
  const [peek, setPeek] = useState<number | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(200);
  const { bars, playheadBar } = p;
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const root = el.closest("[data-lab-root]")?.getBoundingClientRect();
      const grid = el.closest("[data-lab-grid]")?.getBoundingClientRect();
      const bottom = (root ? root.bottom : window.innerHeight) - FOOT;
      const minTop = (grid ? grid.top : 0) + HEAD_ROWS + 4;
      const below = bottom - r.bottom - 10, above = r.top - 10 - minTop;
      const mode = !p.lastLane && below >= NEED ? "below" : above >= NEED ? "above" : "beside";
      const maxH = Math.round(mode === "below" ? below : mode === "above" ? above : bottom - minTop);
      setGeo({ w: r.width || 1240, mode, maxH: Math.max(160, maxH), laneTop: r.top, minTop, bottom });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, [p.lastLane]);

  const groups = groupNotes(p.turns, bars);
  // The open dot: the group holding a note at that bar (a reply joins its dot's group).
  const open = p.openBar === null ? null : groups.find((g) => g.notes.some((n) => n.bar === p.openBar)) ?? null;
  const anchor = p.asking ?? open?.bar ?? null;
  const px = (bar: number) => ((bar - 1) / bars) * geo.w;
  const pct = (bar: number) => `${((bar - 1) / bars) * 100}%`;
  const askLeft = playheadBar > bars * 0.1;
  const close = () => { p.setOpenBar(null); p.setAsking(null); };

  // Esc closes the card.
  useEffect(() => {
    if (anchor === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // The open thread scrolls to its newest exchange.
  const thread = useRef<HTMLDivElement>(null);
  useEdgeFades(thread, [p.openBar, p.asking]);
  const count = open?.notes.length ?? 0;
  const lastAnswered = open?.notes.at(-1)?.answer ? 1 : 0;
  // The newest exchange starts at the top of the thread (its question in view, older ones above).
  useLayoutEffect(() => {
    const el = thread.current, last = el?.lastElementChild;
    if (el && last) el.scrollTop += last.getBoundingClientRect().top - el.getBoundingClientRect().top - (el.scrollTop > 0 ? 32 : 0); // clear of the 32 px fade
  }, [count, lastAnswered, p.openBar]);

  // The card's side is picked when it opens (against the playhead then), so it doesn't jump
  // from side to side while the playhead runs past the dot.
  const [side, setSide] = useState({ anchor, head: playheadBar });
  if (side.anchor !== anchor) setSide({ anchor, head: playheadBar });
  let cardStyle: CSSProperties | undefined;
  if (anchor !== null) {
    const beside = geo.mode === "beside";
    // LS2-N10: beside the dot, keep the bars the newest answer talks about in view.
    const said = open?.notes.filter((x) => x.answer).at(-1)?.answer;
    const named = said ? barsNamed(said.sentences.map((t) => t.text).join(" ")).filter((b) => b >= 1 && b <= bars) : [];
    const avoid = named.length ? { from: px(Math.min(...named)), to: px(Math.max(...named) + 1) } : null;
    const left = cardLeft(px(anchor), px(side.anchor === anchor ? side.head : playheadBar), geo.w, CARD_W, beside, avoid);
    if (geo.mode === "below") cardStyle = { left, top: "calc(100% + 10px)", maxHeight: geo.maxH };
    else if (geo.mode === "above") cardStyle = { left, bottom: "calc(100% + 10px)", maxHeight: geo.maxH };
    else {
      // Beside: next to the dot's height where it fits, moved up as the card grows.
      const top = Math.max(geo.minTop, Math.min(geo.laneTop + 5, geo.bottom - Math.min(cardH, geo.maxH)));
      cardStyle = { left, top: top - geo.laneTop, maxHeight: geo.maxH };
    }
  }
  // The card's own height, for placing it beside the dot.
  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setCardH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchor]);
  const name = p.partName.toLowerCase();
  const part = name as PartName;
  return (
    <div ref={box} className={s.notes} onClick={(e) => e.stopPropagation()}>
      {groups.map((g) => (
        <button key={g.bar} className={s.dot2} data-open={open === g ? "" : undefined} data-many={g.notes.length > 1 ? "" : undefined}
          style={{ left: pct(g.bar) }}
          onClick={() => { setPeek(null); p.setAsking(null); p.setOpenBar(open === g ? null : g.bar); }}
          onMouseEnter={() => setPeek(g.bar)} onMouseLeave={() => setPeek(null)} onFocus={() => setPeek(g.bar)} onBlur={() => setPeek(null)}
          aria-label={g.notes.length === 1 ? `Question at bar ${g.bar}: ${g.notes[0].q}` : `${g.notes.length} questions near bar ${g.bar}`} aria-expanded={open === g} />
      ))}
      {/* LS2-M4: hovering (or focusing) a dot shows its questions. */}
      {(() => {
        const g = peek === null ? null : groups.find((x) => x.bar === peek);
        if (!g || g === open) return null;
        const x = px(g.bar), left = Math.max(0, Math.min(geo.w - 280, x - 20));
        return (
          <div className={s.peek} style={{ left }} aria-hidden>
            {g.notes.slice(0, 3).map((n) => <span key={n.id}>{n.q}</span>)}
            {g.notes.length > 3 && <small>+{g.notes.length - 3} more</small>}
          </div>
        );
      })()}
      {anchor === null && (
        <button className={s.askBtn} aria-expanded={false}
          style={{ left: askLeft ? "calc(var(--ph, 0%) - 8px)" : "calc(var(--ph, 0%) + 8px)", transform: askLeft ? "translateX(-100%)" : undefined }}
          onClick={() => { p.setOpenBar(null); p.setAsking(playheadBar); }}>
          {p.turns.length === 0 ? `+ Ask about ${partNoun(part)} here` : "+ Ask"}
        </button>
      )}
      {anchor !== null && (
        <>
          {geo.mode === "below" && <i className={s.leader} style={{ left: pct(anchor), top: p.asking !== null ? "calc(100% - 4px)" : 14 }} aria-hidden />}
          {geo.mode === "above" && <i className={s.leader} style={{ left: pct(anchor), top: -10, bottom: "auto", height: 19 }} aria-hidden />}
          <div ref={cardRef} className={s.card} style={cardStyle} role="dialog" aria-label={open ? `Mentor at bar ${open.bar}` : "Ask the Mentor"}>
            <div className={s.cardHead}>
              <span className={s.ctx}>{open && p.asking === null ? `Mentor, at bar ${open.bar}` : `Ask about ${partNoun(part)} at bar ${anchor}`}</span>
              {/* T110: the Make link sits in the head, so the thread gets the card's height. */}
              {open && p.asking === null && <button className={s.makeText} onClick={p.onMake}>Make {MAKE_WHAT[name] ?? `a ${name}`} like this →</button>}
              <button className={s.x} onClick={close} aria-label="Close">×</button>
            </div>
            {open && p.asking === null ? (
              <>
                <div className={s.cardThread} ref={thread}>
                  {/* T110: answers capped at 6 lines ("Read all"); a facts line once, not repeated by the next exchange. */}
                  {open.notes.map((x, i) => <Turn key={x.id} x={x} lines={6} onSeek={p.onSeek} onRetry={() => p.onRetry(x.id)} showFacts={x.facts !== open.notes[i + 1]?.facts} />)}
                </div>
                <Composer placeholder={`Reply about bar ${open.bar}…`} onAsk={(q) => p.onAsk(q, open.bar)} disabled={p.busy} />
                {p.note && <p className={s.facts}>{p.note}</p>}
              </>
            ) : (
              <>
                <Composer placeholder={whatDoing(part)} onAsk={(q) => p.onAsk(q, anchor)} autoFocus disabled={p.busy} />
                <p className={s.facts}>{p.knows(anchor)}</p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
