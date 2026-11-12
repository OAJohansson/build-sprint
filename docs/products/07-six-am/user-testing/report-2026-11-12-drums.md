# User test: Six AM Make drums (Phase 5, slice 1), 2026-11-12

**Persona:** the owner, a club-goer turned bedroom producer, no music theory · **Method:** simulated (agent), laptop window 1440 × 900 (one pass at 1440 × 741) · **Build:** 482c427 on `claude/07-six-am-make-layers-1ed1b6` (app code as at 39194d2), sandbox :3017

## Verdict
"I tap the drop, pick Drums, press Play and 40 seconds later my own kick, clap and hats are sitting under the track. That's magic, and I got all three into the Studio. But once I'm past the kick, the one score barely moves whatever I do to the clap or hats, so I stop trusting the knobs. I'd come back for the kick, and I'd guess at the rest."

## Jobs
| Job (from persona) | Score 1–5 | Why |
| --- | --- | --- |
| M-S1 Make my own drums from a loop I love | 4 | 4 taps, the three rows fill and are readable, and picking a row moves nothing. But the wait is 41.6 s, and two countdowns disagree ("6 s" in the header, "36 s" in the panel) |
| M-S2 Get my kick close to the original | 3 | The kick works: presets, ticks and the Mentor all move the score (81 → 47 → 52). Clap and hats don't: following the hints moves the score by 0–1 point, and knob words often stay the same when the knob moves |
| M-S3 Keep the drums I like and use them | 4 | Saved per row with "✓ saved". All three land on their own lanes and survive a reload. But dropping the clap on the Drums lane does nothing and says nothing, and the auto names are wrong ("Tight kick" for a Deep 909) |
| M-S4 A breakdown with almost no drums | 3 | The "Kick off" row and "Play anyway" are clear. But the reason is only in a tooltip, the Mentor still coaches the off kick, and Play anyway can't be undone |
| M-S5 Bass still works as before | 5 | Same screen, ticks and Mentor as Phase 4. Drums state is kept when I switch back |

## Scenarios
| # | Scenario | Result | Taps / time | Main issue |
| --- | --- | --- | --- | --- |
| M-S1 | Drums from a loop | pass | 4 taps; 41.6 s from Play to ready (16-bar loop), about 1 min in all | Two countdowns that disagree; the Play button jumps sideways (x 950 → 584 → 434 → 591) |
| M-S2 | Kick close to original | struggle | about 12 taps or drags; about 4 min | One score that barely reacts to clap or hats; knob words don't change |
| M-S3 | Save and use in Studio | pass | 13 actions (3 saves, 2 row picks, Studio, 3 drags, 2 "← My sounds", 1 dead drop, 1 reload); about 3 min | A silent dead drop on the Drums lane |
| M-S4 | Breakdown | struggle | 5 taps; 26.2 s wait (8 bars); about 1.5 min | The reason is hover-only; the Mentor contradicts "off"; no undo |
| M-S5 | Bass unchanged | pass | 1 tap; a few seconds | none |

