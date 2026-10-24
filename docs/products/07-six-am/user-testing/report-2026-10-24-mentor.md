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

## Re-test after the fix pass (real Supabase, 574412a)

Jobs: Explain 4, Suggest genre 3 (contradicted its own Explain on Dubspinna, N2), Teach 4, Ear
training 4, Studio start 3 (opens the last saved track instead of a new one with the loops, N1),
Listen next 4. **E10 still fails (two jobs at 3).** F1, F2 (ear training), F3, F5, F7, F9, F13
fixed; F4 not fixed (1 of 3 links a track page, honestly said); F8 mostly; F12 partly.
**E9 pass on the real database**: 10 analyses, 5 My genres, every thread, 3 groups and the cost line
survived a reload and a fresh browser profile. E8 pass (shown $0.17 = sum of per-call costs; not
checked against the Anthropic invoice). E7 p90 ≈ 11 s. 0 audio, 0 key exposure. New: N1 major
(Studio start hand-off), N2 major (suggest contradicts explain), N3 /analyse doesn't ask for the
code on a fresh browser, N4 artist page labelled "article", N5 jargon in Studio start, N6 "$0.00"
after a $0.005 answer, N7 uploader fact labelled Ears, N8 Settings target 20 px.

Test data left in the real database: 10 analyses (the owner's own validation results) with 5 My
genres, 18 Mentor messages ($0.17), 3 genre groups; taste profile and the owner's 2 Studio tracks
untouched.

## Re-check of Studio start and Suggest genre (25f73d7)

Studio start **4/5** (new unsaved draft with the 5 loops at the suggested tempo; owner's tracks and tempo unchanged; plain-word key note). Suggest genre **4/5** (names its change of mind, agrees with Explain; one-click accept works). Source key pinned, "< $0.01" shown, /analyse gate with 0 requests. New: N9 Studio header overflow with a draft (minor), N10 leaving a draft has no warning (minor), N11 superseded accept buttons (minor), N12 pick mid-paragraph, N13 playhead after the loops, N14 one request on / before the code (polish).
