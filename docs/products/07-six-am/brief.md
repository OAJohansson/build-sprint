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
