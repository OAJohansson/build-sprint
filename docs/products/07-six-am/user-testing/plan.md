# Test plan: Six AM

Two plans on one page: **Ears v1** (23 Oct, Founder mode) first, then the **Studio MVP plan**
(18 Oct) unchanged below it. The "Studio unbroken" guardrail in `evals.md` reuses the Studio
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
