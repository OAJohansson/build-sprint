// Session list export (F8, US7): CSV and JSON of the stored measurements. Never audio.
import { bpmChoice, bpmSentence } from "./bpm-choice";
import { camelot, namedStyles, pct } from "./labels";
import type { EarsAnalysis } from "./results";

const COLUMNS = [
  "title", "uploader", "url", "uploader_genre_tag", "uploader_tags", "preview", "analysed_seconds",
  "bpm", "bpm_alternative", "bpm_ambiguous", "key", "scale", "camelot", "key_strength",
  "energy", "brightness", "style_1", "p_1", "style_2", "p_2", "style_3", "p_3", "analysed_at",
  // Appended (older columns keep their place): the BPM as the view words it, and what Set Studio uses.
  "bpm_display", "bpm_studio",
] as const;

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(list: EarsAnalysis[]): string {
  const rows = list.map((a) => {
    const g = namedStyles(a);
    return [
      a.title, a.uploader, a.soundcloudUrl, a.uploaderGenreTag ?? "", a.uploaderTags.join("; "), a.preview, a.analysedSeconds,
      a.bpm.toFixed(1), a.bpmAlternative ? a.bpmAlternative.bpm.toFixed(1) : "", a.bpmAmbiguous, a.key, a.scale, camelot(a.key, a.scale), a.keyStrength,
      a.energy, a.brightness, g[0]?.name ?? "", g[0] ? pct(g[0].p) : "", g[1]?.name ?? "", g[1] ? pct(g[1].p) : "", g[2]?.name ?? "", g[2] ? pct(g[2].p) : "", a.analysedAt,
      bpmSentence(a), bpmChoice(a).studio.toFixed(1),
    ].map(cell).join(",");
  });
  return [COLUMNS.join(","), ...rows].join("\n") + "\n";
}

export function toJson(list: EarsAnalysis[]): string {
  return JSON.stringify({ app: "Six AM · Ears v1", exportedAt: new Date().toISOString(), analyses: list }, null, 2);
}

/** Hand a text file to the browser's download (generated here, from numbers only). */
export function saveFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
