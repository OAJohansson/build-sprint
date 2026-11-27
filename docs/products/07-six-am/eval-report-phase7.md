# Eval report: Six AM Phase 7, Rebuild the song (27 Nov)

Founder mode v2. Graders never built what they graded: `data-evals` (numbers), `user-tester`
(simulated owner), one `design-critic` for the whole phase. Sandbox only (`ACCESS_CODE=test-code`,
in-memory store, AI keys empty, $0 in paid calls). Owner-only checks (by ear) are listed at the
end, not graded here.

PR: https://github.com/OAJohansson/build-sprint/pull/109 · Preview: https://six-bqjzreiwf-mimirswell.vercel.app

## What ships

- **More starting sounds (slice 1).** 120 hand-picked CC0 drum one-shots (Freesound, Sonic Pi),
  20 per row, spread over a variety map of families and dials (L267). Bass has 20 sounds: the 4
  old presets, 13 new synth presets on a richer engine, and 3 real basses (tonejs-instruments,
  CC BY 3.0, credited). A two-column shelf groups sounds by kind. The knobs now change the sound
  clearly (W4). Every file's licence is in `public/kits/LICENSES.md`.
- **Fix drums by ear (slice 2).** Six rows. Open hat, Shaker and Ride start as clearly marked
  "rows to fill by ear" (L268, L287). Tap to add or remove hits (heard, added and taken-out hits
  look different), Mute and Solo, "Copy bar N to every bar", 4 bars at a time with the Mentor
  folded. Edits come back exactly after a reload (L294). Click to jump in Bass, Drums, Melody and
  FX. Listen's "Other" reads "Melody & FX".
- **Lay out the song (slice 3).** "Rebuild this song" opens the original's sections bar for bar as
  empty slots, with gold "has kick" where the original has a part (only measured layers). Fill a
  slot from saved parts (it repeats to the section's end), leave it empty, come back another
  evening. Replaces the Phase 3 starter draft.
- **Compare (slice 4).** A Mine / Original switch plays the original from the exact spot you're
  at through the Deck, and back. Only commands and numbers cross to the Deck.
- **Not shipping:** reading open hats, shakers or rides from the track (W5 failed; filled by
  ear); loading your own sample packs (backlog, L266); arrange and export an own track (next).

## Agent-checkable evals (W1–W16)

| # | Eval | Bar | Result | Verdict |
| --- | --- | --- | --- | --- |
| W1 | 20 sounds per row, family, feel word, one line | 7 × 20; every family | 7 × 20; every variety-map family covered | pass |
| W2 | No near-duplicates; spread | no pair within 10 % on both; span ≥ 3× | 0 near pairs; smallest spans 3.12× (bass length), 3.15× (open-hat brightness) | pass |
| W3 | Licences | 100 % CC0 / CC BY with source | 138/138 files (128 CC0, 10 CC BY); 120/120 Freesound pages show CC0 | pass |
| W4 | Knobs audible | brightness ≥ 2×, length ≥ 2×, level ≥ 6 dB, pitch ≥ 5 st | bass 16 new presets: all knobs pass on the eval's brightness measure (L284); drums 118/120 (2 accepted, L283) | pass (see L284) |
| W5 | Open-hat reader on real loops | ≥ 85 % open, ≤ 15 % closed-as-open | 44 % / 31 % on 8 real loops (held out 3/13) | **fail** → reader off (L287) |
| W5b | Closed hat collecting shakers / rides | ≤ 20 % | not agent-gradable | owner's ear |
| W6 | Saved = played; mute / solo never delete | 5/5 loops | 5/5 loops, 20/20 rows; mute/solo 10/10; edits restored exactly (after D7-11, D7-17 fixes) | pass |
| W7 | Rows to fill unmissable | 5/5 | 5/5 | pass |
| W8 | Click to jump, 4 tabs | within one 16th, 5/5 each | 21/21 clicks within 0.5 ms | pass |
| W9 | Rebuild layout and hints | section starts = map 100 %; 0 starter blocks | 24/24 starts; hints 120/120; 240/240 slot wording | pass (on seeded maps; real map at review) |
| W10 | Original from the spot you're at | within 150 ms, 5/5 | 7–12 ms after the bar, 5/5; back to Mine within ~60 ms | pass |
| W11 | Old sounds unchanged | 100 %, suite green | 652/652 tests; 88/88 old renders and 2,000 parseDoc results identical to Phase 6 | pass |
| W12 | Sounds play fast | ≤ 300 ms after first tap | 13–98 ms stopped, 150–173 ms playing (localhost) | pass (preview check at review) |
| W13 | Nothing of the original stored or sent | 0 | 0 binary bodies across every run; Deck messages ≤ 276 B, numbers only | pass |
| W14 | User test ≥ 4/5 per job | ≥ 4 | all jobs ≥ 4 after fixes; first runs had 2–3 on fix-by-ear and the rebuild's way in | pass after fixes |
| W15 | Design scorecard | 9 target | design 9; built shelf 9, drums 8, rebuild 9, compare 9 | at target except drums (8) |
| W16 | "Melody & FX" | yes | yes | pass |

Final regression on 6ec8f77: see `evals-runs/phase7-slice4-data-evals.md` ("Final regression").

## Critic and tester numbers

- Design: 10 directions → owner's 3 (Shelf, Side list, Table) → critic 6 / 6 / 5 → owner's hybrid
  → 8 → 9. Built: shelf 5 → 9, drums 6 → 8, rebuild 9, compare 9.
- User tests (simulated owner): slice 1 find 4, shape 4; slice 2 rows-to-fill 5, add/remove 2 → 4,
  mute 4, jump 3 → 4; slice 3 way in 3 → 4, see 4, fill 5, come back 5; slice 4 compare 5, Deck
  closed 5, whole section 5.

## Guardrails

- C2: 0 bytes of the original stored, uploaded or sent (W13, every slice).
- Old sounds and tracks identical (W11); 652 tests green on the merged branch; build passes.
- $0 paid API calls; sandbox only; no owner data touched.
- Downloads only from the three sources the owner allowed (L271).

## Decision log

L266–L298 and T233–T263 in `decisions.md`. Owner's calls: L266–L270 (kickoff), L271 (downloads),
L276, L278 (design picks), L279 (canvas). Calls to look at: L284 (W4's Wobble measured the eval's
way after the first measure failed), L287 (open-hat reader off), L290 (Mentor folded in Drums),
L294 (edits come back exactly), L297 (Original from the exact spot, not the bar line).

## Skipped or not checked

- Nothing was heard by any agent: the sounds, the knobs' feel and "same bar" by ear are yours.
- Firefox and Safari; phone layouts (not in scope).
- A real exported map for the rebuild hints (seeded curves only, D7-18).
- First-tap timings over the CDN (D7-8), the first Original switch buffers ~1 s (D7-21, accepted).
- Loading your own packs, "Save drums" for all rows, a reader for shakers / rides (backlog).

## Owner's final review checklist

1. Drums and bass on a loop you love: "recognisably the same" now? Do the 120 sounds hold up?
2. Wobble on Click organ, FM glass and Detroit square (L284).
3. Do shakers or rides still pile onto Closed hat (W5b)?
4. Rebuild a real song: are the gold hints right on its sections (D7-18)?
5. Mine / Original: same moment both ways, by ear?
6. First taps feel instant on the preview (D7-8).
7. Carried: one live Mentor answer in Make (after 1 Dec).
