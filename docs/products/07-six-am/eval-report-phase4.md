# Eval report: Six AM Lab (Phase 4, Founder v2), 26 Oct 2026

Branch `claude/07-six-am-lab-4c61e0`, one PR. Graders: `user-tester`, `data-evals`, `design-critic`
(one each); builders never graded their own work. Sandbox only (in-memory store, access code
`test-code`); the owner's real Supabase data was checked untouched (journal, 26 Oct).

## What shipped

- **The Lab** (`/map?id=…`): Listen mode (live parts of a streamed SoundCloud track via a separate
  "Six AM Deck" window, hear-only/mute on hover, section loops, a playhead that follows what you
  hear, lanes drawn from what the separated parts play, a chord lane) and the Mentor pinned on the
  timeline; Make mode (your own bass beside the looped original, level-matched A/B, 4 presets × 6
  knobs, gold-tick suggestions, "Describe a bass in words…"), and Save to a personal library.
- **The Studio** with the full lane model: 11 lane types in 7 folding families, add/rename/
  reorder/remove, hear-only/mute on hover, volume/pan, My sounds in the crate dropped onto the
  matching lane, a library block's drawer. Old tracks play exactly as before.

## Agent-checkable evals (Y1–Y10)

| # | Eval | Bar | Result | Evidence |
| --- | --- | --- | --- | --- |
| Y1 | Separation faster than real time | > 1.0, delay a few s | **pass** 3.76× over a full track, 0 late, 5.5 s | `evals-runs/2026-10-26-lab-evals.md` |
| Y2 | Original silent locally | setting true + owner's ear | **pass** (owner, L151) | spike run |
| Y3 | Zero bytes of the original stored or sent | 0 | **pass** 0 (499 requests, all storage, code read) | lab-evals |
| Y4 | Sounds in key and on tempo | 100 %, ≤ 5 ms | **pass** 619/619 synth, 141/141 Studio blocks, ≤ 2 ms; AI 1/1 (capped) | lab-evals |
| Y5 | Library and lane changes survive a reload | 5/5 | **pass** library 5/5, lane edits 7/7, old tracks 301/301 identical | lab-evals re-grade |
| Y6 | Every job ≥ 4/5 (user test) | ≥ 4 | **pass**: 1 = 4, 2 = 4, 3 = 4, 4 = 4, 5a = 4, 5b = 4 (after fixes) | `user-testing/report-2026-10-26-*` |
| Y7 | Design 9/10 (target) | target | Lab 9/10 prototype, **7/10 built**; Studio **8/10** built (see below) | critic |
| Y8 | Loop seamless, playhead true | no gap/click; ≤ 0.5 s | **pass** 4 seams clean; 20 ms live | lab-evals |
| Y9 | A/B level-matched | ≤ 1 dB | **pass** 40/40 offline, live ≤ 0.01 dB | lab-evals re-grade |
| Y10 | Suggest settings closer than the preset | ≥ 3/5 parts | **pass** 2 tracks, 40/40 pairs closer | lab-evals re-grade |

Mentor honesty (B6): pass on every real question: never "I hear", tone questions get "I can't hear
the sound itself; I read measurements…", heard bars preferred over the map's estimate, unheard bars
say "Loop bars X–Y to hear it".

## Guardrails

| Guardrail | Result |
| --- | --- |
| Audio of a streamed original stored, uploaded or sent to any API | **0** |
| AI keys in the browser bundle or responses | **0** |
| Ears, Mentor, map, Studio unbroken; old tracks unchanged | **pass** (schedules identical on seeded old tracks; Analyse and Mentor load) |
| Text ≥ 4.5:1, hit areas ≥ 28 px | **pass** after fixes (measured by the tester) |

## Design (one critic, fixed scorecard)

| Screen | Rounds | Final |
| --- | --- | --- |
| Lab (prototype) | 6 → 7 → 8 → 9 | 9/10 |
| Lab (built) | final pass | 7/10: card too large, header pills, "Your sounds" row; fixed card, fades, ruler and the row (T110); numbered pins and a pill-free header not taken (owner's calls L169, L171, L177) |
| Studio (prototype) | 6 → 8 | 8/10 |
| Studio (built) | final pass | 8/10: drawer knobs, preset picker and crate grouping fixed (T110); one-lane family rows and always-visible mute/solo not taken (owner's L200) |

## User tests (sandbox, simulated, no sound)

S1 3/4 → fixes → 4/4; S2 3 → 3 → 4; S3/S4 4/3 → 4/4; S5 4 → 3 (drag blocker) → 4. Majors found and
fixed: lanes vs separated parts, Deck reopen, card readability, rename after save, A/B below the
fold, **Undo never saved** (since 19 Oct, fixed at the root with tests, L206), **block drag landing
20+ bars off** (L207).

## Owner's checks at the final review

By ear: is a soloed part useful; does "Mine" follow the original's rhythm and feel inspired by it;
do the gold-tick suggestions sound right (Tone and Drive still pin on Acid line and Rubber pluck);
does a library sound sit right in a Studio lane. By eye: Chrome's share picker lists "Six AM Deck"
on the first Play (unseen by agents: screen locked).

## What's weak or skipped

- Chords are unproven (no reference); the map's bar grid is 35–55 ms late (loops still clean).
- Make is bass-only; "Describe a bass in words" loops can't be saved yet.
- Real sub-layers for Bass, Other, Vocals; a 1-bar overlap trims 8 bars off a Studio neighbour (S5-10);
  Filter knob removed (backlog).
- A loop's first pass takes its length plus ~6 s before it plays from memory; jumps outside the
  last 30 s cost ~6 s of catching up.
- No Vercel preview: the account hit its 100 deployments a day; review on a local production build.

## Cost

Reported as a share of the Claude plan (owner, 27 Oct), not in dollars.

| Item | Used |
| --- | --- |
| Claude (PM + squad: 2 design rounds of 10, prototypes, ~14 critic passes, 5 slices, ~10 user tests, 2 eval runs) | about **94 % of that week's plan**, plus about 5 % of the next week for the review fixes (Sub and Weight, closeness test, drums under the A/B, the drawer's way back) |
| Extra cost beyond the plan | **none** (extra usage is off) |
| Mentor and Stable Audio API calls | negligible (Stable Audio: 3 loops) |
| Separation model, Supabase | free |

## Decision log

L143–L213, T81–T115 in `decisions.md`.
