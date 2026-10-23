# Kickoff pack: Six AM, Ears v1

The owner's kickoff for a product (decision 0026). In Founder mode the owner writes it alone and
the PM session builds from it. Transcribed by the PM from the owner's brief of 23 Oct
([`kickoff-source.md`](kickoff-source.md), the full text with appendices); where this page and the
brief differ, the brief wins. Lines marked **(owner to confirm)** are gaps the brief left, filled
with the PM's recommended default until the owner answers.

**Mode:** founder
**Appetite:** no fixed day budget (owner, 23 Oct: the laptop stays on so the squad can work
overnight). The constraint is the owner's hands: anything needing them (the capture spike in real
Chrome first) must be ready within about 3 hours of kickoff, before the owner goes to bed. The
scope stays Ears v1; if something has to give, cut in this order: playlist track list (track URLs
only), CSV export (JSON only), uploader tags.
**Evals:** `evals.md` (agent-checkable part) · owner-only checks kept outside the repo

## Problem

A house and techno lover can't tell what genre the SoundCloud tracks they love really are, because
uploader tags are loose or missing and the same song can be three genres depending on the remix.
Today it costs hours of metadata research per playlist (56 tracks in *B b baaangers*, about 10
still uncertain without hearing them), and existing analysis tools need an audio file, while most
of this music is streamed edits and bootlegs that can't be downloaded. Listening, learning and
making live in separate tools, and curiosity dies in the gaps.

## Who

The builder: a club-goer turned bedroom producer who loves the London/Berlin queer underground
(Adonis, Gideön, Panorama Bar), emotive vocal house, melodic techno and hard trance. Collects on
SoundCloud, mostly undownloadable remixes. No music training; learns by doing, needs plain words
tied to tracks they love. Works on a MacBook Pro (Apple silicon) in desktop Chrome. "Worth it" =
visible progress: a playlist actually sorted, a genre actually understood.

## Moment of use and jobs to be done

At the laptop, going through a SoundCloud playlist, curious about one track at a time; sometimes
straight before opening the Studio to make something.

1. When I love a SoundCloud track but don't know its genre, I want to play it in Six AM and see
   its top genres, BPM, key and energy, so I can name what I'm hearing.
2. When I'm sorting my dump playlist, I want the analysis plus a ready-made question for Claude,
   so I can file each track in the right genre playlist (Appendix B of the brief).
3. When a track makes me want to make something, I want to set the Studio to its BPM in one
   click, so I can start in the same tempo.

(Sorting a whole playlist at once is the same job at scale: in the MVP it's done track by track,
with results kept across sessions.)

## Today's alternatives

From the brief's "options considered":

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

Why switch: Six AM hears the actual streamed audio, keeps only measurements, and sits next to the
studio where the track gets made.

## Riskiest assumptions

- **Feasibility (riskiest):** Chrome tab capture (`getDisplayMedia`, this tab, tab audio) can hear
  the cross-origin embedded SoundCloud player inside Six AM, **and** Discogs-EffNet gives sensible
  genres on this music. Tested first: Step 0 capture spike, then Step 1 model spike, before any
  real build.
- **Value:** seeing genre/BPM/key/energy and getting it explained makes me learn the genres faster
  and finish sorting the playlist.
- **Usability:** granting tab audio once per session (choose this tab, tick Share tab audio) is
  acceptable.
- **Viability:** Essentia.js and its models are AGPLv3 / non-commercial: fine for personal use,
  revisit before any public release.

## Success: what good looks like

Outcome: I use Ears to place all 56 tracks of *B b baaangers* into genre playlists.

| Signal | How measured | Target |
| --- | --- | --- |
| Genre agreement | Top-1 or top-2 vs the reference call, 10-track validation set | ≥ 7 / 10 |
| BPM accuracy | ±2 of reference, or half/double-time flagged | ≥ 8 / 10 |
| Speed | Paste to result | ≤ 90 s |
| Playlist sorted | Tracks placed using Ears | all 56 |

**Guardrail:** no audio is ever stored, uploaded or downloadable (checked in storage and network).

## MVP and stop line

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

**Stop line:** everything in the brief's "Out of scope" (arrangement map, stems live or offline,
built-in mentor, genre recipes, Remake mode, synths, AI generation, accounts, cloud sync, sharing,
mobile, non-Chrome browsers) and every roadmap phase goes to [`backlog.md`](backlog.md). Batch
analysis of a whole playlist (autoplay queue): Phase 2 (owner, 23 Oct).

## Requirements

Functional (F), non-functional (NF) and user stories (US) from the brief. Each becomes a pass/fail
check in `evals.md`.

