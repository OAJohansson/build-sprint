// shortcut: prototype sample data for the Analyse view design session (Ears v1). Track titles,
// uploaders, URLs and uploader tags come from the validation set (kickoff-source.md, Appendix B);
// every number and every style % is ILLUSTRATIVE, not measured. Delete with the prototype surface.

export type Style = { name: string; p: number };
export type Row = {
  id: string;
  title: string;
  uploader: string;
  url: string;
  length: string;
  uploaderTag: string | null;
  tags: string[];
  status: "done" | "analysing" | "ready" | "preview" | "blocked";
  analysedSeconds?: number;
  styles?: Style[];
  bpm?: number;
  halfDouble?: boolean;
  key?: string;
  scale?: "major" | "minor";
  energy?: number; // 0..1
  brightness?: number; // 0..1
};

export const PLAYLIST = { name: "B b baaangers", count: 56, url: "https://soundcloud.com/andreas-johansson-303905204/sets/b-b-baaangers" };

export const ROWS: Row[] = [
  { id: "1", title: "Redemption (Extended Mix)", uploader: "Hard Reset", url: "https://soundcloud.com/hardreset90087/redemption-extended-mix", length: "7:33", uploaderTag: "Progressive House", tags: ["Progressive House"], status: "done", analysedSeconds: 60,
    styles: [{ name: "Progressive House", p: 46 }, { name: "Trance", p: 18 }, { name: "Tech House", p: 9 }], bpm: 126.0, key: "A", scale: "minor", energy: 0.64, brightness: 0.52 },
  { id: "2", title: "Realize", uploader: "Jaime Soeiro", url: "https://soundcloud.com/jaimesoeiro/knober-jaime-soeiro-realize", length: "6:12", uploaderTag: null, tags: [], status: "done", analysedSeconds: 60,
    styles: [{ name: "Tech House", p: 41 }, { name: "Minimal", p: 27 }, { name: "Deep House", p: 12 }], bpm: 128.0, key: "G", scale: "minor", energy: 0.58, brightness: 0.41 },
  { id: "3", title: "Symphony No. 5", uploader: "Kolter", url: "https://soundcloud.com/koltercologne/symphony-no-5", length: "6:48", uploaderTag: null, tags: [], status: "done", analysedSeconds: 60,
    styles: [{ name: "Tech House", p: 52 }, { name: "House", p: 19 }, { name: "Minimal", p: 8 }], bpm: 127.0, key: "D", scale: "minor", energy: 0.68, brightness: 0.47 },
  { id: "4", title: "Music Is The Answer (Edit)", uploader: "Retrouve", url: "https://soundcloud.com/retrouve/music-is-the-answer", length: "5:41", uploaderTag: "House", tags: ["House"], status: "done", analysedSeconds: 60,
    styles: [{ name: "Deep House", p: 48 }, { name: "House", p: 31 }, { name: "Garage House", p: 9 }], bpm: 122.0, key: "C", scale: "minor", energy: 0.42, brightness: 0.33 },
  { id: "5", title: "Lost in The Loop", uploader: "Cărbune Adrian", url: "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys", length: "4:52", uploaderTag: "House", tags: ["Electronic", "House", "dance", "piano"], status: "done", analysedSeconds: 60,
    styles: [{ name: "Deep House", p: 58 }, { name: "House", p: 21 }, { name: "Nu Jazz", p: 7 }], bpm: 122.0, key: "F", scale: "minor", energy: 0.32, brightness: 0.28 },
  { id: "6", title: "Work (Edit)", uploader: "Pupa Nas T x FOVOS", url: "https://soundcloud.com/fovosmusic/fovos-work-edit-extended", length: "3:58", uploaderTag: "Trance", tags: ["Trance", "hard bounce", "hard trance", "Techno"], status: "done", analysedSeconds: 60,
    styles: [{ name: "Hard Trance", p: 44 }, { name: "Hardstyle", p: 23 }, { name: "Trance", p: 14 }], bpm: 150.0, key: "E", scale: "minor", energy: 0.9, brightness: 0.74 },
  { id: "7", title: "What's a Girl to Do (KI/KI Remix)", uploader: "KI/KI", url: "https://soundcloud.com/djlekkerman/kiki-whats-a-girl-to-do-kiki-remix", length: "5:20", uploaderTag: "Trance", tags: ["Trance", "Hardtrance", "Hardhouse", "Acid"], status: "done", analysedSeconds: 60,
    styles: [{ name: "Hard Trance", p: 39 }, { name: "Acid", p: 22 }, { name: "Hard House", p: 17 }], bpm: 72.5, halfDouble: true, key: "B", scale: "minor", energy: 0.86, brightness: 0.7 },
  { id: "8", title: "What's A Girl To Do (Festival Remix)", uploader: "Dubspinna", url: "https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha", length: "6:05", uploaderTag: "Deep House", tags: ["Deep House", "House"], status: "done", analysedSeconds: 60,
    styles: [{ name: "Nu-Disco", p: 33 }, { name: "Deep House", p: 24 }, { name: "Synth-pop", p: 11 }], bpm: 122.0, key: "A", scale: "major", energy: 0.53, brightness: 0.61 },
  { id: "9", title: "It Just Won't Do (Remix)", uploader: "Mason Flint", url: "https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix", length: "5:44", uploaderTag: "House", tags: ["House", "tech house"], status: "preview", analysedSeconds: 30,
    styles: [{ name: "Tech House", p: 47 }, { name: "House", p: 26 }, { name: "Electro House", p: 10 }], bpm: 126.0, key: "G", scale: "major", energy: 0.71, brightness: 0.58 },
  { id: "10", title: "Beyoncé Alien Superstar (MikeQ x DJ Fade Remix)", uploader: "MikeQ", url: "https://soundcloud.com/djmikeq/beyonce-alien-superstar-mikeq-x-dj-fade-remix-dirty", length: "3:17", uploaderTag: "Ballroom Vogue", tags: ["Ballroom Vogue", "House"], status: "analysing" },
];

