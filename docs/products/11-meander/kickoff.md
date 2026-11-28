# Kickoff pack: Meander, phase 5 (a globe you spin, and the missing genres)

Written by the PM session on 28 Nov 2026 from the owner's kickoff answers (L61–L63).

**Mode:** founder (for phase 5; L61). The globe pick and the canvas sign-off stay with the owner.
**Appetite:** one or two sessions, inside the weekly usage guard (stop new work at 70%)
**Evals:** `evals.md`, section "Phase 5: a globe you spin"

## Problem

The globe flattens the whole sphere onto one disc so every item shows at once (M1). With 49
genres it looks busy, and there is no room for more. The owner wants a real globe you spin:
calmer, more fun to wander, with room for classical, tech house and the backlog genres.

## Who

Sam, as before (`user-testing/persona.md`): curious, visual, wanders a field in small pieces.

## Jobs to be done

1. When I open a field, I want to see where everything sits, so I know where the music I love
   fits. *(Phase 5 tests whether "see it all at once" can become "reach it all in a moment".)*
2. When I'm in one genre, I want to follow where it came from and what grew out of it.
3. New: when I have a free moment, I want wandering the map to feel like play, not reading.

## Riskiest assumption

**Spinning is worth what it hides (value).** A real globe shows only the front half; Munzner's
"no unjustified 3D" says anything hidden is a cost. The bet: spinning is fun enough and calm
enough that finding by spinning beats seeing everything. Owner's call (L62): explore both
"spin with a light overview" (faint back-side dots, the family list as the whole map) and
"pure spin", next to today's flattened globe, and pick from screenshots.

## Success

| Signal | Measure | Bar |
| --- | --- | --- |
| Calmer | Labels on screen at once, music globe | about half of today's |
| Reachable | Any genre from first open | ≤ 2 actions (spin or list click) |
| Fun to wander | Simulated user test, then the owner's own feel | tester prefers it or names no loss; owner picks it |
| Guardrail | Philosophy works on the same globe | yes |

## MVP and stop line

**Slices, in order:**
1. **Prototype:** an orthographic globe (front half shows), drag spins with inertia, a click turns
   a genre to the front; directions A (light overview) and B (pure spin), behind a switch next to
   today's globe, for both fields. Screenshots on laptop and phone. Owner picks.
2. **Build the pick** properly (keyboard, reduced motion, touch, label rules), canvas sign-off first.
3. **Classical** as a ninth family, about 5 periods (Baroque, Classical era, Romantic, modernist,
   minimalism), and the timeline back to about 1600 with the years before 1900 in a compressed
   band (L63).
4. **More genres:** tech house and the other house sub-genres, then the backlog list (regional
   Mexican, cumbia, Latin pop, filmi, J-pop, drill, psychedelic and progressive rock, ragtime,
   swing, Eurodance, trip hop), all through the coverage check M8 first, with independent writers
   and graders as in phase 4.

**Stop line (backlog):** search, Your trail, playback links, philosophy coverage (feedback 49),
the four L58 card items except where the pick settles them (even-angle rings, F1).

**No-gos:** paid API calls; copyrighted audio; a 3D library heavier than the job (plain SVG and
maths first).

## Decisions already made

- Positions stay the real sphere positions from `positions.json`; only the drawing and the
  interaction change.
- Same look and calm as the signed-off globe (brass and bone).

---

# Kickoff pack: Meander, phase 4 (Music, the second map)

Written by the PM session on 27 Nov 2026 from the owner's planning session (L43). The owner
handed over every call for this phase, including the design picks, and reviews only the final
output (L44).

**Mode:** founder (for phase 4 only; L44)
**Appetite:** one working session (a few hours while the owner is away); scope gets cut to fit
**Evals:** `evals.md`, section "Phase 4: Music"

## Problem

Meander's promise is a map you can wander through, whatever the field. Today it covers only
philosophy, so we don't know whether the format is a philosophy app or a way to learn any field.
Every later field (architecture, fashion, political science) and any paid product depends on
that answer.

