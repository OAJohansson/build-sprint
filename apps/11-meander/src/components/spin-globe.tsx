"use client";

// Phase 5 prototype (L62): a real globe you spin. The front half shows; drag spins it (with inertia), arrow keys
// turn it, and opening a school turns it to the front. Two families of directions, three each:
//  A, spin with a light overview (neighbours round the back always pinned to the rim):
//   a1 faint back-side dots + "The whole map" family list; a2 a small flat mini-map of everything, with the part
//   you face ringed; a3 family names floating over their front regions, plus back-side dots; a4 (critic r2) = a1 + a3.
//  B, pure spin (nothing stands in for the back half):
//   b1 the plain globe; b2 close-up, a bigger globe rising from the bottom like a horizon; b3 spotlight, names only
//   near the middle, so a name appears as you turn it towards you.
// shortcut: prototype quality (no label cost search, no tab order by distance); rebuild properly once picked.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { splitName, type Field } from "@/lib/content";
import { GAMMA, RIM, project, vec, type Vec3 } from "@/lib/globe";
import { arcPath, centroid, clampPitch, facingRot, frontOf, graticule, lerpRot, ortho, placeSpinLabels, type Box, type Rot } from "@/lib/spin";

export type SpinVariant = "a1" | "a2" | "a3" | "a4" | "b1" | "b2" | "b3";
/** Families for music; the timeline's eras for philosophy (critic r1: Western/Eastern was two rows, not an overview). */
export function groupsOf(field: Field) {
  if (field.families.length) return field.families.map((f) => ({ id: f.id, name: f.name, schools: field.schools.filter((s) => s.family === f.id) }));
  const rows = timelineRows(field.schools, undefined, field.spans, field.eras);
  return field.eras.map((e, i) => ({ id: `era-${i}`, name: e.name, schools: rows.filter((r) => r.era === i).map((r) => r.item) }));
}
/** The densest side of the sphere: the point with the most others within about 63°, then the middle of that crowd. */
function densest(vs: Vec3[]): Vec3 {
  const d = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  let best = vs[0], n = -1;
  for (const v of vs) { const k = vs.filter((w) => d(v, w) > 0.45).length; if (k > n) { n = k; best = v; } }
  return centroid(vs.filter((w) => d(best, w) > 0.45));
}
import { stateLabel, type SchoolState } from "@/lib/progress";
import { timelineRows } from "@/lib/timeline";
import type { GlobeMode } from "@/lib/globe-proto";

