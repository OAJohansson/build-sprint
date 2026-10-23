// shortcut: dev/grader demo data for /analyse?demo=1, so the full table and strip can be seen
// without tab capture. Titles, uploaders, URLs and tags are the validation set (kickoff-source.md,
// Appendix B); every number and style % is ILLUSTRATIVE, not measured. Remove with the prototypes
// once real results exist to check against.
import type { QueueState } from "@/lib/ears/queue";
import type { EarsAnalysis } from "@/lib/ears/results";
import type { Source } from "./rows";

type Seed = {
  title: string; uploader: string; url: string; ms: number; tag: string | null; tags: string[];
  styles: [string, number][]; bpm: number; alt?: [number, "2:1" | "1:2"]; key: string; scale: "major" | "minor"; ks: number;
  ru: [string, "major" | "minor"]; energy: number; bright: number; preview?: boolean;
};

const E = (s: string) => `Electronic---${s}`;
const SEEDS: Seed[] = [
  { title: "Redemption (Extended Mix)", uploader: "Hard Reset", url: "https://soundcloud.com/hardreset90087/redemption-extended-mix", ms: 453000, tag: "Progressive House", tags: ["Progressive House"],
    styles: [[E("Progressive House"), .46], [E("Trance"), .18], [E("Tech House"), .09], [E("Progressive Trance"), .06], [E("House"), .04]], bpm: 126, key: "A", scale: "minor", ks: .71, ru: ["C", "major"], energy: .64, bright: .52, preview: true },
  { title: "Realize", uploader: "Jaime Soeiro", url: "https://soundcloud.com/jaimesoeiro/knober-jaime-soeiro-realize", ms: 372000, tag: null, tags: [],
    styles: [[E("Tech House"), .41], [E("Minimal"), .27], [E("Deep House"), .12], [E("Deep Techno"), .06], [E("House"), .05]], bpm: 128, key: "G", scale: "minor", ks: .64, ru: ["A#", "major"], energy: .58, bright: .41 },
  { title: "Music Is The Answer (Edit)", uploader: "Retrouve", url: "https://soundcloud.com/retrouve/music-is-the-answer", ms: 341000, tag: "House", tags: ["House"],
    styles: [[E("Deep House"), .48], [E("House"), .31], [E("Garage House"), .09], [E("Soulful House"), .04], [E("Disco"), .03]], bpm: 122, key: "C", scale: "minor", ks: .58, ru: ["D#", "major"], energy: .42, bright: .33 },
  { title: "Lost in The Loop", uploader: "Cărbune Adrian", url: "https://soundcloud.com/carbune/lost-in-the-loop-o-deibys", ms: 292000, tag: "House", tags: ["Electronic", "House", "dance", "piano"],
    styles: [[E("Deep House"), .58], [E("House"), .21], ["Jazz---Nu Jazz", .07], [E("Downtempo"), .06], [E("Lounge"), .04]], bpm: 122, key: "F", scale: "minor", ks: .74, ru: ["G#", "major"], energy: .32, bright: .28 },
  { title: "Work (Edit)", uploader: "Pupa Nas T x FOVOS", url: "https://soundcloud.com/fovosmusic/fovos-work-edit-extended", ms: 238000, tag: "Trance", tags: ["Trance", "hard bounce", "hard trance", "Techno"],
    styles: [[E("Hard Trance"), .44], [E("Hardstyle"), .23], [E("Trance"), .14], [E("Hard House"), .07], [E("Hardcore"), .04]], bpm: 150, key: "E", scale: "minor", ks: .81, ru: ["G", "major"], energy: .9, bright: .74 },
  { title: "What's a Girl to Do (KI/KI Remix)", uploader: "KI/KI", url: "https://soundcloud.com/djlekkerman/kiki-whats-a-girl-to-do-kiki-remix", ms: 320000, tag: "Trance", tags: ["Trance", "Hardtrance", "Hardhouse", "Acid"],
    styles: [[E("Hard Trance"), .39], [E("Acid"), .22], [E("Hard House"), .17], [E("Trance"), .09], [E("Techno"), .05]], bpm: 72.5, alt: [145, "2:1"], key: "B", scale: "minor", ks: .52, ru: ["D", "major"], energy: .86, bright: .7 },
  { title: "What's A Girl To Do (Festival Remix)", uploader: "Dubspinna", url: "https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha", ms: 365000, tag: "Deep House", tags: ["Deep House", "House"],
    styles: [[E("Nu-Disco"), .33], [E("Synth-pop"), .24], [E("Italo-Disco"), .11], [E("Deep House"), .08], [E("Electro"), .05]], bpm: 122, key: "A", scale: "major", ks: .55, ru: ["F#", "minor"], energy: .53, bright: .61 },
  { title: "It Just Won't Do (Remix)", uploader: "Mason Flint", url: "https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix", ms: 344000, tag: "House", tags: ["House", "tech house"],
    styles: [[E("Tech House"), .47], [E("House"), .26], [E("Electro House"), .1], [E("Bass House"), .05], [E("Deep House"), .03]], bpm: 126, key: "G", scale: "major", ks: .66, ru: ["E", "minor"], energy: .71, bright: .58 },
];

