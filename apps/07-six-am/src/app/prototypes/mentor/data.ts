// shortcut: throwaway sample content for the Mentor design prototypes (design session, 24 Oct).
// Tracks are the Ears demo rows (validation set titles; numbers illustrative). Answers are
// hand-written to show the voice and the source rules; links are search or wiki pages that
// resolve, never invented release IDs. Delete with the prototypes.
import { DEMO_RESULTS } from "@/components/analyse/demo";
import { bpmText, brightnessLabel, energyLabel, keyLabel, keyWord, namedStyles, tagDiffers } from "@/lib/ears/labels";
import type { EarsAnalysis } from "@/lib/ears/results";

export type Src = "ears" | "tag" | "web" | "taste" | "general";
export type Link = { label: string; href: string };
export type Sentence = { text: string; src: Src; link?: Link };
export type ListenItem = { artist: string; title: string; href: string; because: Sentence[] };
export type TeachSection = { heading: string; body: Sentence[] };
export type Job = "explain" | "genre" | "teach" | "ear" | "studio" | "listen" | "taste-session" | "groups" | "chat";

export type Answer = {
  id: string;
  job: Job;
  ask: string; // what the owner pressed or typed (their words)
  sentences: Sentence[];
  items?: ListenItem[];
  teach?: TeachSection[];
  more?: boolean;
  cost: number;
  updated?: string;
  accept?: string; // genre suggestion: what Accept would fill into My genre
};

export const SRC_LABEL: Record<Src, string> = {
  ears: "Ears measured",
  tag: "uploader tagged",
  web: "web source",
  taste: "your taste profile",
  general: "general knowledge",
};
export const SRC_SHORT: Record<Src, string> = { ears: "EARS", tag: "TAG", web: "WEB", taste: "TASTE", general: "GENERAL" };

export const JOBS: { id: Job; label: string; hint: string; needsTrack: boolean; secondary?: boolean }[] = [
  { id: "explain", label: "Explain", hint: "what Ears measured, in plain words", needsTrack: true },
  { id: "genre", label: "Suggest genre", hint: "a genre for My genre, one click to accept", needsTrack: true },
  { id: "teach", label: "Teach me a genre", hint: "roots, what to listen for, artists", needsTrack: false },
  { id: "ear", label: "Ear training", hint: "what to listen for in this track", needsTrack: true },
  { id: "studio", label: "Studio start", hint: "tempo, key and loops from the crate", needsTrack: true },
  { id: "listen", label: "Listen next", hint: "music like this, and why", needsTrack: false },
  { id: "taste-session", label: "Taste session", hint: "two snippets: which, and why?", needsTrack: false, secondary: true },
  { id: "groups", label: "Genre groups", hint: "groups among your tagged tracks", needsTrack: false, secondary: true },
];

export const TRACKS = DEMO_RESULTS;
export const findTrack = (title: string | null) => TRACKS.find((t) => t.title === title) ?? null;

const STYLE_WORDS: Record<string, string> = {
  "Tech House": "Around this tempo with that energy is the usual tech-house pocket: drums and bassline up front, any vocal used as a hook rather than a song.",
  "Progressive House": "Progressive house tends to build slowly with long intros and teases, which fits a long extended mix.",
  "Deep House": "Deep house usually sits around 118–124 BPM with a soft, warm sound and space between the parts.",
  "Hard Trance": "Hard trance lives around 140–150 BPM with an offbeat bass and big drops; the speed is the point.",
  "Nu-Disco": "Nu-disco borrows 70s and 80s disco and synth-pop sounds at a relaxed 115–124 BPM.",
};

const lower = (s: string) => s.toLowerCase();

