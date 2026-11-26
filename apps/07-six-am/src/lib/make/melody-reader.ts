// L247: Melody moves to the next phase (the real-track grade, evals-runs/2026-11-13-melody-basic-pitch.md).
// One flag: off, the Melody tab shows the quiet "comes next" line, no melody read runs and no melody grader
// hooks are set. The code (DSP reader, poly synth, rows, Suggest, save) stays for the next phase; the poly
// synth also plays any melody block already saved to a Studio. The Basic Pitch try (L245) is in commit bf7164c.
// Phase 6 slice 1 (K1): on again. The Melody tab reads the chords with reader A (chords-read.ts), not
// this note reader; Bass, Drums and FX are untouched by the flag.
export const MELODY_ON = true;

// Phase 6 spike: which note reader the Melody tab's read uses. "dsp": notes-read.ts; "basic-pitch":
// Spotify's Basic Pitch in the worker (notes-bp.ts, BP-1 fixed), DSP only if the model can't load. The
// chord readers A and B are picked per call by the grader hook (window.__sixamLab.chordsRead), not here;
// the spike's grade picks the winner for slice 1.
export const MELODY_READER: "dsp" | "basic-pitch" = "dsp";
