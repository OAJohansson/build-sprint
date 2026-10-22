// Selvedge's data, shared by the browser and the server: saves (what I collected) and boards
// (what I made from them), with the checks the API runs on everything it's sent.

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const SOURCES = ["instagram", "pinterest", "gallery", "upload", "web"] as const;
export type Source = (typeof SOURCES)[number];

export type Save = {
  id: string;
  /** Whether there's a picture; a link whose picture couldn't be fetched has none. */
  hasImage: boolean;
  /** Width / height of the picture, or null without one. */
  aspect: number | null;
  link: string | null;
  source: Source;
  title: string | null;
  createdAt: string;
};

/** Where the picture of a save is served (the bucket is private; the server streams it). */
export const imageUrl = (id: string) => `/api/photos?id=${id}`;

export type Piece = {
  id: string;
  kind: "photo" | "swatch" | "title";
  saveId?: string;
  x: number; y: number; w: number; h: number; z: number;
  cropX: number; cropY: number; zoom: number;
  rough: boolean;
  color?: string;
  text?: string;
};
/** A board: its pieces, and the saves picked for it (its tray); older boards have no tray. */
export type BoardDoc = { pieces: Piece[]; tray?: string[] };
export type Board = { id: string; name: string; doc: BoardDoc; updatedAt: string };
export type BoardSummary = Omit<Board, "doc">;

export function cleanName(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const name = v.trim().replace(/\s+/g, " ");
  return name.length >= 1 && name.length <= 80 ? name : null;
}

export function cleanText(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

/** The first http(s) link in some shared text (Instagram and Pinterest put it in `text`). */
export function firstLink(text: string | null): string | null {
  const m = text?.match(/https?:\/\/[^\s<>"]+/i);
  return m ? m[0].replace(/[).,;!?]+$/, "") : null;
}

/** Where a shared link comes from, by its host. */
export function sourceOf(link: string | null, hasFile: boolean): Source {
  if (!link) return hasFile ? "gallery" : "web";
  try {
    const host = new URL(link).hostname;
    if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
    if (/(^|\.)pinterest\.[a-z.]+$|^pin\.it$/.test(host)) return "pinterest";
  } catch {}
  return "web";
}

const num = (v: unknown) => typeof v === "number" && Number.isFinite(v);

/** A board as sent by the browser, checked piece by piece; null if it isn't one. */
export function parseDoc(v: unknown): BoardDoc | null {
  const pieces = (v as { pieces?: unknown } | null)?.pieces;
  if (!Array.isArray(pieces) || pieces.length > 400) return null;
  const out: Piece[] = [];
  for (const p of pieces as Record<string, unknown>[]) {
    if (!p || typeof p.id !== "string" || !["photo", "swatch", "title"].includes(p.kind as string)) return null;
    if (![p.x, p.y, p.w, p.h, p.z, p.cropX, p.cropY, p.zoom].every(num)) return null;
    if (p.kind === "photo" && (typeof p.saveId !== "string" || !UUID.test(p.saveId))) return null;
    out.push({
      id: p.id.slice(0, 40), kind: p.kind as Piece["kind"],
      ...(p.kind === "photo" ? { saveId: p.saveId as string } : {}),
      x: p.x as number, y: p.y as number, w: p.w as number, h: p.h as number, z: p.z as number,
      cropX: p.cropX as number, cropY: p.cropY as number, zoom: p.zoom as number, rough: p.rough === true,
      ...(typeof p.color === "string" && /^#[0-9a-f]{6}$/i.test(p.color) ? { color: p.color } : {}),
      ...(typeof p.text === "string" ? { text: p.text.slice(0, 80) } : {}),
    });
  }
  const trayIn = (v as { tray?: unknown }).tray;
  const tray = Array.isArray(trayIn) ? trayIn.filter((t): t is string => typeof t === "string" && UUID.test(t)).slice(0, 500) : undefined;
  return tray ? { pieces: out, tray } : { pieces: out };
}
