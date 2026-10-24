# User test: simplified Mentor (after the owner's review), 24 Oct (simulated)

`user-tester`, owner persona, desktop 1440 × 900 and 1280 × 800, real Supabase, build 705e655,
10 real calls. Verdict: "Finally it feels calm: one box, I type what I want, it gets the right
track by name and doesn't lecture me."

| Job | Score |
| --- | --- |
| Explain (track named, not selected) | 5/5 |
| Suggest genre + accept | 4/5 |
| Teach | 4/5 |
| Ear training | 3/5 (generic tips, a wrong half-time number) |
| Studio start | 4/5 |
| Listen next | 3/5 (charts and playlists, no named tracks) |

**E10 (every job ≥ 4): fail.** E9 pass: all 17 turns back after reload and in a fresh browser.
Guardrails: 0 audio, 0 key, contrast worst 5.56:1, hit areas ≥ 28 px, focus never lost, latency
4.4–8.6 s (teach 13.7 s). Clutter left: "Tell me more" under every answer, six more-like-this
buttons, Studio key paragraph repeating the answer, teach links twice, "Your own tag is Deep House".

| # | Severity | Finding |
| --- | --- | --- |
| F1 | major | A follow-up ("compare with the first track you explained") used the default selected row instead of the track just discussed |
| F2 | major | Listen next returned charts/playlists, no artist – title picks |
| F3 | major | Studio header breaks with a long draft title; Save overlaps; playhead at bar 37 |
| F4 | minor | Ear tips generic; wrong half-time maths |
| F5 | minor | Help is a paid call each press and promises features with no visible way in |
| F6 | minor | Accept has no undo |
| F7 | minor | Source line not built from what was used ("uploader tag" with none, web called "general") |
| F8 | minor | "Import playlists" opens a four-tab setup dialog |
| F9 | polish | Unlock progress numbers unlabelled |
| F10 | polish | Help button reads like a caption |

Data written: 20 messages in `main` (+$0.20), one reversible My genre change (cleared again).
