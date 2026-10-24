# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

## Problem

I love house and techno and want to make my own tracks, but I've never produced. Real DAWs
(Ableton, FL Studio) look like a cockpit and GarageBand isn't built for dance music, so I never
get from "I'd love to" to a track I can play.

## Who

Me: a house and techno lover with no production experience, at a laptop with headphones. Had quick
looks at the big tools and was put off by how much is on screen.

## Moment of use and jobs to be done

An evening at home, a track stuck in my head after a night out, 30–60 minutes and curious, not
trying to learn a tool.

1. When I'm in the mood to make something, I want sounds that already fit together, so I can
   make taste decisions instead of fighting timing and music theory.
2. When I'm building a track, I want to see what plays when (drums and bass for a while, then
   something new comes in), so I can shape it into a song.
3. When I hear a melody in my head, I want to hum it in, so the track is really mine (v2).

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Ableton / FL Studio | The real thing | A cockpit for a beginner; costs money |
| GarageBand | Free, friendly, a timeline you can drag loops onto | Not built for house and techno sounds or moves |
| Koala, Groovepad, Remixlive | Tap loops on a grid, fun | Phone-first, generic packs, little sense of building a track |
| Splice (Create) | Huge library, stacks matching samples | AI picks for you; a subscription; a library, not an instrument |

**Why switch:** made only for house and techno (sounds, tempo, the club moves), and a calm,
record-shop feel instead of a cockpit.

## Riskiest assumptions

- **Value (riskiest):** arranging curated loops on a timeline feels like *making* music, not
  playing someone else's. The MVP must test this.
- **Usability:** a beginner can drag a loop onto the timeline, repeat it and hear it in time,
  without a tutorial. (The first idea, a jam grid of lanes, failed this with the owner on 18 Oct:
  they expected a timeline.)
- **Feasibility:** tight timing in the browser (scheduling the timeline on the audio clock),
  smooth dragging and snapping, drawing waveforms.
- **Viability:** sounds we're allowed to ship inside an app (CC0 only), at a quality that sounds
  like the music I love.

## Success: what good looks like

Main outcome: in one sitting, I go from nothing to a track I want to play back.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| First sound | User test: time from opening to something playing | Under 30 seconds |
| First track | User test: a timeline of at least 2 minutes with 4+ loops | In one sitting, no help |
| Pride | "Would you play this to a friend?" | Yes |

**Guardrail:** timing never drifts; every loop plays exactly on its bar.

## MVP and stop line

A laptop web app with two parts. **The crate** (sound browser): 24 loops in four groups (drums,
bass, chords, top/FX), all at 124 BPM in A minor, each with a preview. Synthesised in the browser
first, CC0 samples from Freesound later (decision 0019, 18 Oct). **The timeline**: four fixed tracks (drums, bass, chords, top/FX) you drag loops onto;
every loop snaps to the bar and repeats when you drag its end; mute per track; play from any bar
with a moving playhead; one filter control; undo. One zoom level showing about 64 bars. Tracks autosave to
Supabase so they open on any device, behind an access code (decision 0020, 19 Oct; the brief
first said localStorage). Layout: GarageBand's (timeline plus loop browser), look and browser from rekordbox
(dark, coloured waveforms, a proper library list). Owner agreed this feature list, 18 Oct.

Stop line: no live jamming (the lanes idea), no humming, no Freesound search, no export, no
volume per track or mixer, no more than four tracks, no zoom, no loop-a-section, no effects
beyond the filter. All to `backlog.md`.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| 1 | Clicking a loop in the crate previews it, in time with the track if it's playing | Preview during playback; it stays on the beat |
| 2 | Dragging a loop onto the timeline drops it on the nearest bar | Drop between bars; it lands on a bar line |
| 3 | Dragging a loop's end repeats it in whole loop lengths | Stretch a 4-bar loop to 16 bars; it plays 4 times |
| 4 | Play starts where the playhead is; the playhead moves in time | Click bar 17, press play; sound and playhead start at 17 |
| 5 | Loops can be moved and deleted | Move a loop to bar 33, delete another; playback matches |
| 6 | The filter sweeps the whole mix smoothly | Turn it fully; no clicks or jumps |
| 7 | The track survives a reload | Reload; every loop is where it was |
| 8 | Muting a track silences it from the next beat, and unmuting brings it back | Mute drums during playback; only drums stop |
| 9 | Undo reverses the last change (add, move, repeat, delete, mute) | Do five changes, undo five times; back to the start |
| 10 | Every sound is CC0 with its source listed | Credits list matches the files |

**No-gos:** AI-generated sounds, accounts, phone layout, a pro-style mixer.

**Rabbit holes:** sound hunting (timebox the crate to an hour), waveform drawing performance,
zoom levels, audio export formats, building a synth.

## Unit tests

- **Snap to bar:** given a drop position in pixels, the zoom and the tempo, which bar does a loop
  land on? Edges: exactly on a bar line, just before one, before bar 1, past the end.
- **Timeline to schedule:** loops at bar positions (with repeats) become the right start times
  in seconds from any playhead position. Edges: starting mid-loop, an empty timeline, a repeat
  that ends exactly where the next loop starts.