## Findings
| ID | Severity | Where | What happened | Why it matters to the owner | Suggestion | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| U1 | major | M-S2, clap and hats | Closeness was 74 with the clap knobs on the gold ticks and 73 with them at the opposite ends. Hats moved toward the ticks went 79 → 80 → 80. The one score is mostly the kick | I follow the Mentor and nothing happens, so I conclude the knobs or the score are fake | Show a score per row (or highlight the selected row's share), so each row's moves visibly count | 14, 16, 17, 18 |
| U2 | major | M-S4 | The kick is "off". The why ("60 faint marks, probably the bass bleeding through") is only the tooltip on "Play anyway" | I see "off" and don't know whether it's broken or deliberate | Put the reason in a line under the row when it's off | 35 |
| U3 | major | M-S4 | After "Play anyway" the row has no off/"use the reading's call" control | I can't undo a test click; it also changes the score (48 → 55) | Make it a toggle: "Play anyway" ↔ "Back to off" | 37 |
| U4 | minor | M-S4 | The Mentor says "Tune up to F#2, Decay down to 1/8" for a kick that is off | It contradicts the screen | When the row is off, the Mentor explains the off state instead | 35 |
| U5 | minor | M-S2 | Knob words are coarse: Decay reads "1/2" before and after a drag, and the tick also reads "1/2" while the Mentor says "Decay down" | I can't see that I moved, or which way is closer | Show the tick's word only when it differs, or a finer word scale | 10, 12 |
| U6 | minor | M-S1 | Header "filling the loop… 6 s" vs panel "Filling the loop… 36 s" at the same moment; the header one ends at 10 s | Which one do I wait for? | One countdown (the panel's), the header says "filling" only | 05-wait-3s |
| U7 | minor | M-S3 | A clap dropped on the Drums lane does nothing, with no message. The new-lane zone appears at the bottom while dragging | A drop that does nothing feels like a bug | On a refused drop, say "Claps go on their own lane: drop below" or create the lane | 26, 27 |
| U8 | minor | M-S3/M-S2 | Auto names: "Tight kick" saved from Deep 909, "Roomy clap" from a stray Room knob; the kick name didn't follow the preset change to Round 808; the hats tags say "open · 909" under "Closed hats" | My library fills with names that describe the wrong sound | Name from the preset first, the knob words second | 10, 19, 22 |
| U9 | polish | M-S1 | The Play button moves horizontally with the header text | I hunt for Play | Fix Play's position | 01, 03, 05 |
| U10 | polish | M-S1 | The greyed "Suggested" pill is a disabled button after the ticks auto-place | It looks clickable, does nothing | Plain text "Ticks placed" | 06 |
| U11 | polish | M-S3 | The lane label is truncated to "Claps & sn…"; each drop opens the drawer, so I need "← My sounds" again | An extra tap per sound | Keep the list open after a drop from My sounds | 25, 33 |

## Value
- **Earns its place:** three drum rows read from a track I love, in about 40 s, with my own sounds on them and a kick score that reacts. Save per row → Studio lanes works end to end and survives a reload. I'd use this weekly.
- **Doesn't (yet):** closeness for clap and hats (U1), and the Mentor hints for those rows feel decorative. The doubtful-row state without a visible reason (U2).
- **Missing that would bring them back tomorrow:** hearing my three rows play together in the Studio as one "drums from Lost in the Loop" group, plus a quick "how close was I" per row on the saved sound.

## Progress
Today I can see the one closeness number for the current loop and "✓ saved" per row; in the Studio I see the three blocks with the track's name. I can't see per-row closeness, what I changed from the preset, or how close my saved sounds were. The most valuable view to add: a **per-row closeness strip in Make** (Kick 81 · Clap 56 · Hats 73, the selected row highlighted, each rising as I follow its ticks). It lives beside the existing closeness figure and answers "which of my drums is still off, and is this knob helping?".

## Top recommendations
1. Per-row closeness next to the total (U1, and the Progress view).
2. Show the off reason inline and make Play anyway a toggle (U2, U3, U4).
3. One countdown; fix the Play button's position (U6, U9).
4. Refused drop → explain or auto-create the lane (U7, U11).
5. Names from the preset, then knob words; tags match the name (U8, U5).

## Guardrails, measured
- Lowest text contrast in Make → Drums (ready state): send arrow 3.71:1. Small labels ("not yet", "same loudness", "Suggested") 5.56:1; the Mentor panel and tags 6.64:1; "Kick off" / "Play anyway" 6.4:1. Pre-ready knob values (dimmed on purpose until the loop fills) about 2.2:1, the worst case; the knob names then 3.7:1.
- Layout at 1440 × 741: A/B 625–664 px, the save bar from 677 px: A/B and closeness are fully visible (R2 from the re-grade is fixed).
- Hit areas: row buttons 156 × 56, A/B 33 px tall, "Play anyway" 83 × 28, mute/solo 28 × 28 (laptop pointer, fine).
- Time to knobs live: 41.6 s (16-bar default loop), 26.2 s (8-bar breakdown); the bar is ≤ 35 s.
- No audio saved or sent by me. The Studio/sounds API held only the 3 sandbox sounds.

## Method notes
- Sandbox only: the dev server on :3017 (`ACCESS_CODE=test-code`, in-memory). I PUT maps for Lost in the Loop (123.02 BPM, origin 1.407 s, G major, 101 bars) and the Mason Flint remix (126.05 BPM, 0.11 s, G minor, 108 bars); the **section bounds and layer estimates are my approximations**, so "Drop 1" may start with a few kick-less bars. My own Chrome profile (a copy of the grader's, with the model cached), CDP plus Deck auto-select, so the share dialog was skipped. The Deck played aloud on the Mac; `?quiet=1` silenced the Lab's parts, so **A/B and the presets were judged by eye and score, not by ear**. Knobs were moved by real mouse drags.
- I couldn't judge whether my drums sound close by ear, or the Studio playback of the new blocks (not played).
- Testing system suggestion: keep a committed sandbox seed script (maps with real sections for the two eval tracks) in `evals-runs/`, so each tester and grader uses the same sections, not hand-made ones.
