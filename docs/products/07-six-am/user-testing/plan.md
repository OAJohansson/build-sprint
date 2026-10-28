# Test plan: Six AM

Three plans on one page: **Ears v1** (23 Oct, Founder mode) first, then the **Studio MVP plan**
(18 Oct) unchanged below it, then the **Mentor** plan (24 Oct, Founder mode) at the end. The "Studio unbroken" guardrail in `evals.md` reuses the Studio
plan's S1, S2 and S4.

## Ears v1

Bars are copied from [`../evals.md`](../evals.md) ("User test", requirements and definition of
done), not made up here. Persona: [`persona.md`](persona.md), moment 1.

### How to run the app for testing

- Start: `pnpm -F 07-six-am dev` (port 3007). Ears needs no keys; the Analyse view sits next to
  the Studio. The Discogs-EffNet and Essentia.js models download from their hosts on the first
  Analyse (network needed).
- Browser: **desktop Chrome/Chromium only** (NF4). Viewport 1440 × 900, plus one pass at
  1280 × 800 (desktop guardrail). Phone is out of scope.
- Seed data: first run = clear localStorage, IndexedDB and Cache Storage for the origin (so the
  model download shows, NF3). Returning user = 3 results in the session list (analyse three
  validation tracks in a first run and reload).
- Test URLs: the validation tracks in Appendix B of [`../kickoff-source.md`](../kickoff-source.md)
  (track 1, Hard Reset *Redemption*, for S1; track 8, Dubspinna, for "hears past the tag"), and the
  playlist `https://soundcloud.com/andreas-johansson-303905204/sets/b-b-baaangers` (56 tracks)
  for S3. Plus one junk URL, one private and one geo-blocked track for the US1 messages (the
  latter two to be found; the pack names none).
- Simulated parts:
  - **The agent can't hear.** It judges listening from what it can read: the widget's state
    (`READY`/`PLAY`/`PAUSE`/`FINISH`), the capture's RMS level and the progress, read in the page.
    Whether the genres sound right is `data-evals` against the reference calls, and the owner's
    ear.
  - **Gap: Chrome's tab-share dialog needs the owner's hands.** The picker ("choose this tab",
    "Share tab audio") is browser chrome, not page content: an agent driving the page can't click
    it, and an automated Chrome can only auto-accept it with launch flags that skip the very step
    US2 tests. So the simulated tester runs S1 and S3 in one of two ways, and the report says which:
    1. **Stubbed capture** (default for the simulated run): a test-only switch that replaces
       `getDisplayMedia` with a stream fed from the embedded player's audio or a fixed test
       signal, so everything after the grant can be driven and timed. It does not test the
       dialog, the instructions' fit with Chrome's real wording, or real tab audio; the 6-tap and
       90 s bars then count the dialog as 3 taps (choose this tab, tick Share tab audio, Share)
       and add the owner's measured time for it *(assumed: evals.md doesn't say whether the
       dialog's clicks count toward the tap bar; counting them is the stricter reading)*.
    2. **The owner's run, recorded**: the owner does S1 and S3 in real Chrome with a screen
       recording and the console log kept; the tester (or `data-evals`) grades the recording
       and logs against the bars.
    Both are needed: the stub for the flows, the owner's run for US2 and F3.
  - **Clipboard:** read back in the page after Copy for Claude (S2), and pasted into a text field
    to compare with the Appendix B template.

### Scenarios

#### S1 · What genre is this?
- **Moment:** the evening, *B b baaangers* open on SoundCloud in another tab; a track they love
  and can't name. First time using Ears this session (listening not yet enabled).
- **Task:** "I love this one but have no idea what it is. What genre is it?" Paste the track URL,
  enable listening, analyse.
- **Success:** result card with top 3 genres (with %), BPM, key, energy and brightness in
  ≤ 90 s and ≤ 6 taps, without help. Genres shown as probabilities, never one certain label
  (NF5). First run: the model download shows what is happening and its size (NF3).

