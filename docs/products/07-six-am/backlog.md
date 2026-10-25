# Backlog

## Start here next time

Shipped on 19 Oct without the playbook's checks (owner: ship and wrap up tonight). First: the
skipped checks below, on the live URL. Then song analysis, the biggest wish.

| Idea | Why | Status |
| --- | --- | --- |
| Skipped checks: `break-ui` (worst-case track names, an empty track, 64 bars full), `web-design-guidelines`, then the simulated user test from `user-testing/plan.md` | Definition of done; nothing has tested the app with fresh eyes yet | next |
| Own test on the live URL, on a second device | The point of Supabase is "any device"; only one laptop has seen it | next |
| Faster first load: one request for the list and the open track, instead of two in a row | "Loading your tracks…" takes a moment on a cold server (owner, 19 Oct) | small |
| Song analysis: upload a track I love (or pick from Spotify) and see how it's built: tempo, key, sections (intro, build, drop, breakdown) and when sounds come in | Learn by studying the tracks I want to make (owner, 19 Oct). Spotify closed its audio-analysis API to new apps in late 2024, so analysing an uploaded file in the browser is the likelier route | next big piece |
| More lanes, closer to how house tracks are built: split Drums into **Kick** and **Percussion** (hats, claps, shakers), add **Melody / Lead** (riffs, piano hooks, arps), **Vocals** (hooks, chops, spoken words), **Pads / Atmosphere** apart from Chords, and **FX** (risers, impacts, downlifters) apart from top percussion; later let a lane hold two loops at once (layering) | The owner asked (19 Oct); four lanes force choices real tracks don't make, e.g. a kick and a different hat pattern can't be combined today | next |
| Freesound samples in the crate (CC0 only, owner's account and key) | Real vocals and instruments; the synth stand-ins (vocal chop, strings) sound synthetic | later |
| Real waveforms (render each recipe offline and draw its peaks) | The drawn ones are close but not true | later |
| One-move club tricks: drop, pump | Half of house music; one control each | later |
| Humming → notes (Basic Pitch) | Make a melody truly yours | v2 |
| Live jam mode (lanes, clips start on the next bar), recorded onto the timeline | The first design idea; fun for performing once the timeline works | parked |
| More sounds for more complex songs | The 24-loop crate got limiting fast (owner, 19 Oct) | done: 48 loops |

## Ears and the roadmap (from the owner's brief, 23 Oct)

Past Ears v1's stop line (`kickoff.md`). Phases are sequenced, not dated; each starts when the
previous gate is passed. Full detail in `kickoff-source.md`.

| Idea | Why | Status |
| --- | --- | --- |
| Batch analysis of a whole playlist (autoplay queue, ~6 h for 56 tracks) | Sorting the dump playlist without clicking each track | in the MVP (owner moved it in, 23 Oct) |
| Genre families: map Discogs styles to the owner's Appendix A families and show the family as the headline (F5 option B/C) | Owner chose raw styles only for the MVP (23 Oct); 24 Oct: "I think we need the mentor to make this feature good" | Phase 3, with the Mentor |
| Arrangement map (EA-6): sections and per-lane activity on the bar grid | "When does the bass come in? How long is the build?" | Phase 2 |
| Uploader metadata disagreement flag (EA-8) beyond showing the tag | "Tagged Deep House, sounds like Progressive" | Phase 2 |
| Character extras: loudness, bass weight, swing (EA-5); BPM/key stability over time (EA-4) | Ear training vocabulary | Phase 2 |
| Local audio files as a source (EA-1) | Owned tracks | Phase 2 |
| Compare two tracks side by side | "Why does this feel deeper than that?" | later |
| Built-in Mentor (ME-1–ME-8) via Claude API and a small backend for the key | Replaces Copy for Claude once proven | Phase 3 |
| Genre lessons, ear training, discovery paths (ME-3, ME-4, ME-6) | Learn the genres; Appendix A is the seed curriculum | Phase 3 |
| Genre recipes (GR-1–GR-3) | Start a track from a genre | Phase 3 |
| Studio: set key from analysis, reference track alongside (ST-2, ST-4) | Make it like this track | Phase 3 |
| Full layer model, automation lanes, mixer (ST-5–ST-10) | Real arrangements; needed by Remake | Phase 4 |
| Synth Lab: playable 303, sub, organ, reese (LA-1, LA-2) | Shape my own sounds | Phase 4 |
| Remake mode (DR-4) | Rebuild a track lane by lane with the original alongside | Phase 4 |
| Live stem separation "Neural Mix" (DR-2), offline stems for owned files (DR-3) | Hear just the bassline; personal use only, licence needed if public. Owner, 26 Oct: "only listen to the bass" of the original (Solo on the draft's lanes shipped in Phase 3, L140) | Phase 5 (last: most uncertain) |
| AI-generated loops (LA-3) | Generate new sounds; licences to check | later |
| Accounts, cloud sync, sharing, mobile, non-Chrome browsers | Out of scope for a personal tool | no (for now) |
| Mark each analysed track as filed into a playlist, with a "31 / 56 placed · 6 unsure" progress line and a per-row playlist picker | User test 23 Oct: the thing that would bring them back tomorrow | obsolete (owner, 24 Oct: sorted *B b baaangers* by hand) |
| Search / type-to-filter in long lists | User test 23 Oct | done (24 Oct fix pass) |
| Design to 9/10 (final critic, 7/10): one toolbar with one status slot instead of three stacked bars; listening state in one place; Style columns wider, Track capped ~380 px; quieter in-row "Analyse"; two-line empty state | Founder eval report, 24 Oct | done (25 Oct cleanup: critic 9/10, L99, T46) |
| Sharper house sub-genres: map Discogs styles to the owner's families (deep, jackin', melodic, ballroom) with their own rules, or a second signal (swing, chords) | Validation: plain House tops 6/10 | Phase 3, with the Mentor (owner, 24 Oct) |
| Stability check and a single 10-track queue run in real Chrome; a geo-blocked track | Not evidenced in the eval report | next |
| Play a filtered list one track after another ("hear all my deep house in a row") | Owner wants it (24 Oct), after v1.1 | next |
| Genre counts and tagged share in the filter bar ("31 of 56 tagged · deep house 9 …"), each count a filter | User test v1.1 (24 Oct) | later |
| Empty-filter message: count "Not available in your region" tracks apart from "not analysed yet" | User re-check v1.1 (N2) | later |
| ME-7 remake coaching | Owner, 24 Oct: consider when building the Studio Lab and Remake mode | later |
| "Your styles" strip: accepted groups and My genres with track counts and BPM ranges, suggestions taken | Mentor user test (24 Oct) | later |
| Dev-only reset of the Mentor store for clean-start tests | Mentor user test (24 Oct) | later |
| Mentor polish from the last re-check: Studio header overflows with a draft open (Save 14 px tall); warn before leaving an unsaved draft; hide accept buttons on superseded suggest turns; lead suggestions with the pick; draft playhead at bar 1; no request on / before the code | Mentor re-check 24 Oct (N9–N14) | done (25 Oct cleanup, T40–T45) |
| A saved track opens at bar 1 (today every saved track opens at bar 37, the demo's mid-song start) | User test 25 Oct (D1, major) | next (small) |
| "This track" follows a row selected after the last answer; the accept button names the track ("Set Lost in The Loop to Deep house"). Reverses part of L86/T35, so the owner's call | User test 25 Oct (C1, major) | owner to decide |
| Analyse polish left by the critic at 9/10: tell the two % headers apart; actions (Analyse, Cancel) vs passive statuses; toolbar stays one row with the Mentor open; drop the Mentor button's pressed look while the panel shows its own close | Critic 25 Oct, round 2 | later |
| Fewer columns: drop Also/% and Tone from the table (both in the strip) so Track gets the room | Critic 25 Oct, round 1 (kept for now: not in the owner's two rows) | owner to decide |
| Sandbox: reset the in-memory Mentor chat between test runs (or a thread per run) | User test 25 Oct | later |

## Phase 3 follow-ups (26 Oct)

| Idea | Why | Status |
| --- | --- | --- |
| Tone Transport one-tick slip at some tempos (≤ 3.5 ms at 90 BPM) in the offline/Transport path | X3 finding F1; under the 5 ms bar above 62.5 BPM | later |
| Section labelling: merge repeated same-label pieces in the ruler, label by role (build before a drop, cooldown near the end), catch intro → build; then re-run X1 (0/5 twice: recall 74%, precision 57%) | X1 failed; the map's ruler shows e.g. six "Intro" sections | next |
| A real listen of the owner's own loved tracks to judge the map by ear (no public section times exist for the 10 validation tracks) | X1 can only be scored on public annotated tracks | owner review |
| "Add to lane" for synths and kits never overwrites (AI loops already don't) | user test F1 scope | next (small) |
| Store AI loop try reasons (now shown once) | L136 | later |
| Reference layers shown faintly above the Studio lanes ("what's left to fill to get the same DNA") | user test: most wanted next | next big piece |
| Pasting two links separated by a space in Analyse adds only the first | Found in the follow-up pass | later (small) |