type Props = {
  field: Field;
  mode: SpinVariant;
  focus: string | null;
  states: Map<string, SchoolState>;
  onOpen: (id: string) => void;
  C: [number, number];
  R: number;
  W: number;
  H: number;
  /** Places labels must stay clear of (header, card, the index). */
  fixed: Box[];
  /** Phone: smaller type, no rim labels for the back. */
  compact?: boolean;
  /** Hides the globe's buttons from the keyboard (inside a school, on the timeline). */
  inert?: boolean;
  /** Lit from outside (the index's hovered family). */
  litIds?: Set<string> | null;
  /** Asks the globe to turn to this point (the index's family). */
  turnTo?: { v: Vec3; n: number } | null;
  idPrefix: string;
  children?: ReactNode;
};

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function SpinGlobe({ field, mode, focus, states, onOpen, C: C0, R: R0, W, H, fixed, compact, inert, litIds, turnTo, idPrefix, children }: Props) {
  const fam = mode[0] as "a" | "b";
  // b2: a close-up globe rising from the bottom (back to normal size while a card is open, so it clears the card)
  const big = mode === "b2" && !focus;
  // A (critic r1): a little smaller and lower on first open, so the top clears the menu
  const calm = fam === "a" && !focus;
  const R = big ? R0 * 1.42 : calm ? R0 * 0.92 : R0;
  const C: [number, number] = big ? [C0[0], C0[1] + R0 * 0.38] : calm ? [C0[0], C0[1] + 22] : C0;
  const V = useMemo(() => Object.fromEntries(field.schools.map((s) => [s.id, vec(field.positions[s.id])])) as Record<string, Vec3>, [field]);
  const start = useMemo(() => {
    const r = facingRot(focus ? V[focus] : densest(Object.values(V)));
    return { yaw: r.yaw, pitch: clampPitch(r.pitch - 0.12) };
  }, [field]); // eslint-disable-line react-hooks/exhaustive-deps -- where it starts, per field
  const [rot, setRot] = useState<Rot>(start);
  const rotRef = useRef(rot);
  const set = (r: Rot) => { rotRef.current = r; setRot(r); };

  const raf = useRef(0);
  const stop = () => cancelAnimationFrame(raf.current);
  const turn = (to: Rot, ms = 700) => {
    stop();
    if (reduced()) { raf.current = requestAnimationFrame(() => set(to)); return; }
    const from = rotRef.current, t0 = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      set(lerpRot(from, to, ease(k)));
      if (k < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => { if (focus && V[focus]) turn(facingRot(V[focus])); }, [focus, V]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (turnTo) { const r = facingRot(turnTo.v); turn({ yaw: r.yaw, pitch: clampPitch(r.pitch - 0.1) }); } }, [turnTo]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => stop, []);

  // Drag to spin. Window listeners, not pointer capture, so a click on a name still lands on its button.
  const wrap = useRef<HTMLDivElement>(null);
  const dragged = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 || !wrap.current) return;
    stop();
    const k = wrap.current.getBoundingClientRect().width / W || 1;
    const sx = e.clientX, sy = e.clientY, r0 = rotRef.current;
    dragged.current = false;
    let last = { x: sx, y: sy, t: performance.now() }, vx = 0, vy = 0;
    const move = (ev: PointerEvent) => {
      const dx = (ev.clientX - sx) / k, dy = (ev.clientY - sy) / k;
      if (!dragged.current && Math.hypot(dx, dy) < 4) return;
      dragged.current = true;
      const now = performance.now(), dt = Math.max(1, now - last.t);
      vx = 0.7 * vx + 0.3 * ((ev.clientX - last.x) / k / R / dt);
      vy = 0.7 * vy + 0.3 * ((ev.clientY - last.y) / k / R / dt);
      last = { x: ev.clientX, y: ev.clientY, t: now };
      set({ yaw: r0.yaw + dx / R, pitch: clampPitch(r0.pitch + dy / R) });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!dragged.current || reduced() || performance.now() - last.t > 80) return;
      // Inertia: the spin carries on and slows (about 0.95 a frame), so a flick sends it round.
      let t0 = performance.now();
      const glide = (t: number) => {
        const dt = t - t0; t0 = t;
        const f = Math.pow(0.95, dt / 16);
        vx *= f; vy *= f;
        const r = rotRef.current;
        set({ yaw: r.yaw + vx * dt, pitch: clampPitch(r.pitch + vy * dt) });
        if (Math.hypot(vx, vy) > 0.00002) raf.current = requestAnimationFrame(glide);
      };
      raf.current = requestAnimationFrame(glide);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (dragged.current) { e.stopPropagation(); e.preventDefault(); dragged.current = false; }
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = (14 * Math.PI) / 180, r = rotRef.current;
    const to = e.key === "ArrowLeft" ? { ...r, yaw: r.yaw - step } : e.key === "ArrowRight" ? { ...r, yaw: r.yaw + step }
      : e.key === "ArrowUp" ? { ...r, pitch: clampPitch(r.pitch - step) } : e.key === "ArrowDown" ? { ...r, pitch: clampPitch(r.pitch + step) } : null;
    if (!to || e.target !== e.currentTarget) return;
    e.preventDefault();
    turn(to, 260);
  };

  // Where everything is this frame.
  const near = useMemo(() => new Map(focus ? field.neighbours(focus).map((n) => [n.school.id, n]) : []), [field, focus]);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoverId = focus ? null : hovered;
  // a3: a clicked family name lights its members (and turns the globe to them)
  const [famLit, setFamLit] = useState<{ id: string; ids: Set<string> } | null>(null);
  const familyLit = focus ? null : litIds ?? famLit?.ids ?? null;
  const lit = useMemo(() => {
    if (familyLit) return familyLit;
    if (!hoverId) return null;
    const ids = new Set([hoverId]);
    for (const l of field.links) if (l.from === hoverId) ids.add(l.to); else if (l.to === hoverId) ids.add(l.from);
    return ids;
  }, [hoverId, field.links, familyLit]);

  const P = Object.fromEntries(field.schools.map((s) => [s.id, ortho(V[s.id], rot, C, R)]));
  const front = field.schools.filter((s) => s.id !== focus && P[s.id].z > 0);
  const back = field.schools.filter((s) => s.id !== focus && P[s.id].z <= 0);
  const rOf = (id: string) => (near.has(id) ? 6 : focus ? 2.5 : (compact ? 2.2 : 2.6) + 1.6 * P[id].z);

  // Label sizes are measured once per school and look, then reused while the globe turns.
  // A hidden copy of every label (in the look it has now) is measured after fonts load and whenever the focus changes.
  const measure = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState(new Map<string, { w: number; h: number }>());
  const [fonts, setFonts] = useState(0);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFonts((t) => t + 1));
    return () => { alive = false; };
  }, []);
  useLayoutEffect(() => {
    const id = requestAnimationFrame(() => {
      const m = new Map<string, { w: number; h: number }>();
      measure.current?.querySelectorAll<HTMLElement>("[data-k]").forEach((el) => m.set(el.dataset.k!, { w: el.offsetWidth, h: el.offsetHeight }));
      setSizes(m);
    });
    return () => cancelAnimationFrame(id);
  }, [field, focus, fonts]);

  const label = (id: string) => splitName(field.getSchool(id)!.name).short;
  const sizeKey = (id: string) => `${id}|${near.has(id) ? 1 : 0}`;
  const sizeOf = (id: string) => sizes.get(sizeKey(id)) ?? { w: label(id).length * (near.has(id) ? 11 : 7.6), h: near.has(id) ? 44 : 19 };
  // Labels: neighbours first, then the nearest the front; none for the rim band, where names would squash.
  const minZ = mode === "b3" ? (compact ? 0.82 : 0.78) : compact ? 0.42 : 0.34;
  const wanted = front
    .filter((s) => near.has(s.id) || (!focus && P[s.id].z > minZ))
    .sort((a, b) => (near.has(a.id) ? 0 : 1) - (near.has(b.id) ? 0 : 1) || P[b.id].z - P[a.id].z)
    .map((s) => ({ id: s.id, x: P[s.id].x, y: P[s.id].y, r: rOf(s.id), ...sizeOf(s.id), must: near.has(s.id) }));
  const title: Box[] = focus ? [{ x: C[0] - 200, y: C[1] - 30, w: 400, h: 120 }] : [];
  // the title's text only (the dot sits at C, the name and date line under it), so threads run up to it unbroken
  const titleKo = focus ? { x: C[0] - 175, y: C[1] - 26, w: 350, h: 82 } : null;
  const placed = placeSpinLabels(wanted, [...fixed, ...title], C, W, H);

  // A, focus: neighbours round the back, pinned to the rim in their direction, so the card's neighbours are all on screen.
  const rim = fam === "a" && focus && !compact
    ? back.filter((s) => near.has(s.id)).map((s) => {
      const p = P[s.id], dx = p.x - C[0], dy = p.y - C[1], l = Math.hypot(dx, dy) || 1;
      const x = C[0] + (dx / l) * (R + 10), w = sizeOf(s.id).w;
      // the label points away from the globe, unless that runs off the screen; then it tucks inside the rim
      const right = dx >= 0 ? x + 12 + w < W - 8 : x - 12 - w < 8;
      return { s, x, y: C[1] + (dy / l) * (R + 10), right };
    })
    : [];

  const paths = field.links.map((l) => {
    const isF = l.from === focus || l.to === focus;
    const cls = ["th", isF && "focus", isF && l.type === "against" && "against", isF && l.type === "built-then-against" && "mixed", !!focus && !isF && "rest", lit && lit.has(l.from) && lit.has(l.to) && (hoverId === l.from || hoverId === l.to || !!familyLit) && "lit"]
      .filter(Boolean).join(" ");
    return { key: `${l.from}-${l.to}`, cls, d: arcPath(V[l.from], V[l.to], rot, C, R) };
  }).filter((p) => p.d && (!focus || !p.cls.includes("rest") || fam === "a"));

  const grat = graticule(rot, C, R);

  // a2: the whole field as today's flat disc, small, turned to whatever faces you; the ring is the half you can see.
  const mini = mode === "a2" && !focus ? (() => {
    const r = compact ? 46 : 92, MC: [number, number] = compact ? [W - r - 6, r + 6] : [W - r - 52, H - r - 60];
    const f = frontOf(rot);
    return { MC, r, ring: r * Math.min(RIM, Math.pow(0.5, GAMMA)), dots: field.schools.map((s) => ({ id: s.id, ...project(f, V[s.id], MC, r) })) };
  })() : null;
  // a3 (critic r1): a family's name sits at the middle of its members on the front, only when two or more are there,
  // and gives way to any genre label or dot it would touch; never for the back half.
  const regions: { id: string; name: string; x: number; y: number; ids: Set<string>; vs: Vec3[] }[] = [];
  if ((mode === "a3" || mode === "a4") && !focus) {
    const taken = Object.values(placed).map((p) => p.rect);
    const groups = groupsOf(field)
      .filter((g) => !familyLit || (g.schools.length > 0 && g.schools.every((m) => familyLit.has(m.id))))
      .map((g) => ({ g, on: g.schools.filter((s) => s.id !== focus && P[s.id].z > 0.2) }))
      .filter((x) => x.on.length >= 2)
      .sort((a, b) => b.on.length - a.on.length)
      .slice(0, compact ? 3 : 8);
    for (const { g, on } of groups) {
      const cx = on.reduce((t, s) => t + P[s.id].x, 0) / on.length, cy = on.reduce((t, s) => t + P[s.id].y, 0) / on.length;
      const w = g.name.length * (compact ? 7.5 : 9.6) + 8, h = compact ? 12 : 16;
      const ids = new Set(g.schools.map((s) => s.id));
      // the middle of its members first, then a little above, below or to the side; the first place that touches nothing
      const spot = [[0, 0], [0, -24], [0, 24], [-48, 0], [48, 0], [0, -46], [0, 46]].map(([dx, dy]) => ({ x: cx + dx, y: cy + dy })).find(({ x, y }) => {
        const box = { x: x - w / 2, y: y - h / 2, w, h };
        const hits = (b: Box) => box.x < b.x + b.w + 8 && b.x < box.x + box.w + 8 && box.y < b.y + b.h + 5 && b.y < box.y + box.h + 5;
        return Math.hypot(x - C[0], y - C[1]) < R - w / 2 && !taken.some(hits) && !front.some((s) => hits({ x: P[s.id].x - 6, y: P[s.id].y - 6, w: 12, h: 12 }));
      });
      if (!spot) continue;
      taken.push({ x: spot.x - w / 2, y: spot.y - h / 2, w, h });
      regions.push({ id: g.id, name: g.name, x: spot.x, y: spot.y, ids, vs: g.schools.map((s) => V[s.id]) });
    }
  }

  return (
    <div
      ref={wrap}
      className={["globe", "spin", mode, compact && "compact", lit && "hovering", familyLit && "fam-lit"].filter(Boolean).join(" ")}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
      onKeyDown={onKeyDown}
      tabIndex={inert ? -1 : 0}
      aria-label="The globe. Drag or use the arrow keys to turn it."
    >
      <svg className="threads" aria-hidden="true" width={W} height={H}>
        <defs>
          <radialGradient id={`${idPrefix}-lit`} cx="38%" cy="32%" r="75%">
            <stop offset="0" stopColor="#e9e2d4" stopOpacity=".06" />
            <stop offset=".6" stopColor="#e9e2d4" stopOpacity=".03" />
            <stop offset="1" stopColor="#e9e2d4" stopOpacity="0" />
          </radialGradient>
          <mask id={`${idPrefix}-ko`} maskUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
            <rect width={W} height={H} fill="#fff" />
            {Object.values(placed).map((p, i) => <rect key={i} x={p.rect.x - 4} y={p.rect.y - 2} width={p.rect.w + 8} height={p.rect.h + 4} rx="5" fill="#000" />)}
            {titleKo && <rect x={titleKo.x} y={titleKo.y} width={titleKo.w} height={titleKo.h} rx="14" fill="#000" />}
          </mask>
        </defs>
        <circle cx={C[0]} cy={C[1]} r={R} fill={`url(#${idPrefix}-lit)`} />
        <path className="grat" d={grat} />
        <circle className="rim" cx={C[0]} cy={C[1]} r={R} />
        {(mode === "a1" || mode === "a3" || mode === "a4") && back.map((s) => (
          <circle key={s.id} className={["bk", lit?.has(s.id) && "lit", near.has(s.id) && "near"].filter(Boolean).join(" ")} cx={P[s.id].x} cy={P[s.id].y} r={compact ? 1.4 : 1.8} />
        ))}
        <g mask={`url(#${idPrefix}-ko)`}>
          {paths.map((p) => <path key={p.key} className={p.cls} d={p.d} />)}
        </g>
      </svg>
      {mini && (
        <svg className="mini" aria-hidden="true" width={W} height={H}>
          <circle cx={mini.MC[0]} cy={mini.MC[1]} r={mini.r + 4} className="mbg" />
          <circle cx={mini.MC[0]} cy={mini.MC[1]} r={mini.ring} className="mring" />
          {mini.dots.map((d) => <circle key={d.id} cx={d.x} cy={d.y} r={compact ? 1.3 : 1.8} className={d.theta < 90 ? "md in" : "md"} />)}
        </svg>
      )}
      <main inert={inert}>
        {front.map((s) => {
          const p = P[s.id], st = states.get(s.id), v = st === "started" || st === "explored", pl = placed[s.id], n = near.get(s.id);
          const fade = Math.min(1, p.z / 0.18);
          const cls = ["n", n && "t1", !!focus && !n && "rest", v && "v", st === "explored" && "xp", lit?.has(s.id) && "lit", !pl && "nolabel"].filter(Boolean).join(" ");
          return (
            <button key={s.id} type="button" className={cls} style={{ left: p.x, top: p.y, opacity: fade }} data-id={s.id}
              onClick={() => { setHovered(null); onOpen(s.id); }}
              onMouseEnter={() => setHovered(s.id)} onMouseLeave={() => setHovered((h) => (h === s.id ? null : h))}
              aria-label={`${s.name}${v ? `, ${stateLabel(st, field.words.allSeen)}` : ""}`}
            >
              <i className="dot" style={{ width: 2 * rOf(s.id), height: 2 * rOf(s.id) }} />
              <span className={pl ? "lb placed" : "lb"} aria-hidden="true"
                style={pl ? { left: pl.left, top: pl.top, textAlign: pl.text, alignItems: pl.text === "right" ? "flex-end" : pl.text === "center" ? "center" : "flex-start" } : undefined}
              >
                <b>{label(s.id)}</b>
                {n && <em>{n.verb}</em>}
              </span>
            </button>
          );
        })}
        {rim.map(({ s, x, y, right }) => (
          <button key={s.id} type="button" className="n t1 rimn" style={{ left: x, top: y }} onClick={() => onOpen(s.id)} aria-label={`${s.name}, round the back`}>
            <i className="dot" style={{ width: 8, height: 8 }} />
            <span className="lb placed" aria-hidden="true" style={right ? { left: 12, top: -10 } : { right: 12, left: "auto", top: -10, textAlign: "right", alignItems: "flex-end" }}>
              <b>{label(s.id)}</b>
              <em>{near.get(s.id)!.verb} · round the back</em>
            </span>
          </button>
        ))}
        {regions.map((g) => (
          <button key={g.id} type="button" className={famLit?.id === g.id ? "region on" : "region"} style={{ left: g.x, top: g.y }}
            onClick={() => {
              if (famLit?.id === g.id) { setFamLit(null); return; }
              setFamLit({ id: g.id, ids: g.ids });
              const r = facingRot(centroid(g.vs));
              turn({ yaw: r.yaw, pitch: clampPitch(r.pitch - 0.1) });
            }}
            aria-pressed={famLit?.id === g.id}
          >{g.name}</button>
        ))}
        {children}
      </main>
      <div className="measure" ref={measure} aria-hidden="true">
        {field.schools.map((s) => (
          <span key={s.id} className={near.has(s.id) ? "n t1" : "n"}>
            <span className="lb" data-k={sizeKey(s.id)}><b>{label(s.id)}</b>{near.has(s.id) && <em>{near.get(s.id)!.verb}</em>}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** A: the whole map as a list (the family index), beside the globe. Hover lights a family; a click turns the globe to it. */
export function GlobeIndex({ field, onLight, onTurn, onOpen, states }: {
  field: Field; onLight: (ids: Set<string> | null) => void; onTurn: (v: Vec3) => void; onOpen: (id: string) => void; states: Map<string, SchoolState>;
}) {
  const groups = groupsOf(field);
  const [open, setOpen] = useState<string | null>(null);
  const setOf = (id: string | null) => { const g = groups.find((x) => x.id === id); return g ? new Set(g.schools.map((s) => s.id)) : null; };
  return (
    <nav className="gindex" aria-label="The whole map" onPointerDown={(e) => e.stopPropagation()} onMouseLeave={() => onLight(setOf(open))}>
      <ul>
        {groups.filter((g) => g.schools.length).map((g) => (
          <li key={g.id} className={open === g.id ? "open" : undefined}>
            <button type="button" className="gh" aria-expanded={open === g.id}
              onMouseEnter={() => onLight(new Set(g.schools.map((s) => s.id)))}
              onClick={() => {
                const next = open === g.id ? null : g.id;
                setOpen(next); onLight(setOf(next));
                if (next) onTurn(centroid(g.schools.map((s) => vec(field.positions[s.id]))));
              }}
            >
              <span>{g.name}</span>
            </button>
            {open === g.id && (
              <ul className="gl">
                {g.schools.map((s) => (
                  <li key={s.id}>
                    <button type="button" className={states.get(s.id) && states.get(s.id) !== "new" ? "v" : undefined}
                      onClick={() => onOpen(s.id)}>
                      {splitName(s.name).short}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Prototype only: Flat · A1 A2 A3 (light overview) · B1 B2 B3 (pure spin), in a corner. */
export function GlobeSwitch({ mode, setMode }: { mode: string; setMode: (m: GlobeMode) => void }) {
  return (
    <div className="gswitch" role="radiogroup" aria-label="Globe prototype" onPointerDown={(e) => e.stopPropagation()}>
      {([["flat", "Flat"], ["a1", "A1"], ["a2", "A2"], ["a3", "A3"], ["a4", "A4"], ["b1", "B1"], ["b2", "B2"], ["b3", "B3"]] as const).map(([m, t]) => (
        <button key={m} type="button" role="radio" aria-checked={mode === m} className={mode === m ? "on" : undefined} onClick={() => setMode(m)}>{t}</button>
      ))}
    </div>
  );
}
