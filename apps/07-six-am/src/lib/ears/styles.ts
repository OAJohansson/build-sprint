// Discogs style names → what the user reads (F5, L19: raw styles only, no family grouping).
// Model classes look like "Electronic---Deep House": parent genre, three dashes, style.

const SEP = "---";
export const UNKNOWN_STYLE = "Unknown style";

/** "Electronic---Deep House" → "Deep House". No separator: the trimmed input. Empty: "Unknown style". */
export function styleDisplayName(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  if (!s) return UNKNOWN_STYLE;
  const i = s.indexOf(SEP);
  if (i < 0) return s;
  const style = s.slice(i + SEP.length).replace(/^-+/, "").trim();
  const parent = s.slice(0, i).trim();
  return style || parent || UNKNOWN_STYLE;
}

/** "Electronic---Deep House" → "Electronic"; null without a parent. */
export function styleParent(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  const i = s.indexOf(SEP);
  const parent = i > 0 ? s.slice(0, i).trim() : "";
  return parent || null;
}

/**
 * Display names for a list shown together. Discogs reuses 16 style names under two parents
 * (Electronic/Rock "Hardcore", Electronic/Reggae "Dub"…): when two in the same list collide,
 * both get their parent, "Hardcore (Electronic)" and "Hardcore (Rock)".
 */
export function styleLabels(raws: string[]): string[] {
  const names = raws.map(styleDisplayName);
  const count = new Map<string, number>();
  for (const n of names) count.set(n, (count.get(n) ?? 0) + 1);
  return raws.map((raw, i) => {
    const parent = styleParent(raw);
    return (count.get(names[i]) ?? 0) > 1 && parent ? `${names[i]} (${parent})` : names[i];
  });
}

/** Highest probability first; equal probabilities keep a stable, alphabetical order. */
export function rankStyles<T extends { style: string; p: number }>(list: T[]): T[] {
  return [...list].sort((a, b) => b.p - a.p || styleDisplayName(a.style).localeCompare(styleDisplayName(b.style)));
}
