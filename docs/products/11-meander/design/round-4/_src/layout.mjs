// How a school's place on screen is computed for any focus. Pure functions, no DOM: the engineer can lift this file.
const D = Math.PI / 180;
export const vec = ([lat, lon]) => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); };
export const GAMMA = 0.48, RIM = 0.93;
// Turn the globe so `f` faces the viewer, then flatten the whole sphere onto a disc:
// distance from the centre grows with the angle from the focus (theta), the far side ends up near the rim.
export function project(f, v, C, R) {
  let e = cross([0, 1, 0], f); if (Math.hypot(...e) < 1e-3) e = [1, 0, 0]; e = norm(e);
  const u = cross(f, e);
  const theta = Math.acos(Math.max(-1, Math.min(1, dot(f, v))));
  const a = dot(v, e), b = dot(v, u), l = Math.hypot(a, b) || 1;
  const r = R * Math.min(RIM, Math.pow(theta / Math.PI, GAMMA));
  return { x: C[0] + r * a / l, y: C[1] - r * b / l, theta: theta / D, out: Math.atan2(-b, a) / D };
}
// A thread is the great circle between two schools, sampled and projected the same way.
export function thread(f, a, b, C, R, steps = 28) {
  const om = Math.acos(Math.max(-1, Math.min(1, dot(a, b)))), so = Math.sin(om) || 1, pts = [];
  for (let i = 0; i <= steps; i++) { const t = i / steps, k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
    pts.push(project(f, norm([a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]), C, R)); }
  return pts;
}
// With nothing in focus (first visit, whole field) the globe faces its emptiest spot, so no school sits under the welcome line.
export function emptiest(vs) {
  let best = null, bd = -1, s = 7;
  for (let i = 0; i < 4000; i++) { s = (s * 1664525 + 1013904223) % 4294967296; const a = s / 4294967296; s = (s * 1664525 + 1013904223) % 4294967296; const b = s / 4294967296;
    const v = vec([Math.asin(2 * a - 1) / D, 360 * b - 180]); const d = Math.min(...vs.map(x => Math.acos(dot(x, v)))); if (d > bd) { bd = d; best = v; } }
  return best;
}