// A real geo-blocked track from the brief (C1), for the direction that lists the whole playlist.
export const BLOCKED: Row = { id: "11", title: "Why Am I In Love", uploader: "B b baaangers", url: "", length: "", uploaderTag: null, tags: [], status: "blocked" };

export const WINDOW = 60;
export const START_AT = 38;
export const SELECTED = "5";

export const STUDIO_BPM = 124;

export const energyLabel = (e = 0) => (e < 0.4 ? "low" : e < 0.7 ? "mid" : "high");
export const brightLabel = (b = 0) => (b < 0.4 ? "warm" : b < 0.65 ? "neutral" : "bright");
export const keyText = (r: Row) => (r.key ? `${r.key} ${r.scale}` : "");
export const bpmText = (r: Row) => (r.bpm ? r.bpm.toFixed(1) : "");

/** Copy for Claude: the Appendix B template, filled from one row. */
export function claudeText(r: Row) {
  const g = r.styles ?? [];
  return `I analysed this track in Six AM:

Track: ${r.title} by ${r.uploader}
URL: ${r.url}
Uploader genre tag: ${r.uploaderTag ?? "none"} | Tags: ${r.tags.join(", ") || "none"}

Results (${r.analysedSeconds}s analysed):
- Genres: ${g.map((s) => `${s.name} ${s.p}%`).join(", ")}
- BPM: ${bpmText(r)} | Key: ${keyText(r)}
- Energy: ${energyLabel(r.energy)} | Brightness: ${brightLabel(r.brightness)}

What genre is this really, and why? Which of my playlists should it go in?
What should I listen for to recognise this style, and how would I start a
track like this in Six AM?`;
}

/** The uploader's genre tag isn't among the top 3 styles the audio suggests (US4). */
export const tagMismatch = (r: Row) =>
  !!r.uploaderTag && !!r.styles && !r.styles.some((x) => x.name.toLowerCase() === r.uploaderTag!.toLowerCase());