export function explainFor(a: EarsAnalysis): Answer {
  const st = namedStyles(a);
  const [s1, s2] = st;
  const out: Sentence[] = [
    {
      src: "ears",
      text: `Ears measured ${bpmText(a.bpm)} BPM, ${keyWord(a.keyStrength) === "likely" ? "likely" : "possibly"} ${a.key} ${a.scale}, and leans ${lower(s1.name)} (${Math.round(s1.p * 100)}%)${s2 ? ` over ${lower(s2.name)} (${Math.round(s2.p * 100)}%)` : ""}.`,
    },
  ];
  if (a.uploaderGenreTag) {
    out.push({
      src: "tag",
      text: tagDiffers(a)
        ? `The uploader tagged it ${a.uploaderGenreTag}, which doesn't match that lean, so read both as hints rather than a verdict.`
        : `The uploader tagged it ${a.uploaderGenreTag}${a.uploaderTags.length > 1 ? ` (also ${a.uploaderTags.filter((t) => t !== a.uploaderGenreTag).slice(0, 2).join(", ")})` : ""}, which fits what Ears measured.`,
    });
  } else {
    out.push({ src: "ears", text: "There are no uploader tags, so the style rests on Ears' numbers alone." });
  }
  const words = STYLE_WORDS[s1.name];
  if (words) out.push({ src: "general", text: words });
  else out.push({ src: "ears", text: `Energy reads ${energyLabel(a.energy)} and the tone ${brightnessLabel(a.brightness)}.` });
  if (a.title === "It Just Won't Do (Remix)") {
    out.push({
      src: "web",
      text: "It's a remix of Tim Deluxe's 2002 club record with Sam Obernik on vocals, which is why the hook may feel familiar.",
      link: { label: "discogs.com", href: "https://www.discogs.com/search/?q=Tim+Deluxe+It+Just+Won%27t+Do&type=all" },
    });
  }
  return {
    id: `explain-${a.id}`, job: "explain", ask: "Explain this track", sentences: out.slice(0, 4), more: true, cost: 0.02,
    updated: a.myGenre ? `you file vocal-hook ${lower(s1.name)} at ~${Math.round(a.bpm)} BPM under “${a.myGenre}”` : undefined,
  };
}

export function listenFor(a: EarsAnalysis | null): Answer {
  return {
    id: `listen-${a?.id ?? "none"}`, job: "listen", ask: "Listen next", cost: 0.04, more: true,
    sentences: [
      { src: "taste", text: "Your profile says the bassline and drums are what you keep tech house for, so these lean that way." },
    ],
    items: [
      {
        artist: "Chris Lake, Alexis Roberts", title: "Turn Off The Lights",
        href: "https://soundcloud.com/search?q=Chris%20Lake%20Alexis%20Roberts%20Turn%20Off%20The%20Lights",
        because: [
          { src: "tag", text: "the uploader of this remix names Chris Lake as a reference." },
          { src: "web", text: "A vocal hook over a rolling bassline, same 126-ish pocket.", link: { label: "soundcloud.com", href: "https://soundcloud.com/search?q=Chris%20Lake%20Turn%20Off%20The%20Lights" } },
        ],
      },
      {
        artist: "Fisher", title: "Losing It",
        href: "https://soundcloud.com/search?q=Fisher%20Losing%20It",
        because: [
          { src: "taste", text: "the bassline is the star, the way you describe “Tech house”." },
          { src: "web", text: "A 2018 club hit built around one bassline riff.", link: { label: "en.wikipedia.org", href: "https://en.wikipedia.org/wiki/Losing_It_(Fisher_song)" } },
        ],
      },
      {
        artist: "Patrick Topping", title: "Be Sharp Say Nowt",
        href: "https://soundcloud.com/search?q=Patrick%20Topping%20Be%20Sharp%20Say%20Nowt",
        because: [
          { src: "web", text: "it came out on Hot Creations, the label world of Kolter, who's in your queue.", link: { label: "discogs.com", href: "https://www.discogs.com/search/?q=Patrick+Topping+Be+Sharp+Say+Nowt&type=all" } },
        ],
      },
    ],
  };
}

