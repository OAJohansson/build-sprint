// Where a school sits on screen for any focus. Pure functions, no DOM; lifted from the design's
// _src/layout.mjs (handoff "Where a school sits"). Turn the globe so the focus faces the viewer, then
// flatten the whole sphere onto a disc: distance from the centre grows with the angle from the focus.
import type { LatLon } from "./content";

export type Vec3 = [number, number, number];
export type Projected = { x: number; y: number; theta: number; out: number };

const D = Math.PI / 180;
export const GAMMA = 0.48;
export const RIM = 0.93;
/** Globe radius and centre on the 1440 × 900 stage (handoff "Size"). */
export const R = 410;
export const centre = (hasCard: boolean): [number, number] => [hasCard ? 500 : 720, 456];
/** Threads from the focus fade out inside this oval round the title. */
export const FADE = { rx: 186, ry: 86 };
/** More than this many degrees from the focus = far side. */
export const FAR = 100;

export const vec = ([lat, lon]: LatLon): Vec3 => [
  Math.cos(lat * D) * Math.sin(lon * D),
  Math.sin(lat * D),
  Math.cos(lat * D) * Math.cos(lon * D),
];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

export function project(f: Vec3, v: Vec3, C: [number, number], radius = R): Projected {
  let e = cross([0, 1, 0], f);
  if (Math.hypot(...e) < 1e-3) e = [1, 0, 0];
  e = norm(e);
  const u = cross(f, e);
  const theta = Math.acos(Math.max(-1, Math.min(1, dot(f, v))));
  const a = dot(v, e), b = dot(v, u), l = Math.hypot(a, b) || 1;
  const r = radius * Math.min(RIM, Math.pow(theta / Math.PI, GAMMA));
  return { x: C[0] + (r * a) / l, y: C[1] - (r * b) / l, theta: theta / D, out: Math.atan2(-b, a) / D };
}

/** A thread is the great circle between two schools, sampled and projected the same way. */
export function thread(f: Vec3, a: Vec3, b: Vec3, C: [number, number], radius = R, steps = 28): Projected[] {
  const om = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))), so = Math.sin(om) || 1, pts: Projected[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
    pts.push(project(f, norm([a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]), C, radius));
  }
  return pts;
}

/** With nothing in focus the globe faces its emptiest spot. Seeded, so it is the same every load. */
export function emptiest(vs: Vec3[]): Vec3 {
  let best: Vec3 = [0, 0, 1], bd = -1, s = 7;
  for (let i = 0; i < 4000; i++) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const a = s / 4294967296;
    s = (s * 1664525 + 1013904223) % 4294967296;
    const b = s / 4294967296;
    const v = vec([Math.asin(2 * a - 1) / D, 360 * b - 180]);
    const d = Math.min(...vs.map((x) => Math.acos(Math.max(-1, Math.min(1, dot(x, v))))));
    if (d > bd) { bd = d; best = v; }
  }
  return best;
}

// Costs, highest first (handoff "Where a label sits"). With 23 real schools the field is denser than the
// mockups, so the steps are far apart: a label never overlaps another label, the title, the card, the header
// or the screen edge if any other place exists; then it avoids covering a dot; then poking past the rim
// (critic: flip it to the inner side of its dot); then sitting nearer another school's dot; then threads.
const OVERLAP = 100000;
const COVER_DOT = 20000;
const RIM_COST = 8000;
const NEARER_DOT = 2500;
const NEARER_BRIGHT = 9000;
// Per thread sample under a label (× 14 for a thread from the focus). Lower than the design's 7: threads behind
// a label are knocked out anyway, and keeping each name next to its own dot matters more.
const THREAD = 3;

export type Rect = { x: number; y: number; w: number; h: number };
export type LabelInput = {
  id: string; x: number; y: number; r: number; pref: number; ord: number; w: number; h: number;
};
export type LabelPlace = { left: number; top: number; align: "flex-start" | "flex-end" | "center"; text: "left" | "right" | "center"; rect: Rect };
/** A point along a thread; weight 14 for a thread from the focus. */
export type ThreadPoint = [number, number, number];

/**
 * Greedy label placement (handoff "Where a label sits", from _src/lib.mjs). Each label tries 36 places
 * round its dot, starting pointing away from the centre, and takes the cheapest. Pure: the caller
 * measures label sizes and the fixed rectangles (title, card, header) in the browser.
 */
