# Eval report: Six AM Phase 5, Make for every layer (13 Nov)

Founder mode v2. Graders never built what they graded. Sandbox only (`ACCESS_CODE=test-code`,
in-memory store). Owner-only checks (by ear) are in the final review, not here.

## What ships

- **Drums in Make:** one Make room with a family switch; three rows (kick, clap & snare, hats)
  copied from the looped section, your own drum synth (4 presets per row, T124 knobs), Suggest per
  row (plus "Try <preset>" when another preset is clearly closer), A/B at matched loudness with the
  original bass under both, a closeness score for the open row, doubtful rows off with a reason and
  Play anyway ↔ Back to off, Save per row to its own Studio lane.
- **FX in Make:** Impact, Downlifter, Noise riser timed to the map's sections, 8 presets (incl.
  Sub drop, Reverse crash), measured ticks or an honest "no clear riser here" with a typical start,
  A/B against "the drop as is", Save to the FX lane. No score for FX (T120).
- **Mentor** knows the open row in Drums and FX.
- **Not shipping:** Melody / chords (L247, moved to the next phase; code behind a flag), Vocals
  (L217).

## Agent-checkable evals (Z1–Z12)

| # | Eval | Bar | Result | Verdict |
| --- | --- | --- | --- | --- |
| Z1 | Drum hits on time | ≥ 90 % found, ≤ 10 % extra, ≤ 10 ms | 95.4 % / 2.7 %, kicks 151/151 within 10 ms (5 real loops, 370 events, 1 held out) | pass |
| Z2 | Drum labels | ≥ 85 % | 87.9 % pooled; one loop 81 % (flammed claps, backlog L244) | pass |
| Z3 | Melody notes | ≥ 70 % | 35–37 % (DSP), 13 % (Basic Pitch) on the real stab loop | **fail → melody moved out (L247)** |
| Z4 | In key and on tempo | ≤ 5 ms | drums 1,152/1,152 ≤ 1 ms; FX impact 0.7 ms, pitched FX on the root | pass |
| Z5 | A/B level | within 1 dB | drums 45/45 within 0.05 LU; FX Mason within 0.1 dB, Lost 73–80 −1.01 dB bed on / −0.96 off | pass, FX borderline (owner's ear) |
| Z6 | Suggest closer | ≥ 3 of 5 | drums 27/27 (independent: kick 6/8, clap 9/9, hats 7/9) | pass |
| Z7 | Save → lane → reload | 5/5 | drums 5/5, FX 5/5; default track creates own lanes, never replaces | pass |
| Z8 | Bass unchanged | yes | golden-hash test; Phase 4 Y4/Y9/Y10 identical | pass |
| Z9 | 0 bytes of the original stored/sent | 0 | 0 across ~12,000 requests, storage and code | pass |
| Z10 | User test ≥ 4/5 per job | ≥ 4 | drums 4/4/5/4/5 (after fixes); FX 4; Mentor 1 → blocker fixed in code, not re-run live (API limit) | pass except Mentor (unverified) |
| Z11 | Design scorecard | 9 target | 8/10 round 2, 7/10 built (16-bar density), polish round C1–C7 since | not re-scored after polish |
| Z12 | Knobs live | ≤ 35 s | 8-bar loops 18.6–21.5 s; 16-bar loops 35–41 s (fill-bound, L232) | pass for ≤ 8 bars |

Guardrails: originals never stored or sent (0); AI keys never in the bundle (0); Ears, Mentor,
map, Studio and Bass Make unbroken (tests + Y4/Y9/Y10); text ≥ 4.5:1 (knob values ~7:1).
Build hygiene: 501 tests, lint clean, `next build` compiles.

## Decision log this phase

L214–L247, T116–T144 in `decisions.md`. Owner calls: L214–L219 (kickoff), L223–L226 (design
picks, doubtful hits, canvas), L245 (try Basic Pitch with a fallback). Biggest PM calls: L216
check passed after one fix round (L230, L231), L232 (16-bar loops vs Z12), L233 (score follows
the open row), L243 (accept pad trade-off), L244 (flam claps to backlog), L247 (melody out per
L245).

## Skipped or not verified

- Listening: whether your drums and FX sound close, and the FX A/B on Lost 73–80 (owner's ear).
- The Mentor in Make after the FN1 fix: unit-tested only; the Anthropic API usage limit was
  reached until 1 Dec, so no live answer.
- A track with a real riser/impact in the original (FX ticks on the positive path).
- Flammed claps (L244), missed pickup kicks (D-R5) in the backlog.
- 66 `shortcut:` notes in `apps/07-six-am/src` list the weak spots.

## Reports

`evals-runs/2026-10-27-make-layers-spike.md`, `2026-10-28-drums-slice.md` (+ re-grade),
`2026-11-12-melody-slice.md`, `2026-11-13-melody-fx.md`, `2026-11-13-melody-basic-pitch.md`;
`user-testing/report-2026-11-12-drums.md`, `report-2026-11-12-fx.md`, `report-2026-11-13-final.md`.
