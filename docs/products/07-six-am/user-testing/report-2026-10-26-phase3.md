# User test: Six AM Phase 3 (map, template, sounds, AI loops), 2026-10-26

Simulated (user-tester agent), persona = the owner. Test sandbox (`ACCESS_CODE=test-code`,
in-memory), headful Chrome at 1440 wide over CDP, build 068e286. Two real AI generations ($0.40).
The tester can't hear: playback judged from the screen and network only. Screenshots in
`shots-2026-10-26/`.

**Verdict (persona):** "Seeing the track laid out … then getting a Studio track with the same
bones in one click, is exactly what I wanted … But the Mentor just reads the bar numbers back to
me … And the AI loop button charged three times what it said, then pasted the loop over my acid
line."

| Job | Score | Why |
| --- | --- | --- |
| 1 See how a loved track is built | 4 | Clear sections, five layers, estimates labelled; can't hear a section; blank grid ~40 s; no Stop |
| 2 Mentor explains the structure | 2 | Honest but recites bar numbers; doesn't teach what a build/breakdown does |
| 3 One click to the same bones | 5 | 126.1 BPM, Gm, 108 bars, markers 1/9/49/77/85, empty lanes; save + reload kept |
| 4 Sounds I can shape | 4 | Presets, patterns, 3 knobs with one-line explanations; everything lands at bar 1; Mentor suggests automation the Studio can't do |
| 5 Generate a bass loop like this track | 3 | Fast (7–8 s), measured BPM/key shown; charged $0.24 after "About $0.08 a try"; overwrote an acid block; second loop replaced the first |

**X6 fails** (jobs 2 and 5 below 4).

| ID | Sev | Finding |
| --- | --- | --- |
| F1 | major | AI loop dropped at the playhead over an existing block |
| F2 | major | Second AI loop replaced the first; no list of my loops |
| F3 | major | "About $0.08 a try" then $0.24 with no reason shown |
| F4 | major | Explain/Tell me more recite bars; some ranges don't match the map |
| F5 | minor | Explain answer below the fold |
| F6 | minor | Clicking a section doesn't play it |
| F7 | minor | Blank grid ~40 s while listening; no Stop; Start looks clickable while listening |
| F8 | minor | Mentor knob advice needs automation (past the stop line) |
| F9 | minor | Mentor history shows the drawer's whole internal knob question |
| F10 | minor | "Add to lane at bar 1" ignores the template's markers |
| F11 | minor | After a map listen, the track isn't in the Analyse list (no Map button) |
| F12 | polish | Short block labels cut; mute 28×22, Sub tab 23×28 |

**Guardrails:** 0 streamed audio uploaded (only `PUT /api/analyses` 1.7 KB and `/api/maps` 4 KB
JSON during a 3:36 listen); 0 AI keys in 13.1 MB of JS or responses; `/api/maps`, `/api/loops/*`
401 without the code; Ears, Mentor, Studio unbroken (F11 aside). Contrast: Studio ruler numbers
2.40:1 and units 3.59:1 (likely predate Phase 3); map and drawer text ≥ 5.27:1.

**Value:** map and template weekly; AI loops rarely until F1–F3 are fixed. Most wanted next: the
reference's layers shown faintly above my lanes ("what's left to fill to get the same DNA?").
