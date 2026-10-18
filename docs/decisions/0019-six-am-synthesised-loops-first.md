# 0019 — Six AM: synthesised loops first, samples later

- **Date:** 2026-10-18
- **Status:** accepted

## Context

Six AM's main screen works but makes no sound. The brief planned a curated crate of CC0 samples,
which needs a Freesound account and API key (the owner's to create), a licence check and download
per sound, and picking or stretching each one to 124 BPM and one key. That is a day of curation
before the owner hears a single track, and the riskiest assumption (does arranging loops here feel
like making music?) stays untested meanwhile.

## Decision

Make every loop in the browser with synthesis (Tone.js on the Web Audio API): each loop is a
recipe, an instrument plus a 16-step pattern, played on the audio clock at 124 BPM in A minor.
Drums, basslines, stabs, pads and risers are the sounds house was born on (TR-909, TB-303), so
synthesis is authentic, not a placeholder. Samples from Freesound replace or join them later.

## Alternatives considered

- **Freesound CC0 samples now:** the richest sound, but owner setup, licence checks and curation
  first; tempo and key need matching.
- **The owner downloads free sample packs:** most packs forbid redistributing the files inside an
  app, so they can't ship.

## Consequences

- Sound today, always in time and in key, no files, no licences, no backend.
- Real-instrument sounds (vocal chop, organ, strings) are stand-ins and will sound synthetic.
- The waveforms can be rendered from the real synth output instead of drawn.
- Revisit when the crate needs sounds synthesis can't make; the loop recipe becomes "a sample or
  a synth patch", so the timeline and scheduling stay the same.