| # | Must | Check |
| --- | --- | --- |
| F1 | Parse and validate SoundCloud track and set URLs (incl. `?si=`, `utm_`, `?in=` context) | Unit test over real URL shapes; invalid URL shows a message |
| F2 | SoundCloud Widget API for load, play, pause, seek, current sound, events (`PLAY`, `PAUSE`, `FINISH`, `READY`) | Widget events drive the UI |
| F3 | Tab audio via `getDisplayMedia` (audio required, video stopped at once) → Web Audio → `AudioWorklet` buffer in memory only | Non-silent RMS from the embedded player; no video track live |
| F4 | Resample to 16 kHz mono, mel patches, Discogs-EffNet inference via Essentia.js / TF.js, averaged over the window | Top styles printed for a captured window |
| F5 | Map the 400 Discogs styles to display names; optionally group into Appendix A families and show both | `Electronic---Deep House` → *Deep House* |
| F6 | BPM, key/scale, energy (RMS/loudness), brightness (spectral centroid) with Essentia.js over the same buffer | Values on the result card |
| F7 | Discard raw audio once features are computed; never write it to storage, never upload it | Storage and network inspection |
| F8 | Persist results (not audio) locally; export CSV/JSON | Reload keeps the list; files download |
| F9 | Copy for Claude builds the Appendix B text and writes it to the clipboard | Clipboard matches the template |
| F10 | Set the Studio project BPM from the result | Studio shows and plays at the new BPM |
| NF1 | Privacy and rights: no audio stored, uploaded or downloadable | Code review plus storage/network check |
| NF2 | Result ≤ 10 s after the capture window ends; inference off the main thread | Timing; Web Worker in use |
| NF3 | Models lazy-loaded on first use, browser-cached, loading state, download size shown the first time | First vs second run |
| NF4 | Desktop Chrome/Chromium only; unsupported browsers detected and explained | Safari/Firefox show the message |
| NF5 | Genres shown as probabilities, never one certain label | Result card copy |
| NF6 | AGPLv3 / non-commercial licence flagged in the README before any public release | README line |
| NF7 | Match the existing Six AM look (dark UI, monospace labels, warm accents, lane colours) | Design critic |
| US1 | Load SoundCloud: player loads ≤ 5 s; a playlist lists all tracks (beyond 15); invalid, private or geo-blocked shows a clear message | |
| US2 | Enable listening: explains the Chrome dialog; says so if not shared or silent and offers retry; detects Stop sharing | |
| US3 | Analyse in about 60 s: visible progress, cancellable; top 3 genres with %, BPM (1 decimal), key + scale, energy and brightness as labels and bars; pauses with playback and resumes or restarts cleanly | |
| US4 | Compare with tags: uploader genre tag next to the audio result | |
| US5 | Ask Claude: copied text has title, uploader, URL, all results, uploader tags and the prompt | |
| US6 | Use the BPM: one click sets the Studio tempo | |
| US7 | Keep my results: every analysed track listed, survives reload, exportable | |

**No-gos:**

- Never store, upload or record audio (C2): measurements only, raw buffers discarded.
- No server and no running costs for Ears: analysis is client-side; models load from their hosts
  in the browser. (The Studio's existing Supabase track storage, decision 0020, stays as is.)
- Chrome desktop only for the MVP.

**Rabbit holes:**

- Batch/autoplay analysis of whole playlists (6 h for 56 tracks).
- Arrangement map or stems "while we're in there".
- Making Studio tempo fully variable for synthesised loops and saved tracks (the Studio is fixed
  at 124 BPM today): F10 needs only the smallest change that works.
- Tuning the genre-family mapping beyond what the validation set needs.

## Feel references

**(owner to confirm)** The brief gives NF7 only; the PM's recommended references:

- The existing Six AM Studio — the look itself: dark UI, monospace labels, warm accents, lane
  colours. Ears must feel like a second room of the same club, not a new app.
- rekordbox's track analysis in the library — dense, legible facts (BPM, key) in a row you trust
  at a glance.
- A record-shop listening booth — you play a record and someone knowing tells you what it is.

**The feel in one sentence:** a listening booth in the same warehouse as the Studio: play a track
you love and the facts come back calm, honest and precise, in Six AM's dark, warm, monospace look.
**(owner to confirm)**

## Things to avoid

**(owner to confirm)** The PM's recommended not-list:

- Certainty: never "This is Deep House"; always probabilities.
- Anything that looks like record, download or save-audio (no record dot, no waveform of the
  captured audio kept).
- A new visual language: no light theme, gradients, glassmorphism or "AI sparkle" icons.
- Motion while it listens beyond one progress indicator (owner's standing rule: feel comes from
  still framing and sound).
- Spinner-only waits: model download and analysis always show what is happening and how long.

## Decisions already made

- **Browser-only stack:** SoundCloud Widget API (official embed, no API key) for playback;
  `getDisplayMedia` tab capture of Six AM's own tab (`preferCurrentTab`) for listening; Web Audio
  `AudioWorklet` buffer in memory; Essentia.js + Discogs-EffNet (TF.js) in a Web Worker for genres
  and features. Versions and APIs to be verified by the squad.
- **Results stay local:** localStorage/IndexedDB, never audio.
- **Copy for Claude instead of a built-in mentor** (Wizard of Oz) until it proves valuable; the
  template is in Appendix B of the brief.
- **Platform:** desktop Chrome on the owner's MacBook Pro (Apple silicon). (Answers the brief's
  laptop question; it matters for Phase 4 live stems.)
- **Fallbacks if capture fails** (brief's Risks table): play in a separate SoundCloud tab and
  capture that tab; capture system audio; or a small Chrome extension using `chrome.tabCapture`.
- **Genre display:** both: the Appendix A family as the headline, the raw Discogs style and % under
  it. **(owner to confirm)**

## Unit tests

PM's call (L1 in `decisions.md`), the logic that would hurt most if silently wrong:

1. SoundCloud URL parsing (F1): track vs set, `?si=`, `utm_`, `?in=`, mobile and `on.soundcloud`
   short links, junk input.
2. Discogs style → display name and genre family (F5): known styles, unknown styles, ties.
3. BPM normalisation and half/double-time flag: 61 vs 122, 148 vs 74, edges of the house range.