#### S2 · Where does this go?
- **Moment:** right after S1, the Claude chat open in another tab, wanting to file the track.
- **Task:** "Which of my playlists does this go in? Let me ask Claude."
- **Success:** the clipboard holds the full prompt in ≤ 15 s and ≤ 2 taps: title, uploader, URL,
  all results, uploader tags (or "none") and the Appendix B prompt, every value matching the
  result card field by field (correct-data guardrail, 100%).

#### S3 · Pick from the playlist
- **Moment:** sorting session, working down the dump playlist rather than pasting tracks one by
  one.
- **Task:** "Load my *B b baaangers* playlist and do the Dubspinna remix next." Paste the playlist
  URL, find the track, analyse it.
- **Success:** the right track analysed and added to the session list in ≤ 2 min and ≤ 8 taps.
  The playlist lists all 56 tracks (US1, beyond 15). The uploader tag (Deep House) is shown next
  to the result (US4).

#### S4 · Set the Studio to this BPM
- **Moment:** a result has made them want to make something now.
- **Task:** "I want to start something at this tempo."
- **Success:** the Studio at the detected tempo in ≤ 10 s and ≤ 2 taps: its tempo display shows
  the BPM and the transport plays at it (F10). The Studio still loads, plays and saves a track as
  before (guardrail).

#### S5 · Time passes (04 Mallow)
- **Moment:** a few days later, coming back to carry on sorting: the page reloaded, and on another
  day Chrome's "Stop sharing" bar clicked mid-session.
- **Task:** carry on as normal.
- **Success:** every result from last time is still in the session list and exports as CSV and
  JSON with every row's fields (US7, F8); after a reload or Stop sharing the UI shows "not
  listening" and asks to enable listening again rather than failing silently (US2). Not in the
  `evals.md` user-test table; its bars come from US2 and US7.

### Edge passes (inside the scenarios, from `evals.md`)

- **US1:** invalid URL, private track, geo-blocked track: each a clear message.
- **US2:** share without ticking tab audio, and share with silent audio: each a message with
  Retry (owner's hands, or the stub's "no audio" and "silent" modes).
- **US3:** Cancel mid-analysis saves nothing; pausing the player pauses the analysis and resuming
  continues or restarts cleanly.
- **NF4:** open the Analyse view in Safari or Firefox (or with `getDisplayMedia` removed): it
  explains Chrome is needed.

### Value questions

- After S1: could they name what they heard, and did the % feel honest or like a guess?
- After S2: did the copied text give Claude enough to file the track without them adding more?
- Did the uploader tag next to the result teach them something (track 8: tagged Deep House)?
- Would they use Ears for all 56 tracks, or stop part way? What would stop them?
- Was granting tab audio once per session acceptable, or a reason not to come back? (Usability
  assumption.)

### Trust checks

- After S1 and S3: storage (localStorage, IndexedDB, Cache Storage, OPFS) holds no audio-sized
  blobs or PCM arrays, and the network log has no outgoing request with an audio body or over
  100 kB (F7, NF1). Model downloads are inbound only.
- Nothing on screen looks like record, download or save-audio.
- After S2 and S5: copied and exported values match the result card field by field.
- Ask afterwards: "Did anything make you think Six AM was keeping a copy of the track?"

### Out of scope

Genre accuracy on the full validation set (that is `data-evals`), the owner-only checks, phone
layout, non-Chrome browsers beyond the NF4 message, batch analysis (Phase 2), the Studio beyond
the guardrail.

## Studio MVP plan (18 Oct)


### How to run the app for testing

- Start: `pnpm -F 07-six-am dev` (port 3007, so it can run next to Folio on 3000). No keys
  needed; the MVP crate is bundled CC0 audio.
