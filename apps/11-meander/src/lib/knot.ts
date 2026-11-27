// The open knot inside a school (L28, P7): one thread per idea, radiating clockwise from 12 o'clock out of a
// plain centre dot. Pure geometry on the 1440 × 900 stage, ported from the prototype's runtime
// (design/skeleton-r4/_src/build.py + build_p7.py). The caller measures the labels and fits them.

/** The knot's centre and thread length on the stage (P7: c = [486, 458], R = 178). */
export const KNOT = { cx: 486, cy: 458, R: 178 };
/** The knot sits left of this x; the first page starts at 908 (P7 `.info`). */
export const KNOT_RIGHT = 880;
/** No label within this many px of the stage's edges. */
export const EDGE = 64;
/** A label is never wider than this (P7 `.idea` max-width). */
export const LABEL_MAX = 238;

// Slightly uneven angles (degrees), lengths and curves, so the knot reads as thread rather than a diagram (P7).
const VARY_A = [0, -5, 4, 0, -4, 5];
const VARY_L = [1.0, 0.88, 1.1, 0.9, 1.08, 0.86];
const VARY_K = [0.16, -0.07, 0.2, -0.13, 0.06, -0.18];

/** Which side of its bead a label hangs: l = to the right, r = to the left, t = above, b = below. */
export type Side = "l" | "r" | "t" | "b";

export type Strand = {
  /** The thread's SVG path, centre to bead. */
  d: string;
  bead: [number, number];
  /** Where the label's anchor edge sits (see `side`). */
  anchor: [number, number];
  side: Side;
  /** The widest the label may be here and still keep out of the edges and the first page. */
  maxW: number;
};

const f1 = (v: number) => v.toFixed(1);

export function knotStrands(n: number, { cx, cy, R } = KNOT): Strand[] {
  return Array.from({ length: n }, (_, i) => {
    const a = ((-90 + (i * 360) / n + VARY_A[i % 6]) * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a), Ri = R * VARY_L[i % 6];
    const x1 = cx + Ri * c, y1 = cy + Ri * s, k = VARY_K[i % 6] * Ri;
    const d = `M${f1(cx)} ${f1(cy)}Q${f1((cx + x1) / 2 - s * k)} ${f1((cy + y1) / 2 + c * k)} ${f1(x1)} ${f1(y1)}`;
    const side: Side = c > 0.3 ? "l" : c < -0.3 ? "r" : s < 0 ? "t" : "b";
    const g = side === "t" || side === "b" ? 10 : 8;
    const ax = cx + (Ri + g) * c, ay = cy + (Ri + g) * s;
    const room = side === "l" ? KNOT_RIGHT - ax : side === "r" ? ax - EDGE : 2 * Math.min(ax - EDGE, KNOT_RIGHT - ax);
    return { d, bead: [x1, y1], anchor: [ax, ay], side, maxW: Math.max(120, Math.min(LABEL_MAX, Math.floor(room))) };
  });
}

/** The CSS transform that hangs a label off its anchor on `side`. */
export const sideTransform: Record<Side, string> = {
  l: "translate(0, -50%)",
  r: "translate(-100%, -50%)",
  t: "translate(-50%, -100%)",
  b: "translate(-50%, 0)",
};