## Success check (at wrap-up)

Wrapped up on 19 Oct without the user test (owner's call), so these are the owner's own use, not
measurements.

| Signal | Target | What happened |
| --- | --- | --- |
| First sound | Under 30 seconds | Not timed. Press play on the demo track and it sounds; the first click is needed by the browser |
| First track | 2+ minutes, 4+ loops, no help | Not tested with a fresh user. The owner built and saved tracks; the demo shows the shape |
| Pride | "Would you play this to a friend?" | Not asked. Owner on first listen: "sounds great"; on the 48 loops: "they sound good" |
| Guardrail: no drift | Every loop on its bar | Holds by design: notes are booked on the audio clock; scheduling is unit tested |

**Did it solve the problem?** Partly, for one person. The cockpit problem is answered: one
screen, a timeline, a crate, everything in key, and the owner made tracks they liked on day
one. Whether a beginner other than the owner gets to a track without help is untested. The
riskiest assumption (does arranging loops feel like *making* music?) has one positive data
point, the owner, and that's all.

## Ears v1 (23 Oct, Founder mode)

The second phase of Six AM: a listening booth next to the Studio. Written by `discovery` from the
kickoff pack ([`kickoff.md`](kickoff.md), source of truth) and the success bars in
[`evals.md`](evals.md); the owner's full brief is [`kickoff-source.md`](kickoff-source.md). Lines
the pack marks "owner to confirm" are taken as given. Anything the pack leaves open is marked
*(assumed: why)*. The Studio MVP brief above still holds for the Studio.

### Problem

A house and techno lover can't tell what genre the SoundCloud tracks they love really are, because
uploader tags are loose or missing and the same song can be three genres depending on the remix.
Today it costs hours of metadata research per playlist (56 tracks in *B b baaangers*, about 10
still uncertain without hearing them), and existing analysis tools need an audio file, while most
of this music is streamed edits and bootlegs that can't be downloaded.

### Who

The builder: a club-goer turned bedroom producer who loves the London/Berlin queer underground
(Adonis, Gideön, Panorama Bar), emotive vocal house, melodic techno and hard trance. Collects on
SoundCloud, mostly undownloadable remixes. No music training; learns by doing and needs plain words
tied to tracks they love. MacBook Pro (Apple silicon), desktop Chrome. Full version in
[`user-testing/persona.md`](user-testing/persona.md).

### Moment of use and jobs to be done

At the laptop, going through a SoundCloud playlist, curious about one track at a time; sometimes
straight before opening the Studio to make something.

1. When I love a SoundCloud track but don't know its genre, I want to play it in Six AM and see
   its top genres, BPM, key and energy, so I can name what I'm hearing.
2. When I'm sorting my dump playlist, I want the analysis plus a ready-made question for Claude,
   so I can file each track in the right genre playlist.
3. When a track makes me want to make something, I want to set the Studio to its BPM in one
   click, so I can start in the same tempo.

Sorting a whole playlist is job 2 at scale: in the MVP it is done track by track, with results
kept across sessions (batch analysis is Phase 2, owner, 23 Oct).

### Today's alternatives

| Alternative | Good | Annoying / why not |
| --- | --- | --- |
| Metadata research by hand (tags, artist, label, length) | Confident on most tracks | ~10/56 stay uncertain; never hears the audio |
| Spotify API | Playlists | No audio features for new apps since late 2024 |
| FreqBlog Music Metadata MCP | BPM/key/mood/genre by name | Only commercial releases; misses SoundCloud edits |
| Audio Analyzer MCP | Tempo, key, structure of local files | No genre; no streams |
| Cyanite | Pro tagging | Outside Six AM; 5 analyses a month |
| TrackCheck for SoundCloud | BPM/key on SoundCloud | BPM/key only; pulled from the Chrome store Aug 2026 |
| djay Pro Neural Mix | Licensed live stems on SoundCloud | No genre or analysis; stems only |
| rekordbox + SoundCloud | Streaming plus stems | Stems on streams unconfirmed |
| Server-side analysis | Full Python toolset | Means uploading audio (copying) plus hosting costs |

**Why switch:** Six AM hears the actual streamed audio, keeps only measurements, and sits next to
the Studio where the track gets made.

### Riskiest assumptions

- **Feasibility (riskiest):** Chrome tab capture (`getDisplayMedia`, this tab, tab audio) can hear
  the cross-origin embedded SoundCloud player inside Six AM, **and** Discogs-EffNet gives sensible
  genres on this music. Tested first: Step 0 capture spike (owner's hands in real Chrome), then
  Step 1 model spike, before any real build.
- **Value:** seeing genre, BPM, key and energy and getting it explained makes me learn the genres
  faster and finish sorting the playlist.
- **Usability:** granting tab audio once per session (choose this tab, tick Share tab audio) is
  acceptable.
- **Viability:** Essentia.js and its models are AGPLv3 / non-commercial: fine for personal use,
  revisit before any public release.

### Success: what good looks like

Main outcome: I use Ears to place all 56 tracks of *B b baaangers* into genre playlists.

| Signal | How measured | Target |
| --- | --- | --- |
| Genre agreement | Top-1 or top-2 vs the reference call, 10-track validation set (Appendix B) | ≥ 7 / 10 |
| BPM accuracy | ±2 of reference, or half/double-time flagged | ≥ 8 / 10 |
| Speed | Paste to result | ≤ 90 s |
| Playlist sorted | Tracks placed using Ears | all 56 |

**Guardrail:** no audio is ever stored, uploaded or downloadable (checked in storage and network).
Further guardrails in `evals.md`: readable text ≥ 4.5:1, copied/exported values match the card
100%, the Studio still loads, plays and saves, works at 1280 × 800 and 1440 × 900.

### MVP and stop line

Ears v1, scope items 1–8 of the brief:

1. A new **Analyse** view in Six AM, alongside the Studio.
2. Paste a **SoundCloud track or playlist URL** → the official embedded player loads. For a
   playlist, show the track list and let me pick a track.
3. **Enable listening:** one "Allow tab audio" step per session, with clear instructions.
4. **Analyse:** about 60 s of the playing track (configurable 30–90 s) with progress.
5. **Result card:** top 3 genres with %, BPM, key and scale, energy, brightness; uploader genre
   tag and tags for comparison when available.
6. **Copy for Claude:** summary plus the Appendix B prompt to the clipboard.
7. **Set Six AM to this BPM:** one click sets the Studio tempo.
8. **Session list:** results stored locally, survive reload, export CSV/JSON.

If something has to give, cut in this order: playlist track list (track URLs only), CSV export
(JSON only), uploader tags.

**Appetite:** no fixed day budget (the laptop may run overnight). The constraint is the owner's
hands: anything needing them (the capture spike in real Chrome first) is ready within about 3 h
of kickoff.

**Stop line:** everything in the brief's "Out of scope" (arrangement map, stems live or offline,
built-in mentor, genre recipes, Remake mode, synths, AI generation, accounts, cloud sync, sharing,
mobile, non-Chrome browsers), batch analysis of a whole playlist (Phase 2) and every roadmap phase
are in [`backlog.md`](backlog.md).

### Feature drill-down

Objects (also the product's vocabulary): **track** (a SoundCloud track loaded in the player),
**playlist** (a SoundCloud set, a list of tracks), **listening** (the tab-audio share for this
session), **result** (one analysis of one track), **session list** (all results kept). Calls stay
inside the pack's scope; anything extra is Later.

**Track and playlist**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: paste a track or playlist URL | MVP | Scope item 2 |
| Lifecycle | Find: pick a track from a loaded playlist | MVP | Scope item 2 (first to cut: track URLs only) |
| Lifecycle | Change: paste another URL replaces the loaded one | MVP | Smallest way to move to the next track *(assumed: no multi-source queue in the pack)* |
| Lifecycle | Remove / saved playlists | No | Nothing about the source is kept except in a result |
| Connections | Playlist → track → Analyse | MVP | The S3 path |
| Screen states | Empty (no URL yet), loading (≤ 5 s), invalid, private, geo-blocked, long playlist (56, beyond 15) | MVP | US1 |
| Screen states | Long titles and uploader names | MVP | SoundCloud edit titles run long (`break-ui` checks it) |
| Trust | Unsupported browser explained | MVP | NF4 |

**Listening**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Start: Enable listening with instructions for Chrome's dialog | MVP | Scope item 3, US2 |
| Lifecycle | Stop: Chrome's Stop sharing returns the UI to "not listening" | MVP | US2 |
| Screen states | Not shared, shared without audio, silent → message and Retry | MVP | US2 |
| Trust | Video track stopped at once; nothing that looks like recording | MVP | F3, things to avoid |

**Result**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: Analyse with visible progress | MVP | Scope item 4, US3 |
| Lifecycle | Cancel mid-analysis, nothing saved | MVP | US3 |
| Lifecycle | Pause/resume with playback | MVP | US3 |
| Lifecycle | Re-analyse the same track | MVP | Stability eval needs it; adds a second row *(assumed: no dedupe in the pack, the smallest choice is a new row)* |
| Lifecycle | Take out: Copy for Claude | MVP | Scope item 6 |
| Lifecycle | Take out: Set Studio BPM | MVP | Scope item 7 |
| Lifecycle | Change: correct the genre by hand, playlist it was filed in | Later | Correction log is a mitigation in the brief's risks, not scope |
| Screen states | Working: first-run model download with size, then analysing | MVP | NF3, things to avoid (no spinner-only waits) |
| Screen states | Error: analysis fails or audio drops mid-window | MVP | US2/US3 imply it *(assumed: same message-and-Retry pattern as listening)* |
| Screen states | No uploader tags → field left out on the card, "none" in the copied text | MVP | US4, F9 eval |
| Trust | Genres always as % | MVP | NF5 |

**Session list**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Find: every analysed track listed, newest first | MVP | US7 *(assumed: newest first, the smallest order)* |
| Lifecycle | Open a past result (see its card, copy it again) | MVP | Sorting over several sessions needs it *(assumed: the copy and BPM actions work from the list too)* |
| Lifecycle | Remove one row | Later | Not in the pack; export plus clearing site data covers it for one user |
| Lifecycle | Take out: export CSV and JSON | MVP | Scope item 8 |
| Organise | Sort, filter, group by genre | Later | Phase 2 history work |
| Screen states | Empty, one, 56+ rows | MVP | The outcome is 56 tracks |
| Trust | Survives reload; no audio in storage | MVP | F7, F8 |

### Requirements

Functional (F), non-functional (NF) and user stories (US) as in the kickoff pack; each is a
pass/fail check in [`evals.md`](evals.md).

| # | Must | Check |
| --- | --- | --- |
| F1 | Parse and validate SoundCloud track and set URLs (incl. `?si=`, `utm_`, `?in=` context) | Unit test over real URL shapes; invalid URL shows a message |
| F2 | SoundCloud Widget API for load, play, pause, seek, current sound, events (`PLAY`, `PAUSE`, `FINISH`, `READY`) | Widget events drive the UI |
| F3 | Tab audio via `getDisplayMedia` (audio required, video stopped at once) → Web Audio → `AudioWorklet` buffer in memory only | Non-silent RMS from the embedded player; no video track live |
| F4 | Resample to 16 kHz mono, mel patches, Discogs-EffNet inference via Essentia.js / TF.js, averaged over the window | Top styles printed for a captured window |
| F5 | Map the 400 Discogs styles to display names; group into Appendix A families and show both | `Electronic---Deep House` → *Deep House* |
| F6 | BPM, key/scale, energy (RMS/loudness), brightness (spectral centroid) over the same buffer | Values on the result card |
| F7 | Discard raw audio once features are computed; never write it to storage, never upload it | Storage and network inspection |
| F8 | Persist results (not audio) locally; export CSV/JSON | Reload keeps the list; files download |
| F9 | Copy for Claude builds the Appendix B text and writes it to the clipboard | Clipboard matches the template |
| F10 | Set the Studio project BPM from the result | Studio shows and plays at the new BPM |
| NF1 | No audio stored, uploaded or downloadable | Code review plus storage/network check |
| NF2 | Result ≤ 10 s after the capture window ends; inference off the main thread | Timing; Web Worker in use |
| NF3 | Models lazy-loaded on first use, browser-cached, loading state, size shown the first time | First vs second run |
| NF4 | Desktop Chrome/Chromium only; unsupported browsers detected and explained | Safari/Firefox show the message |
| NF5 | Genres shown as probabilities, never one certain label | Result card copy |
| NF6 | AGPLv3 / non-commercial licence flagged in the README | README line |
| NF7 | Match the existing Six AM look (dark UI, monospace labels, warm accents, lane colours) | Design critic |
| US1 | Load SoundCloud: player ≤ 5 s; a playlist lists all tracks (beyond 15); invalid, private or geo-blocked shows a clear message | |
| US2 | Enable listening: explains the Chrome dialog; says so if not shared or silent and offers Retry; detects Stop sharing | |
| US3 | Analyse in about 60 s: progress, cancellable; top 3 genres with %, BPM (1 decimal), key + scale, energy and brightness as labels and bars; pauses with playback, resumes or restarts cleanly | |
| US4 | Uploader genre tag next to the audio result | |
| US5 | Copied text has title, uploader, URL, all results, uploader tags and the prompt | |
| US6 | One click sets the Studio tempo | |
| US7 | Every analysed track listed, survives reload, exportable | |

Energy and brightness labels (e.g. low/medium/high, warm/bright) need thresholds the pack does not
give *(assumed: three bands each, set from the validation tracks; reversible in one constant)*.

**Genre display:** the Appendix A family as the headline, the raw Discogs style and % under it.

**No-gos:** never store, upload or record audio (C2); no server and no running costs for Ears
(models load from their hosts in the browser; the Studio's Supabase storage stays as is); Chrome
desktop only.

**Rabbit holes:** batch/autoplay analysis of whole playlists; arrangement map or stems "while
we're in there"; making Studio tempo fully variable (the Studio is fixed at 124 BPM today, F10
needs only the smallest change that works); tuning the genre-family mapping beyond what the
validation set needs.

**Feel:** a listening booth in the same warehouse as the Studio: play a track you love and the
facts come back calm, honest and precise, in Six AM's dark, warm, monospace look. References: the
Six AM Studio itself, rekordbox's library analysis row, a record-shop listening booth. Avoid:
certainty, anything that looks like record/download/save-audio, a new visual language, motion
beyond one progress indicator, spinner-only waits.

### Unit tests

PM's call (L1):

1. **SoundCloud URL parsing (F1):** track vs set, `?si=`, `utm_`, `?in=`, mobile and
   `on.soundcloud` short links, junk input.
2. **Discogs style → display name and genre family (F5):** known styles, unknown styles (fall back
   to the raw name), ties.
3. **BPM normalisation and half/double-time flag:** 61 vs 122, 148 vs 74, edges of the house range.

### Success check (at wrap-up)

To fill in at wrap-up: each signal above with what happened, and whether all 56 tracks were placed.

## Mentor (24 Oct, Founder mode)

Phase 2 of Six AM: the "Learn" step, pillar 3 "Mentor" (ME-1 to ME-8) of
[`kickoff-source.md`](kickoff-source.md). Written by `discovery` from the Mentor kickoff pack (the
last section of [`kickoff.md`](kickoff.md), source of truth), the Mentor part of
[`evals.md`](evals.md) and decisions L45–L55 in [`decisions.md`](decisions.md). Ears v1 and v1.1
above are shipped and this builds on them. Anything the pack leaves open is marked
*(assumed: why)*.

### Problem

Ears says what a track measures, but not what that means or what to do with it. Today the owner
pastes the Copy for Claude text into a separate chat, re-explains their taste every time, and the
answer never comes back into Six AM. Nothing learns their taste, and the genre words they use
aren't anyone's fixed list.

### Who

- **The owner** (as for Ears): a club-goer turned bedroom producer sorting SoundCloud by feel. Full
  version in [`user-testing/persona.md`](user-testing/persona.md), persona 1.
- **A new user with no brief**, for the first time: the Mentor must work without predefined taste
  data and learn the person from their own playlists and use (persona 2). Six AM stays single-owner
  (no accounts), so "a new user" means the Mentor starting from an empty profile and empty library
  *(assumed: no multi-user accounts is a no-go; a clean start is an ops/test state, not a feature;
  see the PM's gap list)*.

### Moment of use and jobs to be done

At the laptop in the Analyse view, a track selected (or none, for general questions).

1. When I've analysed a track, I want it **explained** in plain words, saying where each fact came
   from, so I understand what I'm hearing. (ME-1, ME-8)
2. When I'm tagging, I want a **genre suggestion** I can accept in one click (it fills My genre; my
   choice always wins), so tagging is fast and I learn the words. (ME-2, recast without fixed
   playlists, L55)
3. When a genre name comes up, I want to be **taught** it (roots, traits, artists), so the words
   stick to music I know. (ME-3, without Appendix A as built-in curriculum)
4. When I want to train my ear, I want **listening prompts** and **taste sessions** (pick between
   two snippets and say why), so I can name what I like. (ME-4)
5. When a track makes me want to make something, I want a **Studio starting point** (tempo, key,
   loops from the existing crate), so I can start straight away. (ME-5)
6. When I want more music like this, I want **listen next** suggestions that say why, from my taste
   and the web, so I find music I'll actually like. (ME-6)

Out: ME-7 remake coaching (backlog: "consider when building the Studio Lab and Remake mode").

### Today's alternatives

| Alternative | Good | Annoying / why not |
| --- | --- | --- |
| A normal Claude chat with Copy for Claude pasted in | Good answers | No memory of the owner's taste, no link back into Six AM, nothing learned from tagging |
| Genre wikis, RA and Discogs pages | Explain genres | Not about the owner's library or taste |
| Asking a friend or a record-shop person | Taste-aware, warm | Not there at the laptop, track by track |

**Why switch:** the Mentor sits next to the track in your hands, knows what Ears measured and what
you like, says how it knows, and what you tell it comes back into Six AM (My genre, the profile).

### Riskiest assumptions

- **Value (riskiest):** a taste profile learned from a few playlists plus use makes the Mentor's
  suggestions and listen-next noticeably more "me" than a generic chat.
- **Honesty:** the Mentor stays honest about sources and never claims to have heard audio, while
  still being useful (it only ever gets Ears' numbers, uploader tags, the web and the profile).
- **Feasibility:** Claude with web search answers within 15 s, and listen-next doesn't invent
  artists or tracks.
- **Viability:** cost stays small and visible (estimate per answer and per day/month).

### Success: what good looks like

Outcome: the owner uses the Mentor while sorting and learning, and its genre calls and suggestions
fit their taste better over time. Signals (bars from [`evals.md`](evals.md), Mentor part):

| Signal | How measured | Target |
| --- | --- | --- |
| Genre suggestion (E1) | Mentor suggestion vs the reference call on the 10 Ears validation tracks, fixed rubric | ≥ 8 / 10 |
| Sources, never "heard it" (E2) | Sample of ≥ 20 answers across all jobs | 100% |
| Listen next real (E3) | Sample of ≥ 10 answers | 0 invented; ≥ 90% of links resolve |
| Profile from setup (E4) | Grader rubric | pass on ≥ 2 public playlists |
| Profile learns (E5) | 3 scripted actions | each shows up in the profile |
| Genre groups grounded (E6) | Each reason vs the tracks; accept, rename, split | all check out; all three work |
| Speed (E7) | Answer time | p90 ≤ 15 s |
| Cost honest (E8) | Shown vs real usage; 50/day warning | within $0.03 per day; warning + Continue anyway work |
| Nothing lost (E9) | Reload, fresh browser profile, request bodies | everything kept; no audio |
| Jobs and feel (E10) | User test per job; design critic on the panel | every job ≥ 4/5; design 9/10 a target, not a blocker |

**Guardrails:** no audio stored, uploaded or sent to Claude (0); API key never in the browser
bundle or responses (0); Ears and Studio unbroken (Analyse, queue, My genre, filters, Studio
play/save); readable text ≥ 4.5:1, hit areas ≥ 28 px.

### MVP and stop line

1. **Mentor panel** on the Analyse page: slides in from the right, follows the selected track, a
   button per job plus a follow-up chat box; works with no track selected for general questions.
2. **The six jobs** above, every answer with source labels (Ears measured / uploader tagged / web
   source / your taste profile / general knowledge).
3. **Web search** when it helps (genre questions, listen next, teaching), sources shown as links;
   web facts support Ears' measurements and never overrule them; nothing online is said honestly.
4. **My taste:** a short written profile the Mentor reads before every answer, readable and
   editable under Settings ("What Six AM has learned about you").
5. **Setup step (~5 min):** paste SoundCloud playlist links → titles, artists, tags read via the
   widget (no listening) → first profile drafted → 3–5 quick questions with tap answers plus "say
   more" (vocals; dancing, driving or deep listening; "which of these three tracks is most you?"
   with short previews) → optional "anything else I should know?".
6. **Learning from use:** typed genres, corrected suggestions, "more like this" / "not for me" on
   listen next and what the owner asks about update the profile; occasionally "Updated: …".
7. **Genres that grow from the library:** no fixed family list; the Mentor proposes groups among
   tagged tracks (shared BPM, style mix, traits) with a name and reason; accept, rename or split.
8. **Taste sessions:** on request, two snippets from the library, "which do you prefer and why?",
   then name what was described.
9. **Cost:** each answer's cost estimated from API usage (tokens + web searches) and published
   prices; "Today $x · <Month> $y" in the panel, per answer on hover, labelled as an estimate; a
   warning at 50 questions a day with "Continue anyway" (not a hard stop).
10. **Everything in Supabase:** taste profile, Mentor chats, genre groups, and the Analyse results
    and My genre migrated from localStorage, so nothing depends on one browser.

**Stop line:** ME-7 remake coaching; multi-user accounts; built-in Appendix A data; model choice per
job; anything past these ten items → [`backlog.md`](backlog.md).

**First to cut if time runs short** *(assumed: the pack gives no cut order; these are the items
with the least effect on the riskiest assumption)*: taste sessions (8), then the track previews in
the setup question (keep the question with titles only), then genre-group split (keep accept and
rename).

### Feature drill-down

Objects (also the product's vocabulary): **taste profile** ("My taste", the written profile),
**setup session** (the ~5-minute first run), **mentor answer** (one reply to a job button or chat
message), **chat thread** (the answers and follow-ups around one track, or none), **genre group**
(a proposed or accepted group of tagged tracks), **taste session** (two snippets, a choice and a
why), **listen-next suggestion** (one artist or track with "because…"), **cost record** (the
estimate for one answer, summed to Today and Month). Calls stay inside the pack; extras are Later.

**Taste profile**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: first draft from the setup step | MVP | Scope 5 |
| Lifecycle | Create: empty profile if setup is skipped; the Mentor still answers and says it doesn't know your taste yet | MVP | Must work for a new user with no brief *(assumed: the pack doesn't say setup is required; skippable is the more reversible choice)* |
| Lifecycle | Change: edited by hand in Settings; the edit wins over what was learned | MVP | Scope 4, M9 *(assumed: owner's words win, as with My genre)* |
| Lifecycle | Change: updated from use with "Updated: …" | MVP | Scope 6, M11 |
| Lifecycle | Change: re-run setup with more playlists, adding to the profile rather than replacing it | MVP | Smallest way to add playlists later *(assumed)* |
| Lifecycle | Remove: clear the profile / start over | Later | Not in the pack; editing the text to empty covers it |
| Lifecycle | History of changes, undo an update | Later | "Updated: …" plus hand editing is the MVP |
| Connections | Read before every answer | MVP | M9 |
| Connections | Feeds genre suggestion, listen next, teach examples, Copy for Claude (L55) | MVP | Scope 2, L55 |
| Screen states | Empty (no setup yet), short draft, long (after months of use) | MVP | New user and the owner both |
| Trust | Plain words the person can read, no hidden scores; labelled "your taste profile" when an answer uses it | MVP | E2 source label |
| Trust | Stored in Supabase, survives reload and another browser | MVP | M15, E9 |

**Setup session**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Start: offered the first time the panel opens with an empty profile; reachable again from Settings | MVP | Scope 5 *(assumed: where it starts isn't set; first panel open is the moment of use)* |
| Lifecycle | Step: paste one or more set links; titles, artists, tags read via the widget, no listening | MVP | Scope 5, no-gos |
| Lifecycle | Step: draft profile shown, then 3–5 tap questions plus "say more", then optional "anything else?" | MVP | Scope 5, M10 |
| Lifecycle | Step: "which of these three tracks is most you?" with short previews | MVP | Scope 5 (previews are the first thing to cut) |
| Lifecycle | Leave half way, carry on later | Later | ~5 minutes; restarting is cheap *(assumed)* |
| Connections | Uses the Ears playlist loader; writes the taste profile | MVP | Reuse, no new SoundCloud path |
| Screen states | Reading the playlists (progress), private or invalid set link, a set with no tags, 1 vs 5 playlists | MVP | Ears' US1 messages; the private *B b baaangers* is a real case |
| Trust | Says it read titles, artists and tags only, and didn't listen | MVP | Honesty assumption |
| Trust | Previews are the SoundCloud player playing; nothing recorded | MVP | C2 |

**Mentor answer**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: one button per job, or typed in the chat box | MVP | Scope 1, M1 |
| Lifecycle | Create with no track selected: general questions and Teach work; jobs that need a track say so | MVP | M1 *(assumed: how track-only jobs behave with no track isn't set)* |
| Lifecycle | Take further: "Tell me more" after 2–4 sentences (teach mode is longer) | MVP | Voice, L52 |
| Lifecycle | Take out: Accept fills My genre (genre suggestion only); never overwrites a typed genre | MVP | M3 |
| Lifecycle | Take out: Studio starting point opens the Studio at the tempo with the named loops | MVP | M6, Ears F10 reused *(assumed: the crate is fixed in A minor today, so key is said, not set; see gaps)* |
| Lifecycle | Regenerate, rate an answer | Later | Not in the pack |
| Connections | Reads the selected track's Ears result, uploader tags, profile, web | MVP | Honesty assumption: only these inputs |
| Screen states | Thinking (with what it's doing, e.g. searching the web), answered, web found nothing (said honestly), error / timeout with Retry | MVP | M8, E7; Ears' "no spinner-only waits" |
| Screen states | Long source lists, long genre and artist names | MVP | `break-ui` |
| Trust | A source label on every fact; web links shown; never "I heard"; genre calls hedged; no flattery, no emoji | MVP | M2, E2, things to avoid |
| Trust | No audio in any request; key server-side | MVP | M16, no-gos |

**Chat thread**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: first answer about a track starts its thread; one general thread for no track | MVP | M1 "follows the selected track" *(assumed: one thread per track is the smallest model)* |
| Lifecycle | Find: selecting a track shows its thread again | MVP | Follows the track; M15 keeps chats |
| Lifecycle | Remove a thread or message | Later | Not in the pack |
| Lifecycle | Search across threads | No | Past the stop line |
| Connections | Track ↔ thread; follow-ups carry the thread's context | MVP | Follow-up chat box |
| Screen states | Empty (job buttons only), a few answers, long thread (scrolls, newest at the bottom) | MVP | |
| Trust | Stored in Supabase, back after reload and in another browser | MVP | M15, E9 |

**Genre group**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: the Mentor proposes groups among tagged tracks, each with a name and a reason (shared BPM, style mix, traits) | MVP | Scope 7, M12 |
| Lifecycle | When: on request, once enough tracks are tagged | MVP | *(assumed: "on request" with a minimum of a few tagged tracks; the pack gives no trigger or count)* |
| Lifecycle | Change: accept, rename, split | MVP | M12, E6 |
| Lifecycle | Remove / dismiss a proposal | MVP | Needed to say no to a bad proposal *(assumed: dismissing is the smallest way not to accept)* |
| Lifecycle | Merge groups, move one track between groups | Later | Not in the pack |
| Connections | Accepted names join My genre suggestions and genre suggestion (replacing Appendix A names, L55) | MVP | L55 |
| Screen states | Too few tagged tracks (says how many it needs), proposals, accepted list | MVP | New user starts with none |
| Trust | Each reason checks out against the tracks' own data | MVP | E6 |

**Taste session**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Start on request from the panel | MVP | Scope 8, M13 |
| Lifecycle | Two snippets from the library played via the SoundCloud player; pick one; say why (tap or type) | MVP | Scope 8 *(assumed: snippet length and position not set; a short part from the middle via the widget's seek)* |
| Lifecycle | The Mentor names what you described; the profile may update | MVP | Scope 8, scope 6 |
| Lifecycle | Series of rounds, scores over time | Later | Not in the pack |
| Connections | Library = analysed tracks; writes to the taste profile | MVP | |
| Screen states | Library too small (needs 2+ analysed tracks), playing A / B, a track unavailable on SoundCloud | MVP | New user state |
| Trust | Played by the official player, nothing recorded; the Mentor names your words, not what it "heard" | MVP | C2, honesty |

**Listen-next suggestion**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: from the profile + web, each with "because…" and a link | MVP | Scope 2, M7 |
| Lifecycle | Change: "more like this" / "not for me" feeds the profile | MVP | Scope 6 |
| Lifecycle | Save to a list, add to a SoundCloud playlist | Later | Past the stop line; SoundCloud write is off-limits |
| Lifecycle | Play the suggestion inside Six AM | Later | A link out is enough for the MVP *(assumed)* |
| Connections | Selected track (or none) + profile + web search | MVP | M7 |
| Screen states | Results, nothing found online (said honestly), a dead link | MVP | M8, E3 |
| Trust | Only real artists and tracks; links resolve | MVP | E3 |

**Cost record**

| Checklist | Row | Call | Reason |
| --- | --- | --- | --- |
| Lifecycle | Create: one per answer, from API usage (input, output, cache read/write tokens, web searches) and published prices | MVP | Scope 9, unit test 1 |
| Lifecycle | Show: "Today $x · <Month> $y" in the panel, per answer on hover, labelled estimate | MVP | Scope 9, M14 |
| Lifecycle | Warning at the 50th question of the day with "Continue anyway"; not a hard stop | MVP | Scope 9, E8 |
| Lifecycle | Count: every request the person starts (job button or chat) is a question; background profile updates add to cost but not to the count | MVP | *(assumed: the pack doesn't say what counts)* |
| Lifecycle | Day and month by the browser's local time; "Continue anyway" holds for the rest of that day | MVP | *(assumed: smallest reading; unit test 2 covers midnight and month change)* |
| Lifecycle | Budgets, hard caps, history charts | No | Past the stop line; "an estimate is the bar" |
| Connections | Stored with the answer in Supabase so Today/Month match across browsers | MVP | M15 |
| Screen states | $0.00 on a new day, a new month resets Month, the warning | MVP | Unit test 2 |
| Trust | Within $0.03 per day of real usage; always says "estimate" | MVP | E8 |

### Requirements

M1–M16 as in the kickoff pack; each is a pass/fail check in [`evals.md`](evals.md) by the grader
named here.

| # | Must | Check |
| --- | --- | --- |
| M1 | Panel slides in from the right on /analyse, follows the selected track, job buttons + follow-up chat, works with no track | user-tester |
| M2 | Explain an analysis in plain words with a source label on every fact | data-evals rubric |
| M3 | Genre suggestion; one click fills My genre; the owner's typed genre is never overwritten | user-tester + data-evals |
| M4 | Teach me a genre (structured teacher voice), with web sources as links | data-evals rubric |
| M5 | Ear-training prompts tied to the selected track | data-evals rubric |
| M6 | Studio starting point: tempo, key, loops from the existing crate (real loop names only) | user-tester + unit check against the crate |
| M7 | Listen next from the profile + web, each with "because…", links resolve, no invented artists or tracks | data-evals |
| M8 | Web search used when it helps; web never overrules Ears; "nothing online" handled honestly | data-evals |
| M9 | My taste profile read before every answer; readable and editable under Settings | user-tester |
| M10 | Setup step: playlists → draft profile → 3–5 tap questions (+ say more, track previews) → optional notes | user-tester (owner's hands for previews) |
| M11 | Learning from use updates the profile and shows "Updated: …" now and then | data-evals + user-tester |
| M12 | Genre groups proposed from tagged tracks with name + reason; accept, rename, split | data-evals + user-tester |
| M13 | Taste session: two snippets, preference + why, named back | user-tester (owner's hands) |
| M14 | Cost estimate per answer and Today/Month in the panel, labelled estimate; 50/day warning with Continue anyway | data-evals (vs usage) + user-tester |
| M15 | Supabase holds profile, chats, groups, results and My genre; nothing lost on reload or in another browser | user-tester |
| M16 | API key server-side only, route behind the access code; no audio ever sent to Claude | code read + network check |

Settings doesn't exist in Six AM today; M9 needs a place for it *(assumed: the smallest Settings
view, holding My taste and "run setup again", nothing else)*.

**No-gos:** never send audio to Claude, never store or upload audio (Ears' C2 stands); never claim
to have heard the music; no predefined taste data in the app (no Appendix A; L55 removed the last
two built-in lists); the API key never reaches the browser; no multi-user accounts. Ears' "no
server, no running costs" is superseded for the Mentor by decision 0027 (server route + Supabase).

**Rabbit holes:** fine-tuning prompts per genre; building a recommender of our own; scraping
SoundCloud beyond the widget; perfect cost accounting (an estimate is the bar).

**Feel:** the record-shop expert at the end of the counter: one short, honest answer about the
track in your hands, says how they know, and offers more if you want it. Panel frame as Ears
(rekordbox columns in the Six AM warehouse); voice a friendly record-shop expert (warm, plain,
short, jargon explained on first use), a structured teacher in "Teach me a genre". Avoid: all of
Ears' list, plus a chatty persona or emoji, walls of text (2–4 sentences then "Tell me more",
except teach mode), certain-sounding genre calls, flattery, claiming to have heard the music.

**Decided in the pack:** Claude Sonnet 5.5 for every job, prompt caching, short answers, adaptive
thinking at modest effort; a Next.js route behind the access code holds `ANTHROPIC_API_KEY`
(decision 0027); Supabase, the existing single-owner project (decision 0020); web search on when it
helps; test data the owner's public sets at
https://soundcloud.com/andreas-johansson-303905204/sets (not *B b baaangers*, which is private).

### Unit tests

From the pack:

1. **Cost estimate** from a usage object (input, output, cache read/write tokens, web searches) and
   the price table, incl. edge cases (no searches, all cached).
2. **Daily question count and the 50/day warning** across midnight and month change (and an empty
   history).
3. **Studio starting point:** suggested loops exist in the crate; tempo/key from the analysis.

### Success check (at wrap-up)

To fill in at wrap-up: each signal above with what happened, and whether the riskiest assumption
held (were the Mentor's genre calls and listen-next noticeably more "me" than a generic chat?).