export function placeLabels(
  nodes: LabelInput[], fixed: Rect[], pts: ThreadPoint[], C: [number, number], radius: number, W: number, H: number,
): Record<string, LabelPlace> {
  const out: Record<string, LabelPlace> = {};
  const hit = (a: Rect, b: Rect, pad: number) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  const cand: [number, number, number][] = [];
  // 64 places: 16 directions (nearest "away from the centre" first) at four distances. The design had 36
  // (12 × 3); 23 schools with longer real names needed the extra room.
  const dirs = [0, ...[22.5, 45, 67.5, 90, 112.5, 135, 157.5].flatMap((d) => [d, -d]), 180];
  // The two far rings are a last resort: a name far from its dot reads as someone else's.
  const ringCost = [0, 9, 18, 40, 1500, 3000];
  [9, 20, 32, 46, 64, 86].forEach((gap, gi) => dirs.forEach((d, i) => cand.push([d, gap, i * 1.5 + ringCost[gi]])));
  type Best = LabelPlace & { cost: number; ci: number };
  const score = (n: LabelInput, ci: number, others: Rect[]): Best => {
    const { w, h } = n;
    const [d, gap, base] = cand[ci];
    {
      const g = n.r + gap;
      const a = ((n.pref + d) * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), ax = n.x + g * c, ay = n.y + g * s;
      const x = c > 0.38 ? ax : c < -0.38 ? ax - w : ax - w / 2, y = s > 0.38 ? ay : s < -0.38 ? ay - h : ay - h / 2;
      const rect = { x, y, w, h };
      let cost = base;
      for (const p of others) if (hit(rect, p, 6)) cost += OVERLAP;
      for (const p of fixed) if (hit(rect, p, 8)) cost += OVERLAP;
      for (const m of nodes) {
        if (m === n) continue;
        const nx = Math.max(x, Math.min(m.x, x + w)), ny = Math.max(y, Math.min(m.y, y + h));
        const dm = Math.hypot(nx - m.x, ny - m.y);
        if (dm < m.r + 8) cost += COVER_DOT;
        // two schools one thread away (dot radius 6) must not seem to swap names (critic (b))
        else if (dm < g + 10) cost += n.r >= 6 && m.r >= 6 ? NEARER_BRIGHT : NEARER_DOT;
      }
      for (const k of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) if (Math.hypot(k[0] - C[0], k[1] - C[1]) > radius - 4) cost += RIM_COST;
      if (x < 8 || y < 8 || x + w > W - 8 || y + h > H - 8) cost += OVERLAP;
      for (const q of pts) if (q[0] > x - 3 && q[0] < x + w + 3 && q[1] > y - 3 && q[1] < y + h + 3) cost += THREAD * q[2];
      return {
        cost, ci, left: x - n.x, top: y - n.y, rect,
        align: c > 0.38 ? "flex-start" : c < -0.38 ? "flex-end" : "center",
        text: c > 0.38 ? "left" : c < -0.38 ? "right" : "center",
      };
    }
  };
  const bestFor = (n: LabelInput, others: Rect[]): Best => {
    let best = score(n, 0, others);
    for (let ci = 1; ci < cand.length; ci++) {
      const b = score(n, ci, others);
      if (b.cost < best.cost) best = b;
    }
    return best;
  };
  // Greedy first (schools one thread away, then by angle from the focus), as in the design ...
  const order = nodes.slice().sort((a, b) => a.ord - b.ord);
  const chosen = new Map<string, Best>();
  for (const n of order) {
    const b = bestFor(n, [...chosen.values()].map((c) => c.rect));
    chosen.set(n.id, b);
  }
  // ... then a few repair rounds: a label still in trouble moves, given where all the others ended up.
  for (let round = 0; round < 4; round++) {
    let moved = false;
    for (const n of order) {
      if (chosen.get(n.id)!.cost < NEARER_DOT) continue;
      const others = order.filter((m) => m !== n).map((m) => chosen.get(m.id)!.rect);
      const now = score(n, chosen.get(n.id)!.ci, others);
      const b = bestFor(n, others);
      if (b.cost < now.cost) { chosen.set(n.id, b); moved = true; } else chosen.set(n.id, now);
    }
    if (!moved) break;
  }
  for (const [id, b] of chosen) out[id] = { left: b.left, top: b.top, align: b.align, text: b.text, rect: b.rect };
  return out;
}

/** Points every ~4 px along a polyline, for the label cost. */
export function samplePolyline(pts: { x: number; y: number }[], weight: number, step = 4): ThreadPoint[] {
  const out: ThreadPoint[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(len / step));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) out.push([a.x + ((b.x - a.x) * k) / n, a.y + ((b.y - a.y) * k) / n, weight]);
  }
  return out;
}
