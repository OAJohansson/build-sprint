// The arrangement map (Phase 3, S1): what Ears measured over a whole track, on its bar grid.
// Numbers only: the audio was heard in the person's browser, in short chunks, and discarded.

export const MAP_VERSION = 1;
export const BEATS_PER_BAR = 4;

/** "section": a change the rules can't name with confidence (N1), rather than a guess. */
export const SECTION_LABELS = ["intro", "build", "drop", "breakdown", "outro", "section"] as const;
export type SectionLabel = (typeof SECTION_LABELS)[number];

/** One section on the grid. Bars are 0-based from the first downbeat; endBar is exclusive. */
export type Section = { label: SectionLabel; startBar: number; endBar: number; startSec: number; endSec: number };

export const LAYERS = ["kick", "bass", "chords", "hats", "vocals"] as const;
export type LayerName = (typeof LAYERS)[number];

/**
 * Per-bar layer activity, 0–1. ESTIMATES, not measurements of separated parts: each is read from
 * frequency bands of the full mix (kick = sub-band pulses on the beats, bass = sustained low end
 * between the kicks, chords = tonal mid range, hats = high-band energy and onsets, vocals =
 * moving tonal energy in the 1–4 kHz range, the roughest of the five). `kind` says so in the data.
 */
export type LayerEstimates = { kind: "estimate"; method: string } & Record<LayerName, number[]>;

/** One bar's numbers as section detection reads them (all 0–1). */
export type BarFeatures = { energy: number } & Record<LayerName, number>;

export type TrackMap = {
  version: typeof MAP_VERSION;
  /** The analysis id: the track's SoundCloud URL. */
  id: string;
  title: string;
  uploader: string;
  durationSec: number;
  /** The bar grid's tempo: Ears' BPM, refined over the whole track (2 decimals). */
  bpm: number;
  /** Where the grid's tempo came from: Ears' reading, and whether the full-track refinement moved it. */
  tempo: { earsBpm: number; refined: boolean; coherence: number };
  key: string;
  scale: string;
  beatsPerBar: typeof BEATS_PER_BAR;
  /** Seconds from the track's start to the first downbeat (bar 1 in the Studio). */
  originSec: number;
  /** How the downbeat was chosen and how clear the choice was (0 = a coin toss, 1 = clear). */
  downbeat: { method: "bar-change"; confidence: number };
  /** Whole bars from the first downbeat to the end. */
  bars: number;
  /** Relative loudness per bar, 0–1 within this track (measured). */
  energy: number[];
  layers: LayerEstimates;
  sections: Section[];
  /** Seconds of audio heard, and the share of the track's length that is. */
  heardSec: number;
  coverage: number;
  mappedAt: string;
  /** Chord ESTIMATES, one per 8 bars from bar 1 (Lab, L165): a name, "" (heard, no clear chord) or
   *  null (not heard yet). Names only, read from the separated parts while the Lab plays. Optional:
   *  older maps have none. */
  chords?: (string | null)[];
};
