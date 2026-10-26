// The bass and chord synth presets and their three knobs (A6), with a plain-words explanation of
// every knob on every preset (A7: the Mentor reads these). Pure data, no audio here; the sound
// itself is built from these numbers in engine.ts.

export type SynthKind = "bass" | "chords";
export type BassPresetId = "sub" | "acid" | "reese";
export type ChordPresetId = "organ" | "rhodes" | "pad";
export type PresetId = BassPresetId | ChordPresetId;
export type KnobId = "cutoff" | "resonance" | "envelope";
export type KnobValues = Record<KnobId, number>;

export type KnobSpec = {
  id: KnobId;
  /** What the knob says on the panel (the envelope knob is named for what it shapes on this preset). */
  label: string;
  min: number;
  max: number;
  default: number;
  unit: "Hz" | "Q" | "s";
  /** "log" knobs (frequencies, times) move by ratio, so the middle of the knob is the geometric middle. */
  curve: "log" | "linear";
  /** One or two plain sentences: what turning it does on this preset (A7). */
  explain: string;
};

export type Preset = {
  id: PresetId;
  kind: SynthKind;
  name: string;
  /** One line: what it is and where it comes from. */
  about: string;
  knobs: [KnobSpec, KnobSpec, KnobSpec];
  /** Seconds from a note's start to its full level: graders measure onsets with this in mind. */
  attack: number;
};

/** What each knob means on any synth, before the preset-specific notes. */
export const KNOB_BASICS: Record<KnobId, string> = {
  cutoff: "Cutoff sets how much of the sound's top end gets through the filter: low is dark and muffled, high is bright and buzzy.",
  resonance: "Resonance boosts the frequencies right at the cutoff, so the filter starts to 'sing' or whistle; a little adds bite, a lot sounds squelchy.",
  envelope: "The envelope shapes each note over time: how fast it fades (decay) or how long it hangs on after the key is let go (release).",
};

const knob = (id: KnobId, label: string, min: number, max: number, def: number, unit: KnobSpec["unit"], explain: string): KnobSpec => ({
  id, label, min, max, default: def, unit, curve: id === "resonance" ? "linear" : "log", explain,
});

