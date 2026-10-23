// Copy for Claude (F9, US5): the brief's Appendix B template, filled from one stored analysis.
import { bpmText, brightnessLabel, energyLabel, namedStyles, pct } from "./labels";
import type { EarsAnalysis } from "./results";

export function claudeText(a: EarsAnalysis): string {
  const g = namedStyles(a).slice(0, 3);
  const genres = g.map((s) => `${s.name} ${pct(s.p)}%`).join(", ") || "none";
  return `I analysed this track in Six AM:

Track: ${a.title || "Untitled"} by ${a.uploader || "unknown"}
URL: ${a.soundcloudUrl}
Uploader genre tag: ${a.uploaderGenreTag ?? "none"} | Tags: ${a.uploaderTags.join(", ") || "none"}

Results (${Math.round(a.analysedSeconds)}s analysed):
- Genres: ${genres}
- BPM: ${bpmText(a.bpm)} | Key: ${a.key} ${a.scale}
- Energy: ${energyLabel(a.energy)} | Brightness: ${brightnessLabel(a.brightness)}

What genre is this really, and why? Which of my playlists should it go in?
What should I listen for to recognise this style, and how would I start a
track like this in Six AM?`;
}
