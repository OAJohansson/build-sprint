// Words and short forms the Analyse view shows for stored numbers. Pure, no React.
import type { TempoRelation } from "./bpm";
import type { EarsAnalysis } from "./results";
import { styleLabels } from "./styles";

const CAMELOT_MINOR: Record<string, string> = {
  "G#": "1A", Ab: "1A", "D#": "2A", Eb: "2A", "A#": "3A", Bb: "3A", F: "4A", C: "5A", G: "6A",
  D: "7A", A: "8A", E: "9A", B: "10A", "F#": "11A", Gb: "11A", "C#": "12A", Db: "12A",
};
const CAMELOT_MAJOR: Record<string, string> = {
  B: "1B", "F#": "2B", Gb: "2B", "C#": "3B", Db: "3B", "G#": "4B", Ab: "4B", "D#": "5B", Eb: "5B",
  "A#": "6B", Bb: "6B", F: "7B", C: "8B", G: "9B", D: "10B", A: "11B", E: "12B",
};

/** DJ wheel code: A minor → "8A". */
export function camelot(key: string, scale: string): string {
  return (scale === "minor" ? CAMELOT_MINOR : CAMELOT_MAJOR)[key] ?? "";
}
/** "8A · A minor" */
export function keyLabel(key: string, scale: string): string {
  const c = camelot(key, scale);
  return c ? `${c} · ${key} ${scale}` : `${key} ${scale}`;
}
// shortcut: key confidence as a word from the Krumhansl correlation alone (≥ 0.6 likely); judge
// against the validation set with data-evals and add the runner-up margin if it misleads.
export function keyWord(strength: number): "likely" | "unsure" {
  return strength >= 0.6 ? "likely" : "unsure";
}

export const energyLabel = (e: number) => (e < 0.4 ? "low" : e < 0.7 ? "mid" : "high");
export const brightnessLabel = (b: number) => (b < 0.4 ? "warm" : b < 0.65 ? "neutral" : "bright");

/** 1 decimal, as the brief asks (US3). */
export const bpmText = (bpm: number) => (bpm > 0 ? bpm.toFixed(1) : "–");

/** Short marker for an ambiguous tempo: what the alternative is relative to the main one. */
export function tempoMarker(relation: TempoRelation): string {
  return relation === "2:1" ? "×2" : relation === "1:2" ? "×½" : relation === "3:2" ? "×1.5" : "×⅔";
}
export function tempoRelationWords(relation: TempoRelation): string {
  return relation === "2:1" ? "double time" : relation === "1:2" ? "half time" : relation === "3:2" ? "a 3:2 feel" : "a 2:3 feel";
}

/** 5:44 */
export function formatDuration(ms: number | null | undefined): string {
  if (!ms || !Number.isFinite(ms) || ms <= 0) return "–";
  const sec = Math.round(ms / 1000);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

/** Whole percent for a 0–1 activation. */
export const pct = (p: number) => Math.round(p * 100);

/** Styles with display names, highest first (names disambiguated within the list). */
export function namedStyles(a: Pick<EarsAnalysis, "genres">): { name: string; p: number }[] {
  const names = styleLabels(a.genres.map((g) => g.style));
  return a.genres.map((g, i) => ({ name: names[i], p: g.p }));
}

/** The styles the detail strip and Copy for Claude list (N4): every one above 5 %, else the top 3. */
export const SHOWN_STYLE_MIN = 0.05;
export function shownStyles(a: Pick<EarsAnalysis, "genres">): { name: string; p: number }[] {
  const all = namedStyles(a);
  const above = all.filter((x) => x.p > SHOWN_STYLE_MIN);
  return above.length ? above : all.slice(0, 3);
}

/** US4: the uploader's genre tag isn't one of the top 3 styles heard. */
export function tagDiffers(a: Pick<EarsAnalysis, "genres" | "uploaderGenreTag">): boolean {
  const tag = a.uploaderGenreTag?.trim().toLowerCase();
  if (!tag) return false;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return !namedStyles(a).slice(0, 3).some((s) => norm(s.name) === norm(tag));
}
