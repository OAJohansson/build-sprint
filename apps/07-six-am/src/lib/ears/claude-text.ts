// Copy for Claude (F9, US5): the brief's Appendix B template, filled from one stored analysis,
// plus the key confidence, the tag-differs note and the owner's target playlists (so Claude can
// answer "which of my playlists").
import { bpmSentence } from "./bpm-choice";
import { brightnessLabel, energyLabel, keyWord, pct, shownStyles, tagDiffers } from "./labels";
import type { EarsAnalysis } from "./results";

// shortcut: the owner's playlists are fixed from kickoff-source.md Appendix B "Target playlists";
// make them editable in the view if they change often.
export const TARGET_PLAYLISTS: [name: string, rule: string][] = [
  ["Emotive vocal house", "pop/R&B vocal, bittersweet, soft beat"],
  ["High-tech minimal", "dark, hypnotic, twisting synths"],
  ["Melodic house & techno", "cinematic builds, festival sunrise"],
  ["You Are Edging Me", "progressive house, long builds and teases"],
  ["Tech house (groove and shoulders)", "bassline and drums are the star"],
  ["Old banger remixx", "classic house reworks you'd sing along to"],
  ["Pop-club & hard", "camp, vocal-led, pushed harder"],
  ["Hard trance", "hard trance/bounce, 140+ BPM"],
  ["Back to the Warehouse", "raw/soulful deep house, 1992 Chicago/NY club"],
  ["Jazzy house", "soft steady beat, piano, horns"],
  ["The Category Is: SERVE", "ballroom/vogue house"],
  ["Afro house", "afro house"],
  ["drum & basssss", "drum & bass"],
];

export function claudeText(a: EarsAnalysis): string {
  // The same styles the card shows (N4): all above 5 %, else the top 3.
  const g = shownStyles(a);
  const genres = g.map((s) => `${s.name} ${pct(s.p)}%`).join(", ") || "none";
  const differs = tagDiffers(a) ? " (differs from the styles heard)" : "";
  const playlists = TARGET_PLAYLISTS.map(([n, r]) => `${n} (${r})`).join("; ");
  return `I analysed this track in Six AM:

Track: ${a.title || "Untitled"} by ${a.uploader || "unknown"}
URL: ${a.soundcloudUrl}
Uploader genre tag: ${a.uploaderGenreTag ?? "none"}${differs} | Tags: ${a.uploaderTags.join(", ") || "none"}
My genre: ${a.myGenre?.trim() || "not set yet"}

Results (${Math.round(a.analysedSeconds)}s analysed${a.preview ? ", 30 s preview only" : ""}):
- Genres (each style's own likelihood): ${genres}
- BPM: ${bpmSentence(a)} | Key: ${a.key} ${a.scale} (${keyWord(a.keyStrength)})
- Energy: ${energyLabel(a.energy)} | Brightness: ${brightnessLabel(a.brightness)}

My playlists: ${playlists}.

What genre is this really, and why? Which of my playlists should it go in?
What should I listen for to recognise this style, and how would I start a
track like this in Six AM?`;
}
