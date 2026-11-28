// Phase 5 prototype (L62): a real globe you spin. Orthographic: turn the sphere by yaw (round the vertical axis) and
// pitch (tilt towards you), then drop z; the front half (z > 0) shows. Pure functions, no DOM.
import type { Vec3 } from "./globe";

export type Rot = { yaw: number; pitch: number };
export type Ortho = { x: number; y: number; z: number };

const MAXP = (85 * Math.PI) / 180;
export const clampPitch = (p: number) => Math.max(-MAXP, Math.min(MAXP, p));

export function rotate([x, y, z]: Vec3, { yaw, pitch }: Rot): Vec3 {
  const ca = Math.cos(yaw), sa = Math.sin(yaw);
  const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return [x1, y * cp - z1 * sp, y * sp + z1 * cp];
}

export function ortho(v: Vec3, rot: Rot, C: [number, number], R: number): Ortho {
  const [x, y, z] = rotate(v, rot);
  return { x: C[0] + R * x, y: C[1] - R * y, z };
}

/** The turn that brings v to the front centre. */
export function facingRot([x, y, z]: Vec3): Rot {
  const yaw = Math.atan2(-x, z);
  return { yaw, pitch: clampPitch(Math.atan2(y, Math.hypot(x, z))) };
}

/** Shortest way round from a to b (yaw wraps). */
export function lerpRot(a: Rot, b: Rot, t: number): Rot {
  let d = (b.yaw - a.yaw) % (2 * Math.PI);
  if (d > Math.PI) d -= 2 * Math.PI;
  if (d < -Math.PI) d += 2 * Math.PI;
  return { yaw: a.yaw + d * t, pitch: a.pitch + (b.pitch - a.pitch) * t };
}

const norm = (v: Vec3): Vec3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** The mean direction of a set of points (the densest side), or the front if they cancel out. */
export function centroid(vs: Vec3[]): Vec3 {
  const s: Vec3 = [0, 0, 0];
  for (const v of vs) { s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; }
  return Math.hypot(...s) < 1e-6 ? [0, 0, 1] : norm(s);
}

/** A great-circle arc from a to b, as SVG path pieces on the front half only. */
export function arcPath(a: Vec3, b: Vec3, rot: Rot, C: [number, number], R: number, steps = 24): string {
  const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const om = Math.acos(dot), so = Math.sin(om) || 1;
  let d = "", on = false;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, k1 = Math.sin((1 - t) * om) / so, k2 = Math.sin(t * om) / so;
    const p = ortho(norm([a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2]), rot, C, R);
    if (p.z > 0.02) { d += `${on ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; on = true; } else on = false;
  }
  return d;
}

/** Faint meridians and parallels, front half only: the cue that the globe turns. */
export function graticule(rot: Rot, C: [number, number], R: number): string {
  const D = Math.PI / 180, out: string[] = [];
  const line = (pts: Vec3[]) => {
    let d = "", on = false;
    for (const v of pts) {
      const p = ortho(v, rot, C, R);
      if (p.z > 0) { d += `${on ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`; on = true; } else on = false;
    }
    if (d) out.push(d);
  };
  for (let lon = 0; lon < 180; lon += 30) {
    const pts: Vec3[] = [];
    for (let t = 0; t <= 360; t += 6) pts.push([Math.cos(t * D) * Math.sin(lon * D), Math.sin(t * D), Math.cos(t * D) * Math.cos(lon * D)]);
    line(pts);
  }
  for (const lat of [-60, -30, 0, 30, 60]) {
    const pts: Vec3[] = [];
    for (let t = 0; t <= 360; t += 6) pts.push([Math.cos(lat * D) * Math.sin(t * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(t * D)]);
    line(pts);
  }
  return out.join("");
}

export type Box = { x: number; y: number; w: number; h: number };
export type SpinLabelIn = { id: string; x: number; y: number; r: number; w: number; h: number; must: boolean };
export type SpinLabel = { left: number; top: number; text: "left" | "right" | "center"; rect: Box };

/**
 * Calm labels for a turning globe: four places round the dot (outward side first), first one that hits nothing wins,
 * otherwise no label (the dot stays and shows its name on hover). Stable from frame to frame, unlike the flat
 * globe's cost search. Nodes come in priority order.
 */
export function placeSpinLabels(nodes: SpinLabelIn[], fixed: Box[], C: [number, number], W: number, H: number): Record<string, SpinLabel> {
  const out: Record<string, SpinLabel> = {};
  const taken: Box[] = [];
  const hit = (a: Box, b: Box, pad: number) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
  for (const n of nodes) {
    const g = n.r + 7;
    const right: SpinLabel = { left: g, top: -n.h / 2, text: "left", rect: { x: n.x + g, y: n.y - n.h / 2, w: n.w, h: n.h } };
    const left: SpinLabel = { left: -g - n.w, top: -n.h / 2, text: "right", rect: { x: n.x - g - n.w, y: n.y - n.h / 2, w: n.w, h: n.h } };
    const above: SpinLabel = { left: -n.w / 2, top: -g - n.h, text: "center", rect: { x: n.x - n.w / 2, y: n.y - g - n.h, w: n.w, h: n.h } };
    const below: SpinLabel = { left: -n.w / 2, top: g, text: "center", rect: { x: n.x - n.w / 2, y: n.y + g, w: n.w, h: n.h } };
    const tries = n.x >= C[0] ? [right, left, above, below] : [left, right, above, below];
    const ok = tries.find((t) =>
      t.rect.x >= 4 && t.rect.y >= 4 && t.rect.x + t.rect.w <= W - 4 && t.rect.y + t.rect.h <= H - 4 &&
      !taken.some((b) => hit(t.rect, b, 4)) &&
      !fixed.some((b) => hit(t.rect, b, 6)) &&
      !nodes.some((m) => m !== n && m.x > t.rect.x - 4 && m.x < t.rect.x + t.rect.w + 4 && m.y > t.rect.y - 4 && m.y < t.rect.y + t.rect.h + 4),
    ) ?? (n.must ? tries[0] : undefined);
    if (ok) { out[n.id] = ok; taken.push(ok.rect); }
  }
  return out;
}
