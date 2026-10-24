// Copy for Claude (F9, US5): the brief's Appendix B template, filled from one stored analysis,
// plus the key confidence, the tag-differs note and, when there is one, a short excerpt of the
// owner's own taste profile (L55: no built-in playlist list).
import { bpmSentence } from "./bpm-choice";
import { brightnessLabel, energyLabel, keyWord, pct, shownStyles, tagDiffers } from "./labels";
import type { EarsAnalysis } from "./results";


/** The first ~400 characters of the taste profile, cut at a sentence or word end. */
export function tasteExcerpt(profile: string | null | undefined, max = 400): string {
  const p = (profile ?? "").replace(/\s+/g, " ").trim();
  if (p.length <= max) return p;
  const cut = p.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return end > max / 2 ? cut.slice(0, end + 1) : `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

export function claudeText(a: EarsAnalysis, profile?: string | null): string {
  // The same styles the card shows (N4): all above 5 %, else the top 3.
  const g = shownStyles(a);
  const genres = g.map((s) => `${s.name} ${pct(s.p)}%`).join(", ") || "none";
  const differs = tagDiffers(a) ? " (differs from the styles heard)" : "";
  const taste = tasteExcerpt(profile);
  return `I analysed this track in Six AM:

Track: ${a.title || "Untitled"} by ${a.uploader || "unknown"}
URL: ${a.soundcloudUrl}
Uploader genre tag: ${a.uploaderGenreTag ?? "none"}${differs} | Tags: ${a.uploaderTags.join(", ") || "none"}
My genre: ${a.myGenre?.trim() || "not set yet"}

Results (${Math.round(a.analysedSeconds)}s analysed${a.preview ? ", 30 s preview only" : ""}):
- Genres (each style's own likelihood): ${genres}
- BPM: ${bpmSentence(a)} | Key: ${a.key} ${a.scale} (${keyWord(a.keyStrength)})
- Energy: ${energyLabel(a.energy)} | Brightness: ${brightnessLabel(a.brightness)}

${taste ? `My taste (from Six AM's profile): ${taste}\n\n` : ""}What genre is this really, and why? How does it fit my taste?
What should I listen for to recognise this style, and how would I start a
track like this in Six AM?`;
}
