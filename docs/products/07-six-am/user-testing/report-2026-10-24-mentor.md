# User test: Six AM Mentor, 24 Oct (simulated)

`user-tester` on a8e2998, desktop 1440 × 900 and 1280 × 800, dev server with the in-memory store
(Supabase not yet connected). Robin (new user) for setup and the jobs, the owner for cost and
persistence. ~22 real calls, ~$0.33. Not a true clean start: only My taste was cleared.

| Job | Score |
| --- | --- |
| Explain | 4/5 |
| Suggest genre + accept | 4/5 |
| Teach (no track) | 3/5 (General view overflows) |
| Ear training + taste session | 3/5 (jargon, hidden behind "/") |
| Studio start | 4/5 |
| Listen next | 3/5 (2 of 9 links are track pages; 12.6 s and 17.1 s) |

**E10 (every job ≥ 4/5): fail.** E2: 0 "I heard", 0 unsourced sentences in 12 logged answers.
E5 3/3. E6: actions pass, one reason wrong after split. E7: p90 ≈ 12 s over 15 answers, one over
15 s. E8 UI pass. E9 pass within the in-memory server only. M1–M16: all pass except M5 voice (F2),
M9 partial (F6); M13 listening needs the owner's ears. Guardrails: 0 audio in request bodies, 0
key exposure, Ears and Studio unbroken, contrast worst 5.27:1.

| # | Severity | Finding |
| --- | --- | --- |
| F1 | major | General tab: panel content 447 px in a 399 px column; text cut and close button off screen |
| F2 | major | Ear training and taste session use "spectral centroid 2329 Hz", "-28.8 dBFS" |
| F3 | major | Only 3 jobs visible; ear training, studio start, taste session, groups need "/" |
| F4 | minor | Listen next: only 2 of 9 links go to a track page (tag pages, articles, playlists; labelled honestly) |
| F5 | minor | Listen next 12.6 s and 17.1 s |
| F6 | minor | An edited My taste line isn't visibly used in the next answer |
| F7 | minor | Split groups keep the old reason; a rename produced a doubled name |
| F8 | minor | Answers run to 5–7 sentences; Studio lists loops twice |
| F9 | minor | Library facts (accepted genres, groups) labelled "your taste profile" |
| F10 | polish | One "Not for me" over-read into a broad profile note |
| F11 | polish | Leaving setup halfway still saves the draft; labelled "From what you did in Six AM" |
| F12 | polish | Requests fire before the access code loads (401s, then repeat) |
| F13 | polish | Listen-next titles and source links under 28 px tall |

Side-by-side (reported, not graded; plain chat simulated): "more me for listen next; about the
same for the genre." Wish: a "Your styles" strip (groups with counts and BPM ranges, suggestions
taken).