function analysis(s: Seed, i: number): EarsAnalysis {
  const plan = s.preview ? [{ startMs: 0, lengthMs: 30000 }] : [1, 2, 3, 4].map((k) => ({ startMs: Math.round((k * s.ms) / 5), lengthMs: 30000 }));
  const swing = [0.06, -0.04, 0.03, -0.05];
  return {
    version: 1, id: s.url, soundcloudUrl: s.url, trackId: null, title: s.title, uploader: s.uploader,
    uploaderGenreTag: s.tag, uploaderTags: s.tags, preview: !!s.preview, durationMs: s.ms,
    analysedSeconds: plan.length * 30, bpm: s.bpm, bpmConfidence: 0.8,
    bpmAlternative: s.alt ? { bpm: s.alt[0], relation: s.alt[1], ratio: 0.9 } : null, bpmAmbiguous: !!s.alt,
    key: s.key, scale: s.scale, keyStrength: s.ks, keyRunnerUp: { key: s.ru[0], scale: s.ru[1], strength: s.ks - 0.08 },
    energy: s.energy, energyDbfs: -40 + s.energy * 35, brightness: s.bright, brightnessHz: Math.round(500 * 2 ** (s.bright * 3)),
    genres: s.styles.map(([style, p]) => ({ style, p })),
    snippetPlan: plan,
    snippets: plan.map((p, k) => {
      const pick = k === 2 && s.styles[1] ? s.styles[1] : s.styles[0];
      return { startMs: p.startMs, lengthMs: p.lengthMs, heardSeconds: 30, topStyle: pick[0], p: Math.max(0.05, Math.round((pick[1] + swing[k]) * 100) / 100), bpm: s.bpm };
    }),
    analysedAt: new Date(Date.UTC(2026, 9, 23, 15, i)).toISOString(),
  };
}

export const DEMO_RESULTS: EarsAnalysis[] = SEEDS.map(analysis);

const now = "2026-10-23T16:00:00.000Z";
const MIKEQ = "https://soundcloud.com/djmikeq/beyonce-alien-superstar-mikeq-x-dj-fade-remix-dirty";
const KOLTER = "https://soundcloud.com/koltercologne/symphony-no-5";
const BLOCKED = "https://soundcloud.com/demo/why-am-i-in-love";

export function demoQueue(listening: boolean): QueueState {
  return {
    version: 1,
    items: [
      { id: MIKEQ, url: MIKEQ, title: "Beyoncé Alien Superstar (MikeQ x DJ Fade Remix)", uploader: "MikeQ", durationMs: 197000,
        status: listening ? "listening" : "queued", progress: listening ? { snippet: 2, of: 4, seconds: 8, snippetSeconds: 30 } : undefined, addedAt: now, updatedAt: now },
      { id: KOLTER, url: KOLTER, title: "Symphony No. 5", uploader: "Kolter", durationMs: 408000, status: "queued", addedAt: now, updatedAt: now },
      { id: BLOCKED, url: BLOCKED, title: "Why Am I In Love", uploader: "B b baaangers", status: "failed", reason: "geo-blocked", message: "This track isn't available in your country.", addedAt: now, updatedAt: now },
    ],
  };
}

export const DEMO_SOURCE: Source = {
  version: 1,
  url: "https://soundcloud.com/demo/sets/b-b-baaangers",
  kind: "set",
  tracks: [
    ...SEEDS.map((s) => ({ url: s.url, title: s.title, uploader: s.uploader, durationMs: s.ms })),
    { url: MIKEQ, title: "Beyoncé Alien Superstar (MikeQ x DJ Fade Remix)", uploader: "MikeQ", durationMs: 197000 },
    { url: KOLTER, title: "Symphony No. 5", uploader: "Kolter", durationMs: 408000 },
    { url: BLOCKED, title: "Why Am I In Love", uploader: "B b baaangers", blocked: true },
    ...["Sample track 12", "Sample track 13", "Sample track 14", "Sample track 15"].map((t, i) => ({ url: `https://soundcloud.com/demo/sample-${12 + i}`, title: t, uploader: "Demo uploader", durationMs: 300000 + i * 17000 })),
    { url: "https://soundcloud.com/demo/sample-blocked", title: "Sample track 16", uploader: "Demo uploader", blocked: true },
  ],
};