## Who

The same person as before (Sam, `user-testing/persona.md`), now curious about music: listens a
lot, loves house and electronic music, knows genres by feel but not where they come from or how
they connect.

## Moment of use and jobs to be done

**Moment:** laptop, a free hour, headphones nearby.

1. When I get curious about music history, I want to see the whole family of popular genres at a
   glance, so I know where the music I love fits.
2. When I'm in one genre, I want to see where it came from and what grew out of it, so I can
   follow a thread (disco → house → techno) instead of staying put.
3. When I open a genre, I want a short sourced summary, what to listen for, its key artists and
   a few landmark recordings I can play straight away, so I can hear it, not only read about it.

## Today's alternatives

- Wikipedia genre pages: thorough, but text-first and one genre at a time.
- Ishkur's Guide to Electronic Music: a loved map with sound, but electronic only and dated.
- Streaming playlists: sound, but no history or connections.

## Riskiest assumptions

**Riskiest (value and feasibility): the Meander format travels.** A field built from genres,
artists and recordings fits the same overview → card → deeper pattern and still feels like
wandering, with sourced links that hold up to a grader.

- Feasibility: the open sources for music (no SEP equivalent) are good enough to grade claims
  against.
- Usability: one app with two fields stays clear; you always know which map you're in.

## Success: what good looks like

**Outcome:** a newcomer can wander the music map the way they wander philosophy: see the whole,
follow a thread three genres deep, and hear each one.

| Signal | Measure | Bar |
| --- | --- | --- |
| Format travels | The same views (globe, card, timeline, Your thread) work for music with no music-only screens | yes |
| Thread followed | Simulated user test: from House, find where it came from and two genres it led to | 3 of 3 runs |
| Hear it | Every genre has playable landmark recordings, one click each | 100% |
| Guardrail: accuracy | Grader on every claim against the saved sources | 0 wrong, 0 invented links |

## MVP and stop line

**Ships:**
1. A music field: about 30 genres of popular music from 1900 to today, weighted towards
   electronic and dance (house included), with sourced links ("grew out of", "reacted against").
2. Each genre card: tagline, what to listen for, hallmarks, key artists, landmark recordings,
   further reading, neighbours.
3. Field switcher: Philosophy · Music, with the same globe, timeline and Your thread per field.
4. Progress kept per field.

**Stop line (to the backlog):** other fields, articles, quizzes, spaced repetition, the Socratic
AI, embedded audio players, pricing.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| M1 | The music map shows every genre on first load, no overlaps | label checks across all views, screenshot |
| M2 | Every genre has tagline, 3 listen-for lines, 5 hallmarks, 3–5 artists, 3 landmark recordings, neighbours, sources | script over the content |
| M3 | Landmark recordings open a search for that recording in one click | click test |
| M4 | Switching fields keeps each field's view and progress apart | user-tester |
| M5 | The music content passes the accuracy guardrail | data-evals report |
| M6 | Philosophy works exactly as before | existing tests, spot check |

**No-gos:** hosting or embedding copyrighted audio; quotes of lyrics; paid API calls.

**Rabbit holes:** sub-sub-genres (deep house vs tech house), chart data, regional scenes beyond
one line, any audio playback inside the app.

## Feel references

- The existing Meander globe and canvas sign-off (approved 27 Nov): same look, same calm.
- Ishkur's Guide: the joy of hearing a genre the moment you find it.
- A record shop's crate dividers: families you can see at a glance.

**The feel in one sentence:** the same quiet, brass-and-bone map, now with music you can follow
by ear.

## Things to avoid

- Music-only screens or a different visual language for music.
- Streaming-app look (album-art grids, play buttons everywhere).
- Genre snobbery or "best of" rankings.

## Decisions already made

- Same app, same stack, content as JSON in `src/content/`, progress in localStorage (L44–L49).
- Laptop first; phone works with one genre at a time, as for philosophy.

## Unit tests

- Progress and "Next from here" kept per field (a genre id never counts towards philosophy).
- Timeline placement for music years (1900–today).
