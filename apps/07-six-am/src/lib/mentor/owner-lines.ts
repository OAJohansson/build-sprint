// The lines of the taste profile the person wrote themselves (M9: their words win), found from the
// profile's history: sentences their own edits added that are still in the profile. Setup and
// learning must keep each one word for word. Also: which hand edit is a real "recent edit" worth
// passing to prompts (F6), as opposed to a whole-profile restore or paste. Pure.

export type Note = { at: string; by: "owner" | "mentor"; now?: string; was?: string };

export const sentencesOf = (t: string) =>
  t.split(/(?<=[.!?])\s+|\n+/).map((x) => x.replace(/\s+/g, " ").trim()).filter(Boolean);
const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/** Owner-written sentences still present in the profile, in profile order. Notes' "now" text is
 *  cut at ~320 characters with "…", so a cut last sentence is matched by its start. */
export function ownerLines(profile: string, history: Note[]): string[] {
  const added = history
    .filter((h) => h.by === "owner" && h.now)
    .flatMap((h) => sentencesOf(h.now!))
    .map((s) => (s.endsWith("…") ? { prefix: norm(s.slice(0, -1)) } : { full: norm(s) }));
  if (!added.length) return [];
  return sentencesOf(profile).filter((line) => {
    const n = norm(line);
    return added.some((a) => ("full" in a ? a.full === n : a.prefix.length >= 20 && n.startsWith(a.prefix)));
  });
}

/** The lines a draft dropped (case and spacing ignored). */
export function missingLines(draft: string, lines: readonly string[]): string[] {
  const d = norm(draft);
  return lines.filter((l) => !d.includes(norm(l)));
}

/** The latest hand edit within `days`, as its added lines, when it reads like an edit (a few
 *  sentences) rather than a restore or a paste of the whole profile. */
export function recentEditLines(history: Note[], now: Date, days = 7): string | undefined {
  const edit = [...history].reverse().find((h) => h.by === "owner");
  if (!edit?.now || now.getTime() - Date.parse(edit.at) > days * 86_400_000) return undefined;
  const lines = sentencesOf(edit.now);
  if (lines.length > 3 || !edit.was?.trim()) return undefined;
  return lines.join(" ");
}