export const TEACH: Answer = {
  id: "teach-ballroom", job: "teach", ask: "Teach me ballroom house", cost: 0.05,
  sentences: [],
  teach: [
    {
      heading: "What it is",
      body: [{ src: "general", text: "House made for vogue battles: choppy, stop-start drums built for dips and spins, usually 125–135 BPM." }],
    },
    {
      heading: "Roots",
      body: [
        { src: "web", text: "It grew out of New York's ballroom scene in the late 80s and 90s.", link: { label: "en.wikipedia.org · Ballroom culture", href: "https://en.wikipedia.org/wiki/Ballroom_culture" } },
        { src: "web", text: "Masters At Work's “The Ha Dance” (1991) gave the scene its signature “Ha” crash.", link: { label: "en.wikipedia.org · Masters at Work", href: "https://en.wikipedia.org/wiki/Masters_at_Work" } },
      ],
    },
    {
      heading: "What to listen for",
      body: [{ src: "general", text: "The “Ha” crash landing where a dancer dips, a commentator's chants, and gaps in the drums that leave room for the floor." }],
    },
    {
      heading: "Artists to start with",
      body: [{ src: "web", text: "MikeQ, Vjuan Allure, Kevin JZ Prodigy.", link: { label: "en.wikipedia.org · MikeQ", href: "https://en.wikipedia.org/wiki/MikeQ" } }],
    },
    {
      heading: "In your library",
      body: [{ src: "tag", text: "“Beyoncé Alien Superstar (MikeQ x DJ Fade Remix)” is in your queue, tagged Ballroom Vogue / House. Once Ears has measured it, Explain can compare." }],
    },
  ],
};

export const COST = { today: 0.14, month: 2.31, count: 12 };
export const COST_WARN = { today: 1.02, month: 6.4, count: 50 };
export const money = (n: number) => `$${n.toFixed(2)}`;
export const MONTH = "Oct";

export function canned(job: Job, a: EarsAnalysis | null, typed?: string): Answer {
  if (job === "chat") {
    return {
      id: `chat-${Date.now()}`, job, ask: typed ?? "", cost: 0.02, more: true,
      sentences: [{ src: "general", text: "Good question. Based only on the numbers and tags here, I can't be sure; Tell me more and I'll check the web for what others say." }],
    };
  }
  if (job === "explain" && a) return explainFor(a);
  if (job === "listen") return listenFor(a);
  if (job === "teach") return TEACH;
  if (job === "genre" && a) {
    const s1 = namedStyles(a)[0];
    return {
      id: `genre-${a.id}`, job, ask: "Suggest genre", cost: 0.02, accept: s1.name,
      sentences: [
        { src: "ears", text: `My best guess is ${s1.name}: Ears leans that way at ${Math.round(s1.p * 100)}%.` },
        { src: "taste", text: "It's also the closest of the genre words you already use." },
      ],
    };
  }
  if (job === "studio" && a) {
    return {
      id: `studio-${a.id}`, job, ask: "Studio start", cost: 0.02, more: true,
      sentences: [
        { src: "ears", text: `Start at ${bpmText(a.bpm)} BPM; Ears reads the key as ${keyLabel(a.key, a.scale)}, while the crate is in A minor, so it won't match by ear.` },
        { src: "general", text: "Try Four to the Floor, Rubber Bass and Vocal Chop from the crate for a groove-first start." },
      ],
    };
  }
  if (job === "ear" && a) {
    return {
      id: `ear-${a.id}`, job, ask: "Ear training", cost: 0.02, more: true,
      sentences: [
        { src: "general", text: "Listen for the bass first: does it move between notes like a melody, or hold one note and pump?" },
        { src: "ears", text: "Ears' snippets agree at the start and end of the track and drift in the middle, so check what changes there." },
      ],
    };
  }
  if (job === "taste-session") {
    return {
      id: `taste-${Date.now()}`, job, ask: "Taste session", cost: 0.01,
      sentences: [{ src: "general", text: "Two 20-second snippets from your library: A is “Music Is The Answer (Edit)”, B is “Lost in The Loop”. Which do you prefer, and why? Say it in your own words." }],
    };
  }
  return {
    id: `${job}-x`, job, ask: JOBS.find((j) => j.id === job)?.label ?? job, cost: 0.02,
    sentences: [{ src: "general", text: job === "groups" ? "Tag at least 6 tracks with My genre and I'll propose groups with a reason for each. You have 4 tagged." : "Pick a track first: this one needs what Ears measured." }],
  };
}