export const PRESETS: Record<PresetId, Preset> = {
  sub: {
    id: "sub", kind: "bass", name: "Sub", attack: 0.004,
    about: "A round, deep bass from a triangle wave, filtered until it is nearly a pure sine: the bass you feel more than hear.",
    knobs: [
      knob("cutoff", "Cutoff", 60, 1200, 220, "Hz", "Low keeps it a clean sine you feel in the chest; turning it up lets the triangle's edge through, so it cuts through on small speakers."),
      knob("resonance", "Resonance", 0.5, 6, 0.7, "Q", "Keep it low on a sub: resonance here adds a slight hump near the cutoff that can make some notes boom louder than others."),
      knob("envelope", "Decay", 0.08, 1.5, 0.6, "s", "How quickly each note fades: short gives tight, punchy subs between the kicks; long lets notes ring into each other like a held bassline."),
    ],
  },
  acid: {
    id: "acid", kind: "bass", name: "303 Acid", attack: 0.003,
    about: "A Roland TB-303-style line: a sawtooth through a resonant filter that snaps open on every note, with accents and slides. Chicago acid house, 1987.",
    knobs: [
      knob("cutoff", "Cutoff", 80, 3000, 420, "Hz", "Where the filter sits between notes: low is a muffled, rubbery bubble, high is a bright scream. For a brighter acid line in the drop, add it again as a second sound with a higher cutoff."),
      knob("resonance", "Resonance", 1, 22, 12, "Q", "The squelch. High resonance makes the filter whistle as it sweeps on each note; it is what makes a 303 sound 'acid'."),
      knob("envelope", "Decay", 0.04, 1, 0.22, "s", "How long the filter stays open after each note hits: short is plucky and tight, long is a wide 'wow' on every step. Accented notes open further."),
    ],
  },
  reese: {
    id: "reese", kind: "bass", name: "Reese", attack: 0.008,
    about: "Detuned sawtooths beating against each other, so the bass moves and growls even on one long note. Named after Kevin 'Reese' Saunderson's 1988 track.",
    knobs: [
      knob("cutoff", "Cutoff", 80, 4000, 700, "Hz", "Low gives a dark, rolling rumble under the beat; higher brings out the gritty, phasing growl of the detuned saws."),
      knob("resonance", "Resonance", 0.5, 10, 1.5, "Q", "Adds a nasal, vocal edge where the filter sits. A touch makes it talk; a lot gets harsh, because the detuned saws already fill that range."),
      knob("envelope", "Decay", 0.1, 2, 0.8, "s", "How long the filter takes to close after each note: short makes each note bark and settle, long keeps the growl open the whole note."),
    ],
  },
  organ: {
    id: "organ", kind: "chords", name: "M1 Organ", attack: 0.003,
    about: "The Korg M1 'Organ 2' stab: a short, bright, hollow chord hit, the sound of early-'90s house piano and organ riffs (Robin S, Crystal Waters).",
    knobs: [
      knob("cutoff", "Cutoff", 300, 12000, 4200, "Hz", "High keeps the classic bright, cutting stab; lower makes it rounder and more muted, sitting behind the drums instead of on top."),
      knob("resonance", "Resonance", 0.5, 8, 0.8, "Q", "Adds a honk at the cutoff. Small amounts give the stab a 'wah' colour; usually you leave it low on an organ."),
      knob("envelope", "Decay", 0.06, 1.2, 0.3, "s", "How long each stab rings: short is a tight, percussive hit that leaves room for the groove; long turns it into held chords."),
    ],
  },
  rhodes: {
    id: "rhodes", kind: "chords", name: "Rhodes", attack: 0.003,
    about: "An electric piano made with FM synthesis (like the DX7's E.Piano): a soft bell at the start of each note that mellows out. Deep house's warm chords.",
    knobs: [
      knob("cutoff", "Cutoff", 400, 12000, 5000, "Hz", "Lower is a warm, woolly late-night Rhodes; higher keeps the bell-like 'tine' at the start of each note bright and clear."),
      knob("resonance", "Resonance", 0.5, 8, 0.7, "Q", "Adds a hollow, resonant tone where the filter sits. Mostly for effect: a real Rhodes has no filter, so leave it low for a natural sound."),
      knob("envelope", "Decay", 0.2, 3, 1.1, "s", "How long the notes and their bell take to die away: short sounds like lightly tapped keys, long like chords left ringing with the sustain pedal."),
    ],
  },
  pad: {
    id: "pad", kind: "chords", name: "Pad", attack: 0.25,
    about: "A soft, wide pad from detuned sawtooths that fades in and hangs on: the sustained chords behind a breakdown or a sunrise intro.",
    knobs: [
      knob("cutoff", "Cutoff", 200, 8000, 1400, "Hz", "Low is a dark, distant wash that leaves space for the bass and vocal; high is bright and lush, filling the whole picture."),
      knob("resonance", "Resonance", 0.5, 8, 1, "Q", "A little adds shimmer at the cutoff; sweeping cutoff with high resonance gives the pad a slow, breathing movement."),
      knob("envelope", "Release", 0.3, 5, 1.8, "s", "How long each chord hangs on after it ends: short changes chords cleanly, long lets them blur into each other like a reverb tail."),
    ],
  },
};

export const BASS_PRESETS: BassPresetId[] = ["sub", "acid", "reese"];
export const CHORD_PRESETS: ChordPresetId[] = ["organ", "rhodes", "pad"];

export function defaultKnobs(preset: PresetId): KnobValues {
  const [c, r, e] = PRESETS[preset].knobs;
  return { cutoff: c.default, resonance: r.default, envelope: e.default };
}

/** Any input → knob values inside the preset's ranges; missing or junk values get the default. */
export function clampKnobs(preset: PresetId, values: Partial<Record<KnobId, unknown>> | undefined): KnobValues {
  const out = defaultKnobs(preset);
  for (const k of PRESETS[preset].knobs) {
    const v = values?.[k.id];
    if (typeof v === "number" && Number.isFinite(v)) out[k.id] = Math.min(k.max, Math.max(k.min, v));
  }
  return out;
}

/** Knob position 0–1 ↔ value, following the knob's curve (for the panel later). */
export function knobValue(spec: KnobSpec, position: number): number {
  const p = Math.min(1, Math.max(0, position));
  return spec.curve === "log" ? spec.min * Math.pow(spec.max / spec.min, p) : spec.min + (spec.max - spec.min) * p;
}
export function knobPosition(spec: KnobSpec, value: number): number {
  const v = Math.min(spec.max, Math.max(spec.min, value));
  return spec.curve === "log" ? Math.log(v / spec.min) / Math.log(spec.max / spec.min) : (v - spec.min) / (spec.max - spec.min);
}

/** Plain text for the Mentor's prompt: the preset, then each knob in general and on this preset (A7). */
export function knobGuide(preset: PresetId): string {
  const p = PRESETS[preset];
  return [
    `${p.name} (${p.kind}): ${p.about}`,
    ...p.knobs.map((k) => `- ${k.label} (${k.min}–${k.max} ${k.unit}, default ${k.default}): ${KNOB_BASICS[k.id]} On ${p.name}: ${k.explain}`),
  ].join("\n");
}