- Viewport: 1440 × 900 (laptop). The product is desktop-first; phone is out of scope.
- Seed data: first run = clear localStorage. Returning user = one saved recording of about a
  minute (a `seed` recording in the app's demo data, or record one in S2 and reload).
- Simulated parts: **the agent can't hear.** Browsers only allow sound after a click, which the
  agent's clicks satisfy, but it judges timing from what it can read: the playing state of each
  clip and the transport position (bar and beat), read in the page with JavaScript. Whether it
  *sounds* like house is the owner's call, in a real listen after each run.

### Scenarios

#### S1 · First sound
- **Moment:** an evening at home, laptop and headphones, first time opening the app.
- **Task:** "I just want to hear something good."
- **Success:** something playing in ≤ 30 seconds and ≤ 2 clicks, with no tutorial and no settings.

#### S2 · Build a track on the timeline
- **Moment:** same evening, 20 minutes in, playful.
- **Task:** "Start with a beat, bring in a bassline after a while, add chords, take the drums out
  for a bit, bring them back."
- **Success:** a timeline of ≥ 2 minutes with at least 4 loops from the crate, made without help,
  in ≤ 10 minutes. Every loop sits on a bar line (check the stored positions), and repeats are
  whole loop lengths.

#### S3 · The club moves
- **Moment:** the groove is going and they want a moment of tension.
- **Task:** "Make it sound like it's coming from outside the club, then open it back up."
- **Success:** finds and uses the filter without help; the sound changes smoothly with no jumps
  (no sudden value changes in the filter's readout).

#### S4 · Play it back
- **Moment:** later the same week, the app reopened after a reload.
- **Task:** "Play me what I made on Thursday."
- **Success:** the track is there and every loop is at the same bar with the same length as
  before the reload (compare the stored track before and after).

#### S5 · Time passes (04 Mallow)
- **Moment:** a long track played on loop for 20 minutes; the tab sent to the background and
  brought back.
- **Task:** carry on playing and editing.
- **Success:** loops still start on their bars after the long run and the background tab; the
  playhead matches the sound and hasn't drifted or reset.

### Value questions

- Did it feel like *making* music or like playing someone else's track? (The riskiest assumption.)
- Which part of the crate or which control would they reach for every time? Which never?
- What's missing that would make them come back tomorrow: more sounds, more moves, humming?
- Would they play the track to a friend?

### Trust checks

- After S2, compare the stored track (each loop's bar and length) with what is on screen, one by one.
- Credits: every sound in the crate is listed with its CC0 source.
- Ask afterwards: "Did anything feel like it was chosen for you rather than by you?"

### Out of scope

Phone layout, humming (v2), Freesound search, export, sound quality beyond "does it play" (the
owner judges sound by ear).

## Mentor

Phase 2, 24 Oct, Founder mode. Bars are copied from the Mentor part of [`../evals.md`](../evals.md)
(E1–E10, requirements M1–M16 and the guardrails), not made up here; where `evals.md` gives no time
or tap bar, the tester reports the numbers without a pass/fail. Personas:
[`persona.md`](persona.md), **persona 2 (Robin, new user, no brief)** for M-S0 to M-S10 on a clean
start, and **persona 1 (the owner)** for the returning-user runs and M-S7, M-S11, M-S12, M-S13.
Every job scenario is scored 1–5 by the tester (E10: every job ≥ 4/5).

### How to run the app for testing

- Start: `pnpm -F 07-six-am dev` (port 3007), with `ANTHROPIC_API_KEY`, `SUPABASE_URL`,
  `SUPABASE_SECRET_KEY` and `ACCESS_CODE` in `.env.local` (filled from the root secrets by the PM;
  never printed). Type the access code once. Real Claude calls cost real money: keep each sample at
  the size `evals.md` asks for.
- Browser: desktop Chrome/Chromium, 1440 × 900, plus one pass at 1280 × 800 (Ears' desktop
  guardrail). Phone is out of scope.
- **Clean start (new user, Robin):** empty Mentor data and empty library: no taste profile, no
  chats, no genre groups, no results, no My genre, no cost records. Six AM is single-owner, so this
  is a separate Supabase test dataset or a reset by the PM before the run, plus cleared
  localStorage for the origin *(assumed: the pack has no accounts; how to get a clean start is an
  ops call for the PM)*.
- **Returning user (the owner):** setup done from the public sets below, the 10 Ears validation
  tracks (Appendix B of [`../kickoff-source.md`](../kickoff-source.md)) analysed with their results
  in Supabase, 5 or more with My genre set.
- **Test playlists:** the owner's public sets at
  https://soundcloud.com/andreas-johansson-303905204/sets, e.g.
  `/sets/you-are-edging-me`, `/sets/groove-shoulder`, `/sets/bounce-therapy`,
  `/sets/the-category-is-serve`, `/sets/house-reworks` (check each loads as public before the run;
  never *B b baaangers*, which is private). For Robin, use `house-reworks`, `bounce-therapy` and
  `the-category-is-serve` (closest to persona 2); for the owner, all five. Plus the private
  *B b baaangers* link once, for the "private set" message.
- Simulated parts:
  - **The agent can't hear,** and neither can the Mentor: judge answers by what they say and their
    source labels, never by "does it sound right" (that is `data-evals` and the owner's ear).
  - **Owner's hands in real Chrome (batched into one ask, page ready):** anything that plays audio
    the tester must judge or that needs Chrome's own dialogs: (1) the setup step's track previews
    ("which of these three tracks is most you?"), (2) the taste session's two snippets, (3) Ears'
    tab-audio share if a track has to be analysed live during the run (Chrome's picker is browser
    chrome; the Ears stub can stand in for the flow, as in the Ears plan). Each of these steps is
    marked **[owner's hands]** below. The simulated tester drives the rest and can still check the
    widget's `PLAY`/`PAUSE` state for previews and snippets.
  - **Clock:** the "time passes" scenario changes the local date with Chrome DevTools' timezone
    emulation (Sensors → Location / timezone) rather than waiting for midnight; unit test 2 is the
    main check for midnight and month change.
- Network log kept for every scenario (no audio in request bodies, no API key in responses).

### Scenarios

#### M-S0 · Setup: "get to know me" (Robin, clean start)
- **Moment:** first open, on the sofa, 10 minutes free; Six AM knows nothing about them.
- **Task:** "Fine, here are my playlists." Open the Mentor, paste the three test set links, answer
  the 3–5 tap questions (use "say more" once), the "which of these three is most you?" question
  **[owner's hands: previews play audio]**, and add one line in "anything else I should know?".
- **Success:** M10: playlists → draft profile → 3–5 tap questions (+ say more, track previews) →
  optional notes. E4: the profile reasonably describes the playlists (grader rubric pass on ≥ 2
  public playlists). Setup says it read titles, artists and tags and didn't listen (E2 honesty).
  The pack's "~5 min" is reported as measured, not graded. Edge: the private *B b baaangers* link
  gives a clear message.

#### M-S1 · Explain this track (job 1)
- **Moment:** going through a playlist; an analysed track selected.
- **Task:** "What is this, and why does it feel like that?" Press Explain, then "Tell me more"
  once. Then deselect the track and ask a general question ("what's the difference between deep
  and tech house?").
- **Success:** M1: the panel slides in from the right, follows the selected track, has job buttons
  and a follow-up chat, and works with no track. M2: plain words, a source label on every fact
  (Ears measured / uploader tagged / web source / your taste profile / general knowledge). 2–4
  sentences before "Tell me more". E2: no claim to have heard the music. E7: answer within 15 s
  (p90 over the sample). Job score ≥ 4/5 (E10).

#### M-S2 · Suggest a genre and take it (job 2)
- **Moment:** tagging a track that has no My genre; then one that already has one.
- **Task:** "What should I call this?" Accept the suggestion in one click. On the second track
  (My genre already typed), ask again.
- **Success:** M3: one click fills My genre; a typed genre is never overwritten. The call is
  hedged, not certain (things to avoid). On the owner's returning-user run: E1, Mentor suggestion
  matches the reference call on the 10 validation tracks ≥ 8/10 (rubric fixed before the run;
  `data-evals`). Suggestions use the person's own genre words and accepted groups, never the old
  built-in list (L55). Job score ≥ 4/5.

#### M-S3 · Teach me a genre (job 3)
- **Moment:** a genre word came up in M-S2 they don't know ("hard bounce", "ballroom").
- **Task:** "Teach me ballroom."
- **Success:** M4: structured teacher voice (roots, traits, artists), web sources as links. M8:
  web supports Ears' measurements, never overrules them. Examples tied to tracks in their library
  where it has them. Job score ≥ 4/5.

#### M-S4 · Ear-training prompts (job 4, prompts)
- **Moment:** a track selected, headphones on.
- **Task:** "What should I listen for in this one?"
- **Success:** M5: prompts tied to the selected track (its measured BPM, key, energy, tags), with
  source labels; nothing says it heard the track (E2). Job score ≥ 4/5.

#### M-S5 · Studio starting point (job 5)
- **Moment:** a track has made them want to make something.
- **Task:** "How would I start something like this?" Then follow the starting point into the
  Studio.
- **Success:** M6: tempo, key and loops from the existing crate, real loop names only (unit test 3
  checks them against the crate); the Studio opens at the track's tempo and plays (Ears' F10
  reused). Studio still loads, plays and saves (guardrail). Job score ≥ 4/5.

#### M-S6 · Listen next (job 6)
- **Moment:** a track they love, wanting more like it.
- **Task:** "What should I listen to next?" Open two links. Mark one "more like this" and one "not
  for me".
- **Success:** M7: from the profile + web, each with "because…", links resolve, no invented
  artists or tracks. E3: 0 invented in a sample of ≥ 10 answers; ≥ 90% of links resolve. M8:
  "nothing online" said honestly when it finds nothing. Job score ≥ 4/5. The two marks feed M-S8.

#### M-S7 · My taste in Settings (owner, then Robin)
- **Moment:** curious what Six AM thinks of them.
- **Task:** "What has it learned about me?" Open Settings, read "What Six AM has learned about
  you", change one line (e.g. "I don't like big festival drops"), then ask for listen next again.
- **Success:** M9: readable and editable under Settings, read before every answer: the next answer
  reflects the edited line and labels it "your taste profile" (E2). The edit is still there after
  a reload (M15).

#### M-S8 · Learning from use (E5's three scripted actions)
- **Moment:** a normal sorting session after setup.
- **Task:** three scripted actions, one at a time, checking the profile after each: (1) type a My
  genre the Mentor didn't suggest, (2) correct a genre suggestion, (3) "not for me" on a
  listen-next suggestion (from M-S6).
- **Success:** E5: each of the 3 scripted actions shows up in the profile. M11: the profile
  updates and "Updated: …" appears now and then (reported: after which actions it appeared).

#### M-S9 · Genre groups: accept, rename, split
- **Moment:** owner, returning user, 5+ tracks tagged; Robin, clean start, with fewer.
- **Task:** "Can you group what I've tagged?" Accept one proposed group, rename another, split a
  third. On Robin's clean start, ask before enough tracks are tagged.
- **Success:** M12 and E6: groups proposed from tagged tracks with a name and a reason; every
  group's reason checks out against the tracks (shared BPM, style mix, traits; `data-evals`); all
  three actions work (`user-tester`). Accepted names then show in My genre suggestions (L55). Too
  few tagged tracks gives a clear "needs more" state, not an empty or invented group.

#### M-S10 · Taste session **[owner's hands: snippets play audio]**
- **Moment:** a slow evening, wanting to train their ear.
- **Task:** "Give me a taste session." Listen to both snippets, pick one and say why in their own
  words ("the bouncier one, I like the hard kick").
- **Success:** M13: two snippets from the library, preference + why, named back (the Mentor names
  what they described, not what it "heard"; E2). Snippets play through the SoundCloud player;
  nothing is recorded (guardrail). The simulated tester checks the flow and widget state; the
  owner judges the listening.

#### M-S11 · Cost and the 50/day warning (owner)
- **Moment:** a long sorting evening, many questions.
- **Task:** "How much is this costing me?" Hover one answer's cost; read Today and Month. Then reach
  the 50th question of the day (seeded count, or a scripted run) and press "Continue anyway".
- **Success:** M14: cost estimate per answer and "Today $x · <Month> $y" in the panel, labelled
  estimate. E8: shown cost within $0.03 per day total of real usage (`data-evals` vs the API
  usage); the 50/day warning appears and "Continue anyway" works (not a hard stop).

#### M-S12 · Reload and another browser (owner, then Robin)
- **Moment:** a week later, on another laptop or a fresh Chrome profile.
- **Task:** carry on: open the Analyse page, select a track asked about before, open Settings.
- **Success:** M15 and E9: Supabase holds profile, chats, genre groups, results and My genre;
  reload and a fresh browser profile keep everything (each thread back with its track, the
  profile, accepted groups, Today/Month). Request bodies hold no audio. Ears' results and My
  genre migrated from localStorage on the first run after the update, nothing lost.

#### M-S13 · Time passes (04 Mallow): the daily count across midnight
- **Moment:** the owner asks questions late in the evening, carries on after midnight without a
  reload, and comes back on the 1st of the next month.
- **Task:** with ~48 questions asked before midnight, ask 3 more after midnight (timezone
  emulation, page not reloaded); later, move the date into the next month.
- **Success:** after midnight Today restarts from $0.00 and the count from 0, so no 50/day warning
  appears for the 3 new questions; the previous day's answers keep their costs on hover; on the new
  month, Month restarts and the old month's total isn't lost from the records. "Continue anyway"
  pressed the day before doesn't carry over. Bars from unit test 2 (daily count and the 50/day
  warning across midnight and month change) and E8; nothing silently resets the profile or chats.

### Edge passes (inside the scenarios)

- No track selected: job buttons that need a track say so; general questions and Teach work (M1).
- Web search finds nothing: said honestly, no invented sources (M8).
- An answer slower than 15 s or failing: what it's doing is shown, then a Retry (E7; Ears' "no
  spinner-only waits").
- Private, invalid or empty set link in setup; a set with no tags.
- Long genre, artist and track names in answers, groups and the profile (`break-ui`).

### Value questions

- **Riskiest assumption:** after M-S2 and M-S6, did the genre call and listen-next feel more "them"
  than a plain chat? Run one side by side: the same track's Copy for Claude text in a plain Claude
  chat vs the Mentor's answer, and ask the persona which fits them and why (reported, not a bar;
  `evals.md` has no comparison eval).
- Did the setup profile read like them, or like a horoscope? Was the setup worth ~5 minutes?
- Which jobs would they use weekly (explain, suggest, listen next?) and which never (Studio
  starting point, for Robin)?
- Did "Updated: …" feel helpful or creepy?
- Was the cost line reassuring or worrying?

### Trust checks

- Every answer has source labels; none says or implies it heard the music (E2, 100% of ≥ 20).
- Network: no request body holds audio; the API key appears in no response and not in the browser
  bundle (M16, guardrails); the Mentor route refuses without the access code.
- Accepting a suggestion never overwrites a typed My genre (M3); a hand edit to the profile stays
  (M9).
- Profile, chats and groups saved match what was typed word for word after a reload (M15).
- Ears and Studio unbroken: Analyse, queue, My genre, filters, Studio play/save (guardrail).
- Ask afterwards: "Did anything make you think the Mentor had listened to the track, or was keeping
  a copy?" and "What did it know about you that you didn't tell it?" (should be nothing).

### Out of scope

ME-7 remake coaching; multi-user accounts; the owner-only checks; phone layout; genre accuracy
beyond E1's sample; the design critic's score (run separately, E10); building a recommender;
perfect cost accounting.

## Phase 3: arrangement map, template and sounds (26 Oct)

Persona: the owner (`persona.md`), a beginner producer who learns by copying tracks they love
("same DNA"). **Test sandbox only** (`ACCESS_CODE=test-code`, in-memory store; L108, 0028); never
the owner's real data. Laptop, 1440 × 900, Chrome. Score each job 1–5 (bar: every job ≥ 4, X6).
A full-track listen takes the track's length: use one short track (e.g. Mason Flint, 3:26) with
Chrome launched with the tab auto-select flags, or a map already saved in the sandbox.

#### P-S1 · See how a loved track is built (job 1)
From Analyse, select an analysed track → Map → listen (or open a saved map). Can you say where
the first drop starts, when the bass comes in and how long the breakdown is? Are estimates
clearly estimates?

#### P-S2 · Ask what the structure means (job 2)
Explain the structure; Tell me more. Is it short, plain, honest (no "I heard"), and does it teach
what a build or breakdown does?

#### P-S3 · Start your own version (job 3)
Start a track from this. Does the Studio open a new, unsaved track with the same tempo, key,
length and section markers, lanes empty? Save it, reload: still there; the existing saved tracks
unchanged.

#### P-S4 · Shape a bass and chords (job 4)
+ Sound on Bass → try Sub, 303 Acid, Reese and a pattern; move the three knobs while listening;
Add to lane. Same on Chords (Organ, Rhodes, Pad). Do the knobs make sense? Ask the Mentor about
the knobs. Does it all stay in key and on the beat by ear?

#### P-S5 · Drums (job 4)
+ Sound on Drums → 909 and 808 kits, a pattern, Add to lane; play with the bass and chords.

#### P-S6 · Generate a bass loop like this track (job 5)
In the template's Bass drawer: Generate. Is the wait clear, the result in key and on tempo by
ear, the cost clear (per loop, today, month, estimate)? What happens if a loop "may be off"?
At most 2 generations (≤ $0.48).

### Trust checks (Phase 3)
- Network: no request body holds audio during a map listen (only numbers to `/api/maps`); the AI
  keys appear in no response and not in the bundle; `/api/loops/*` and `/api/maps` refuse without
  the code.
- Ears, the Mentor chat and the Studio's old tracks unbroken (guardrail).
- Ask afterwards: "Did anything make you think Six AM kept a copy of the track?"

## Phase 5: Make for every layer (28 Oct)

Persona as above (beginner bedroom producer, loves house, no music theory). Sandbox only
(`ACCESS_CODE=test-code`, in-memory store, port 3017). Score each job 1–5.

#### M-S1 · Make my own drums from a loop I love (slice 1)
Open a track's Lab, loop the drop, switch Make to Drums. Expect: the three rows fill after a
short countdown; I can tell which row the knobs change; picking a row moves nothing else.

#### M-S2 · Get my kick close to the original
Open Kick, try presets, follow the gold ticks / Mentor hint, A/B with the bass under both, watch
the closeness score. Expect: I can hear and see it getting closer without knowing theory.

#### M-S3 · Keep the drums I like and use them
Save kick, clap and hats; open the Studio; find them in My sounds; drop each on its lane; reload.
Expect: each lands on its own lane and survives a reload.

#### M-S4 · A breakdown with almost no drums
Loop a hats-only part. Expect: rows that are probably bleed are clearly "off", I understand why,
and "Play anyway" brings them back.

#### M-S5 · Bass still works as before
Switch to Bass. Expect: nothing changed.

(Melody and FX scenarios added with slices 2 and 3.)
