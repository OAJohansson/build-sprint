# Kickoff pack: Six AM, Ears v1

The owner's kickoff for a product (decision 0026). In Founder mode the owner writes it alone and
the PM session builds from it. Transcribed by the PM from the owner's brief of 23 Oct
([`kickoff-source.md`](kickoff-source.md), the full text with appendices); where this page and the
brief differ, the brief wins. The gaps the brief left (appetite, feel, things to avoid, genre display, batch analysis) were
settled by the owner on 23 Oct; see L3, L4, L19, L20, L21 in `decisions.md`.

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
| Speed | Result after listening ends; one track end to end | ≤ 10 s; ≤ 2½ min (owner, 23 Oct: was paste to result ≤ 90 s) |
| Playlist sorted | Tracks placed using Ears | all 56 |

**Guardrail:** no audio is ever stored, uploaded or downloadable (checked in storage and network).

## MVP and stop line

Ears v1, scope items 1–8 of the brief:

1. A new **Analyse** view in Six AM, alongside the Studio.
2. Paste a **SoundCloud track or playlist URL** → the official embedded player loads. For a
   playlist, show the track list and let me pick a track.
3. **Enable listening:** one "Allow tab audio" step per session, with clear instructions.
4. **Analyse:** 4 snippets of 30 s at about 20%, 40%, 60% and 80% of the track (2 min, skipping intro and outro; a 30 s preview uses what plays), with progress (owner, 23 Oct; was the first ~60 s).
5. **Result card:** top 3 genres with %, BPM, key and scale, energy, brightness; uploader genre
   tag and tags for comparison when available.
6. **Copy for Claude:** summary plus the Appendix B prompt to the clipboard.
7. **Set Six AM to this BPM:** one click sets the Studio tempo.
8. **Session list:** results stored locally, survive reload, export CSV/JSON.
9. **Queue** (owner, 23 Oct; was Phase 2): add tracks or "Analyse all" on a playlist; tracks are analysed one after another; the queue survives a reload and resumes after Enable listening.

**Ears v1.1** (owner, 24 Oct, after the v1 merge; a small slice, no new pack):

10. **My genre:** a field per track where I type my own genre (suggests the Appendix A family names
    and genres I've already used; free text allowed), saved locally with the result, in Copy for
    Claude and the CSV/JSON export.
11. **Filters:** a BPM range (min–max; a half/double-ambiguous track matches on either reading) and
    a genre filter on my genre ("All", each used genre, "No genre yet").

Out of v1.1: playlist filing (obsolete: the owner sorted *B b baaangers* by hand), automatic
genre families (needs the Mentor, Phase 3), playing a filtered list one after another (next).

**Stop line:** everything in the brief's "Out of scope" (arrangement map, stems live or offline,
built-in mentor, genre recipes, Remake mode, synths, AI generation, accounts, cloud sync, sharing,
mobile, non-Chrome browsers) and every roadmap phase goes to [`backlog.md`](backlog.md). The queue (item 9) is in; the owner moved it from Phase 2 into the MVP on 23 Oct.

## Requirements

Functional (F), non-functional (NF) and user stories (US) from the brief. Each becomes a pass/fail
check in `evals.md`.

| # | Must | Check |
| --- | --- | --- |
| F1 | Parse and validate SoundCloud track and set URLs (incl. `?si=`, `utm_`, `?in=` context) | Unit test over real URL shapes; invalid URL shows a message |
| F2 | SoundCloud Widget API for load, play, pause, seek, current sound, events (`PLAY`, `PAUSE`, `FINISH`, `READY`) | Widget events drive the UI |
| F3 | Tab audio via `getDisplayMedia` (audio required, video stopped at once) → Web Audio → `AudioWorklet` buffer in memory only | Non-silent RMS from the embedded player; no video track live |
| F4 | Resample to 16 kHz mono, mel patches, Discogs-EffNet inference via Essentia.js / TF.js, averaged over the window | Top styles printed for a captured window |
| F5 | Map the 400 Discogs styles to display names (no family grouping in the MVP, owner 23 Oct) | `Electronic---Deep House` → *Deep House* |
| F6 | BPM, key/scale, energy (RMS/loudness), brightness (spectral centroid) with Essentia.js over the same buffer | Values on the result card |
| F7 | Discard raw audio once features are computed; never write it to storage, never upload it | Storage and network inspection |
| F8 | Persist results (not audio) locally; export CSV/JSON | Reload keeps the list; files download |
| F9 | Copy for Claude builds the Appendix B text and writes it to the clipboard | Clipboard matches the template |
| F10 | Set the Studio project BPM from the result | Studio shows and plays at the new BPM |
| F12 | My genre per track: type or pick (Appendix A families + used genres), free text, saved with the result, in Copy for Claude and CSV/JSON (owner, 24 Oct) | Typed genre survives reload, shows in copy and both exports |
| F13 | Filters: BPM range (ambiguous tracks match on either reading) and my-genre filter (All / each used genre / No genre yet) (owner, 24 Oct) | Filters narrow the table as expected |
| F11 | Queue: add tracks or a whole playlist; analysed one after another; survives reload, resumes after Enable listening (owner, 23 Oct) | 3 queued tracks finish without touching anything |
| NF1 | Privacy and rights: no audio stored, uploaded or downloadable | Code review plus storage/network check |
| NF2 | Result ≤ 10 s after the capture window ends; inference off the main thread | Timing; Web Worker in use |
| NF3 | Models lazy-loaded on first use, browser-cached, loading state, download size shown the first time | First vs second run |
| NF4 | Desktop Chrome/Chromium only; unsupported browsers detected and explained | Safari/Firefox show the message |
| NF5 | Genres shown as probabilities, never one certain label | Result card copy |
| NF6 | AGPLv3 / non-commercial licence flagged in the README before any public release | README line |
| NF7 | Match the existing Six AM look (dark UI, monospace labels, warm accents, lane colours) | Design critic |
| US1 | Load SoundCloud: player loads ≤ 5 s; a playlist lists all tracks (beyond 15); invalid, private or geo-blocked shows a clear message | |
| US2 | Enable listening: explains the Chrome dialog; says so if not shared or silent and offers retry; detects Stop sharing | |
| US3 | Analyse in about 2 min (4 × 30 s snippets): visible progress, cancellable; top 3 genres with %, BPM (1 decimal), key + scale, energy and brightness as labels and bars; pauses with playback and resumes or restarts cleanly | |
| US4 | Compare with tags: uploader genre tag next to the audio result | |
| US5 | Ask Claude: copied text has title, uploader, URL, all results, uploader tags and the prompt | |
| US6 | Use the BPM: one click sets the Studio tempo | |
| US8 | Queue a playlist: press Analyse all, walk away, come back to every row filled (owner, 23 Oct) | |
| US7 | Keep my results: every analysed track listed, survives reload, exportable | |

**No-gos:**

- Never store, upload or record audio (C2): measurements only, raw buffers discarded.
- No server and no running costs for Ears: analysis is client-side; models load from their hosts
  in the browser. (The Studio's existing Supabase track storage, decision 0020, stays as is.)
- Chrome desktop only for the MVP.

**Rabbit holes:**

- Queue extras: reordering, priorities, parallel analysis, running without the tab audible.
- Arrangement map or stems "while we're in there".
- Making Studio tempo fully variable for synthesised loops and saved tracks (the Studio is fixed
  at 124 BPM today): F10 needs only the smallest change that works.
- Tuning the genre-family mapping beyond what the validation set needs.

## Feel references

Owner, 23 Oct: chose the "tool" direction (sketch A of three: tool, listening-booth moment, mix).

- rekordbox's track-analysis columns: scannable, every track one row, compare at a glance.
- The existing Six AM Studio: the same warehouse look, gold LCD numbers, monospace labels, warm
  accents, lane colours.

Shape that follows from it: a compact player bar with the listening progress on top, then a table
where every analysed track is one row (track, top-2 Discogs styles with %, BPM in gold, key, energy
meter, uploader tag), the current track highlighted. The session list is the main surface, not a
side panel; Copy for Claude and Set Studio BPM act on the selected row.

**The feel in one sentence:** rekordbox in the Six AM warehouse: run through a playlist and each
track's facts line up in calm, precise, scannable columns.

## Things to avoid

The PM's proposed list, accepted by the owner (23 Oct):

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
- **Genre display (owner, 23 Oct, option A):** raw Discogs styles only, as display names with %
  (e.g. "Deep House 58% · House 21% · Downtempo 7%"). No Appendix A family headline in the MVP;
  mapping styles to the owner's genre families is in the backlog.

## Unit tests

PM's call (L1 in `decisions.md`), the logic that would hurt most if silently wrong:

1. SoundCloud URL parsing (F1): track vs set, `?si=`, `utm_`, `?in=`, mobile and `on.soundcloud`
   short links, junk input.
2. Discogs style → display name (F5): known styles, unknown styles, ties.
3. BPM normalisation and half/double-time flag: 61 vs 122, 148 vs 74, edges of the house range.

---

# Kickoff pack: Six AM Mentor (Phase 2, Founder mode)

The owner's calls of 24 Oct, made one at a time in the parent session and transcribed here by the
PM (L45–L54 in `decisions.md`). The Mentor is the "Learn" step of the brief (`kickoff-source.md`,
pillar 3 "Mentor"). Ears v1 and v1.1 above are shipped; this pack builds on them.

**Mode:** founder
**Appetite:** no fixed day budget; the squad works unattended. Owner-hands steps (anything in real
Chrome, e.g. taste-session snippets) are batched into one ask with a page ready.
**Evals:** the "Mentor" part of `evals.md` · owner-only checks kept outside the repo

## Problem

Ears says what a track measures, but not what that means or what to do with it. Today the owner
pastes the Copy for Claude text into a separate chat, re-explains their taste every time, and the
answer never comes back into Six AM. Nothing learns their taste, and the genre words they use
aren't anyone's fixed list.

## Who

The same owner as Ears (a club-goer turned bedroom producer sorting SoundCloud by feel), and, for
the first time, **a new user with no brief**: the Mentor must work without predefined taste data
and learn the person from their own playlists and use.

## Moment of use and jobs to be done

At the laptop in the Analyse view, a track selected (or none, for general questions).

1. When I've analysed a track, I want it **explained** in plain words, saying where each fact
   came from, so I understand what I'm hearing.
2. When I'm tagging, I want a **genre suggestion** I can accept in one click (it fills My genre;
   my choice always wins), so tagging is fast and I learn the words.
3. When a genre name comes up, I want to be **taught** it (roots, traits, artists), so the words
   stick to music I know.
4. When I want to train my ear, I want **listening prompts** and **taste sessions** (pick between
   two snippets and say why), so I can name what I like.
5. When a track makes me want to make something, I want a **Studio starting point** (tempo, key,
   loops from the existing crate), so I can start straight away.
6. When I want more music like this, I want **listen next** suggestions that say why, from my
   taste and the web, so I find music I'll actually like.

Out: ME-7 remake coaching (backlog: "consider when building the Studio Lab and Remake mode").

## Today's alternatives

A normal Claude chat with Copy for Claude pasted in: good answers, but no memory of the owner's
taste, no link back into Six AM, and nothing learned from tagging. Genre wikis and RA/Discogs pages
explain genres but not the owner's library.

## Riskiest assumptions

- **Value (riskiest):** a taste profile learned from a few playlists plus use makes the Mentor's
  suggestions and listen-next noticeably more "me" than a generic chat.
- **Honesty:** the Mentor stays honest about sources and never claims to have heard audio, while
  still being useful (it only ever gets Ears' numbers, uploader tags, the web and the profile).
- **Feasibility:** Claude with web search answers within 15 s, and listen-next doesn't invent
  artists or tracks.
- **Viability:** cost stays small and visible (estimate per answer and per day/month).

## Success: what good looks like

Outcome: the owner uses the Mentor while sorting and learning, and its genre calls and suggestions
fit their taste better over time. The checkable versions are in `evals.md` (Mentor part).

## MVP and stop line

1. **Mentor panel** on the Analyse page: slides in from the right, follows the selected track, a
   button per job plus a follow-up chat box; works with no track selected for general questions.
2. **The six jobs** above (explain, suggest genre, teach, ear-training prompts, Studio starting
   point, listen next), every answer with source labels.
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

**Stop line:** ME-7 remake coaching; multi-user accounts; built-in Appendix A data; model choice
per job; anything past these ten items → `backlog.md`.

## Requirements

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

**No-gos:**

- Never send audio to Claude, never store or upload audio (Ears' C2 stands).
- Never claim to have heard the music.
- No predefined taste data in the app (no Appendix A).
- The API key never reaches the browser.
- No multi-user accounts.

**Rabbit holes:** fine-tuning prompts per genre; building a recommender of our own; scraping
SoundCloud beyond the widget; perfect cost accounting (an estimate is the bar).

## Feel references

Same as Ears (the tool: rekordbox columns in the Six AM warehouse) for the panel's frame. For the
voice: **a friendly record-shop expert** for everyday answers (warm, plain, short, jargon explained
on first use), and **a structured teacher** in "Teach me a genre".

**The feel in one sentence:** the record-shop expert at the end of the counter: one short, honest
answer about the track in your hands, says how they know, and offers more if you want it.

## Things to avoid

All of Ears' list, plus:

- A chatty persona or emoji.
- Walls of text: 2–4 sentences then "Tell me more" (except teach mode).
- Certain-sounding genre calls.
- Flattery.
- Claiming to have heard the music.

## Decisions already made

- **Model:** Claude Sonnet 5.5 (`claude-sonnet-5-5`) for every job for now; prompt caching; short
  answers; adaptive thinking at a modest effort (PM's call, logged). Read the claude-api skill for
  current API usage before writing code.
- **Backend:** a Next.js route behind Six AM's existing access code holds `ANTHROPIC_API_KEY`
  (server-side only; Vercel env for 07). A decision file records adding it.
- **Storage:** Supabase, the existing single-owner project (decision 0020).
- **Web search:** on when it helps, sources as links.
- **Test data:** the owner's public playlists at
  https://soundcloud.com/andreas-johansson-303905204/sets (not *B b baaangers*, which is private).

## Unit tests

1. Cost estimate from a usage object (input, output, cache read/write tokens, web searches) and the
   price table, incl. edge cases (no searches, all cached).
2. Daily question count and the 50/day warning across midnight and month change.
3. Studio starting point: suggested loops exist in the crate; tempo/key from the analysis.

# Kickoff pack: Six AM Arrangement map, template and sounds (Phase 3, Founder v2)

The owner's kickoff calls of 25 Oct, made in the parent session and transcribed here by the PM
(L100–L106 in `decisions.md`). Sources in `kickoff-source.md`: EA-6 (arrangement map), the
track-layers table and ST-9, LA-1/LA-2 (Synth Lab), LA-3 (AI sounds), GR (recipes), DR-4 (Remake,
past the line). Runs under Founder v2 (decision 0028): an early owner pick of 3 of ~10 designs,
one critic with the fixed scorecard, slices, the test sandbox, pre-approved routine actions.

**Mode:** founder (v2)
**Appetite:** one night: handed off on 25 Oct evening, done by the morning of 26 Oct. One owner
moment (the design pick); if it hasn't come by the time the non-visual work is done, the squad
continues on the critic's top 3.
**Evals:** the "Arrangement and sounds" part of `evals.md` · owner-only checks kept outside the repo

## Problem

The owner learns by copying tracks they love, but Six AM stops at "this is 124 BPM, A minor,
deep house". Nothing shows how a loved track is *built* (when the bass comes in, how long the
build is), nothing turns that into a starting point in the Studio, and the Studio's 48 fixed
loops can't be shaped, so a remake never gets the same DNA.

## Who

The owner: a beginner producer, house and techno lover, on a laptop in Chrome. Learns by
mimicking: "recreate something similar to the songs I like in the studio. Not completely a copy
but same DNA."

## Moment of use and jobs to be done

At the laptop with a track they love open in Analyse, then in the Studio.

1. When I love a track, I want to **see how it's built** (its sections on the bar grid and which
   layers play when), so I understand its structure.
2. When I don't get the structure, I want the **Mentor to explain it**, so I learn what a build or
   a breakdown does.
3. When I want to make something like it, I want **one click to a Studio track with the same
   bones** (tempo, key, length, section markers, empty lanes), so I start from its DNA.
4. When I fill the lanes, I want **sounds I can shape**: playable bass and chord synths with a few
   knobs, classic drum kits, so my version sounds like that kind of track.
5. When the crate has nothing close, I want to **generate a loop like this track** with AI and see
   what it cost, so I get closer without hunting for samples.

## Today's alternatives

Listening with a notebook and counting bars; YouTube "how X was made" videos; a real DAW with
sample packs (the cockpit the owner bounced off); Splice for samples.

## Riskiest assumptions

- **Feasibility (riskiest):** sections can be found from a full-track capture in the browser
  (measurements only) within 4 bars of where they really are, on most tracks.
- **Value:** a template with the reference's bones plus shapeable sounds gets the owner to "same
  DNA" in one sitting.
- **Feasibility:** an AI service makes a loop that's in key, on tempo and loops cleanly, cheaply
  and fast enough to use.
- **Viability:** AI cost per loop is small and visible.

## Success: what good looks like

The owner maps a loved track, opens it as a template and starts their own version with synths,
kits and maybe a generated loop, in one sitting. Checkable versions in `evals.md` (Arrangement
and sounds part).

## MVP and stop line

1. **Map:** analyse a whole track (full playback via the existing Ears tab capture, measurements
   only, audio never stored) and show its sections (intro, build, drop, breakdown, outro) on the
   bar grid, plus estimated per-layer activity (kick, bass, chords, hats, vocals) labelled as
   estimates. The Mentor can explain the structure.
2. **Template:** one click turns a map into a new Studio track with the same tempo, key, length
   and section markers, lanes ready and empty.
3. **Synths:** a playable bass (sub, 303 acid, reese) and chords (organ, Rhodes, pad), with a few
   knobs each (cutoff, resonance, envelope), always in key and on tempo; the Mentor explains the
   knobs.
4. **Drums:** classic free 909/808-style kits (kick, clap, hats). Licences checked (CC0 or
   similar) and recorded.
5. **AI loops:** "generate a bass loop like this track" via the winning service, cost shown in
   Six AM like the Mentor's. Stable Audio (Stability AI) and Google Lyria (Gemini API) tested on
   the same prompts (in key, on tempo, quality, cost per loop, speed); winner on evidence, the
   loser kept as a switchable fallback if cheap.

**Stop line:** the full layer model with automation and mixer (ST-5–ST-8), Remake mode and ME-7
coaching (DR-4), vocals, stems (DR-2, DR-3) → `backlog.md`.

## Slices (decision 0028: built, tested and fixed one at a time; one branch, one PR)

| Slice | Job | Contents |
| --- | --- | --- |
| S1 Map | 1, 2 | Full-track listen, section detection, layer activity, the map view, Mentor explains structure |
| S2 Template | 3 | Map → new Studio draft: tempo, key, length, section markers, empty lanes |
| S3 Sounds | 4 | Bass and chord synths with knobs, in key and on tempo; 909/808 kits; Mentor explains knobs |
| S4 AI loops | 5 | Service bake-off, "generate a bass loop like this track", cost shown, loops stored as the owner's files |

## Requirements

| # | Must | Check |
| --- | --- | --- |
| A1 | Full-track analysis through the existing tab capture; measurements only; no audio stored or uploaded | code read + network check |
| A2 | Sections (intro, build, drop, breakdown, outro) on the bar grid | data-evals vs reference times |
| A3 | Per-layer activity (kick, bass, chords, hats, vocals), every one labelled an estimate | user-tester + code read |
| A4 | The Mentor explains a track's structure from the map's numbers | data-evals rubric |
| A5 | One click: map → new Studio track with the same tempo, key, length, section markers, empty lanes | data-evals + user-tester |
| A6 | Bass synth (sub, 303 acid, reese) and chord synth (organ, Rhodes, pad), knobs: cutoff, resonance, envelope; in key and on tempo | data-evals (offline render) + user-tester |
| A7 | The Mentor explains each knob | data-evals rubric |
| A8 | 909/808-style kits (kick, clap, hats) from free samples, licences recorded | code read of the licence file |
| A9 | AI bass loop "like this track", in key and on tempo, via the winning service; cost per loop shown like the Mentor's | data-evals |
| A10 | Bake-off of Stable Audio vs Lyria recorded with numbers; winner logged with the reason | file in `evals-runs/` |
| A11 | AI keys server-side only, route behind the access code | code read + bundle grep |

**No-gos:** storing or uploading streamed audio; the AI keys in the browser; test data in the
owner's real records; anything past the stop line.

## Feel references

No new pictures (owner, 25 Oct): use the existing Six AM look (dark warehouse, mono labels, the
lane colours, the Studio's timeline) and the tool feel.

**The feel in one sentence:** the Studio's own bar grid, turned into a map of someone else's
track: quiet, exact, and clearly yours to build on.

## Things to avoid

All of Ears' and the Mentor's lists, plus: a DAW cockpit (rows of knobs, meters everywhere);
estimates that look like measurements; more than a few knobs per synth.

## Decisions already made

- AI services: both tested; keys `STABILITY_API_KEY` and `GEMINI_API_KEY` in the root
  `.env.secrets.local`, server-side only, set on Vercel as ops; each API's shape checked from its
  official docs before coding.
- Validation: reference section times for the validation tracks written down **before** seeing
  any result (like L35 for BPM).
- Graders use the test sandbox (`07-six-am-test`, port 3017, in-memory store); never the owner's
  real data.

## Unit tests

1. Seconds ↔ bars at a tempo, and snapping a boundary to the nearest 4- or 8-bar phrase (edges:
   a boundary at 0, past the end, a half-time tempo).
2. Map → template: length rounded to whole bars, markers on bars, tempo and key copied.
3. Notes in key: every synth note the patterns play is in the track's scale.

# Kickoff pack: Six AM Lab (Phase 4, Founder v2)

The owner's calls of 26 Oct, given in the parent session and transcribed here by the PM (L143–L149,
revised after the design pause by L153–L161 in `decisions.md`). Sources in `kickoff-source.md`: C2 "listen, never copy", DR-2 (live stems),
LA-1/LA-2/LA-3 (Lab). In the owner's words: "the arrangement map screen will become my lab where I
listen to a piece, get inspired and then create my own sound files. And then I can move over to
studio mode after and start combining all the files I created into new songs." Option B+C.

**Mode:** founder (v2)
**Appetite:** a spike of about 2 hours first; if it passes, the Lab in five slices over about a
night. Owner moments: the spike's real-Chrome listen, the design picks (3 of 10, then 1 of 3), the
final review.
**Evals:** the "Lab" part of `evals.md` · owner-only checks kept outside the repo

## Problem

The rough draft from "Start a track from this" sounds nothing like the original (owner, 26 Oct).
The map shows *when* parts play, but the owner can't *hear* one part of a streamed track on its own,
so they can't study a bassline or a chord stab, and nothing helps them make their own sound in that
spirit. Their sounds also don't outlive one Studio track.

## Who

The owner: a beginner producer who learns by copying tracks they love, on a MacBook (Apple silicon)
in Chrome. Most loved tracks are SoundCloud streams they can't download.

## Moment of use and jobs to be done (revised, L153)

The owner picks a track in Analyse, clicks Map, and lands on the arrangement map screen, which
becomes the Lab. Later, the Studio.

1. **See the whole song's structure** on a timeline with its layers (visuals help understanding).
2. **Re-listen and isolate parts**: play, seek, loop a section, solo or mute any part.
3. **Ask the Mentor about parts**: it knows what's soloed, where the playhead is and the track's
   numbers.
4. **Make a similar sound of my own** on the same screen, matching it by ear.
5. **Save it and use it later in the Studio** for new songs.

## Today's alternatives

djay Pro's Neural Mix with SoundCloud Go+ (licensed, but no learning or making); buying the track
and splitting it in a desktop stem splitter; YouTube "how X was made"; guessing by ear.

## Riskiest assumptions (the spike tests 1–3 first, L144)

1. **Feasibility (riskiest):** Chrome tab capture with `suppressLocalAudioPlayback` captures the
   SoundCloud audio while the original is *not* heard, so only Six AM's separated part is.
2. **Feasibility:** htdemucs runs in the browser (ONNX Runtime Web on WebGPU) on rolling ~6–10 s
   chunks faster than real time, at a delay of a few seconds.
3. **Value:** a soloed bass or drum part sounds usable for learning.
4. **Value:** a shaped synth or AI sound feels "inspired by" the part (owner's ear).

## Success: what good looks like

The owner plays a loved track in the Lab, solos the bass, asks the Mentor what makes it rubbery,
shapes their own bass toward it, saves it as "rubber sub", and drops it into a Studio track the same
evening. Checkable versions in `evals.md` (Lab part).

## MVP and stop line (revised, L154–L161)

Slices (decision 0028: built, user-tested, evaluated and fixed one at a time; one branch, one PR):

| Slice | Job | Contents |
| --- | --- | --- |
| S1 Listen | 1, 2 | The map as the Lab: 4 soloable parts (drums, bass, other, vocals) with estimated sub-layers inside (kick, hats… visible, not soloable) and a chord lane; Studio-like playback (play to the end, click to seek, click a section to loop, solo/mute any time, "catching up…" after a seek); the Deck window; delayed playhead |
| S2 Mentor | 3 | The Mentor on the same screen, aware of the soloed part, section, playhead and measurements |
| S3 Make | 4 | Synth beside the looping soloed part; level-matched A/B (original vs mine); tagged presets with 4–8 macro knobs; the Mentor's knob suggestions; local AI patch matching from the soloed part; Stable Audio loop as a secondary button |
| S4 Save | 5 | Personal library in Supabase: sound + loop linked (preset, knob values, note pattern), tags (part, key, BPM, source song), suggested name, rename |
| S5 Studio | 5 | Full lane model (~11 lane types in collapsible families; add, remove, rename, reorder; volume, pan, mute, solo per lane); library sounds drop into the matching lane type and stay editable |

**Stop line:** stored or exported stems of streamed tracks (never, C2); slow-down; live drum split;
sample search by sound; closeness meter; mixer sends and sidechain pump; automation lanes; ME-7
remake coaching (owner's backlog, L160); offline stems of owned files (DR-3).

## Requirements (revised)

| # | Must | Check |
| --- | --- | --- |
| B1 | Separation of streamed audio only in the browser, in transient memory: chunks played and dropped; a looped section's parts held only while the loop is on (L161); nothing of the original stored, exported or uploaded | code read + storage + network check |
| B2 | Original silent locally while parts play | settings check + owner's ear |
| B3 | Separation faster than real time on the owner's Mac; delay reported | measured ratio and delay |
| B4 | Map shows 4 soloable parts, each with estimated sub-layers (labelled estimates), and a chord lane | user-tester + code read |
| B5 | Play to the end, click to seek (with "catching up…"), click a section to loop it seamlessly, solo/mute any time; playhead shows what you hear | user-tester + data-evals (loop seam, playhead offset) |
| B6 | Mentor knows the soloed part, section, playhead and measurements; never claims to hear what it can't | data-evals rubric |
| B7 | Make: synth beside the looping part, level-matched A/B, tagged presets with 4–8 macros, Mentor suggestions; sounds in key and on tempo | data-evals (offline render, levels) + user-tester |
| B8 | AI patch matching runs locally on the in-memory part; no audio leaves the browser | network check + code read |
| B9 | AI loop prompts get text and measurements only | code read + network check |
| B10 | Library: sound + loop linked, tags, suggested name, rename; survives a reload; own sounds only | data-evals + user-tester |
| B11 | Studio full lane model (families, add/remove/rename/reorder, volume/pan/mute/solo); library sounds land in the matching lane and stay editable | user-tester + data-evals |

**No-gos:** storing or uploading any audio of the original, in any form; sending it to Stable Audio,
Lyria or any API; AI keys in the browser; test data in the owner's real records; past the stop line.

## Feel references

The existing Six AM look and the arrangement map screen as the starting point. Ten rough
prototypes, the owner picks 3, then 1 (L148). Restarted from the revised jobs after the pause
(L152): the first 10 rough directions are kept for reference only. Remove first: the owner dislikes
clutter. Competitive references (research in the parent session): Ableton/Logic stems as stacked
colour-coded lanes with solo; Logic's chord track; Ableton's time selection; Syntorial's match by
ear; Splice's key- and tempo-matched stacks; Learning Synths' step explanations.

**The feel in one sentence:** the map, with headphones on: one part at a time, quiet, and a clear
way from "I hear it" to "I made mine".

## Things to avoid

All earlier lists, plus: a mixer cockpit (four faders, meters, waveforms per stem); anything that
looks like it records or downloads the original; the Mentor describing a sound it can't measure as
if it heard it.

## Decisions already made

- Rights (L143): the original never leaves memory; AI gets words and numbers only; personal use;
  a public release would need a licence.
- Spike first (L144): **passed** (L150, L151): 3–4× real time live, ~5.5 s delay, original silent.
- Library in Supabase, the owner's own sounds only (L146, L158): sound + loop linked; graders use
  the test sandbox.
- Section loops and A/B replay the loop's separated parts from memory while the loop is on (L161).

## Cost estimate (L149, revised for the bigger scope)

| Item | Estimate |
| --- | --- |
| Claude for PM and squad (10 new rough designs, prototypes of 3, one critic, 5 slices incl. the Studio lane model, user tests, evals) | roughly $150–250, kept lean: one agent at a time, short briefs |
| Mentor calls (builders, tests) | ~$0.30 |
| Stable Audio (S3 checks and tests, ~20 draws at ~8 credits) | ~$1.60 |
| Model download (htdemucs, 180 MB, cached) and local patch matching | free |
| Supabase (existing free project) | free |

## Unit tests

1. Chunk plan and playhead sync (done: `src/lib/lab/stream.test.ts`, `sync.test.ts`): window and
   region positions, delay, pause, seek, empty history.
2. Section loop: loop start/end on bars, wrap-around, a loop longer than the buffer cap.
3. Library: tag normalisation and the suggested name.
4. Studio lane model: reorder, rename, and which lane type a library sound lands in.

# Kickoff pack (draft): Six AM Make for every layer (Phase 5, Founder v2)

**Status: draft for the owner.** Written by the Lab PM at the Lab wrap-up (27 Oct) so a fresh phase
session can start from `main`. The owner asked: "go ahead with building out the other layers for
the make feature". The questions below are the owner's to answer, one at a time, before the
pack is final.

**Mode:** founder (v2)
**Appetite:** to be set by the owner (proposal: one layer family per slice, about a night in all).
Owner moments: the answers below, the design picks (3 of ~10, then 1 of 3), the canvas sign-off,
the final review.
**Evals:** a "Make for every layer" part of `evals.md`, to be written from this pack.

## What Make does today (bass only)

- **Where:** the Lab's Make mode, beside a looped section of a streamed track. Rights as in the
  Lab (C2): the original stays in memory only, is never stored, saved, exported or uploaded, and
  is never sent to any API (Stable Audio included).
- **Pattern:** reads the looped bass part (notes, timing, which bars play) and plays it with a
  pure-TS synth (`src/lib/make/render.ts`), in key and on tempo.
- **Sound:** 4 presets (Round sub, Rubber pluck, Reese, Acid line) × 8 knobs (Tone, Length, Pitch
  drop, Drive, Wobble, Width, Sub, Weight). "Suggest settings" places gold ticks where the knobs
  come closest to the original (it never turns a knob). "Describe a bass in words…" makes an AI
  loop (Stable Audio, from words only).
- **Compare:** A/B at the same loudness (perceived, LUFS); "Drums under both" plays the original
  drums under both sides (L213); a blind A/B with `&blind=1`.
- **Measure:** the closeness score (0–100: per-step band envelopes plus the spectrum, L211); 37 →
  46 at defaults, 61 after Suggest. The owner: "sounds closer now but still not the same".
- **Save:** to the personal library (`sixam_sounds`, `/api/sounds`); in the Studio, My sounds in
  the crate, dropped onto the matching lane, editable in the lane's drawer (the track's own copy).

## What's open per layer family

| Family | What it is | What Make would need | Hardest part |
| --- | --- | --- | --- |
| **Drums** | One-shot hits (kick, snare/clap, hats, percussion) on a step grid | Hit detection per band (kick/hats bands exist), a step pattern, a drum synth per hit (kick pitch drop, noise for hats, clap) | The separated drums are one part: telling kick, clap and hats apart, and swing |
| **Melody / chords** ("other") | Pitched notes, often several at once (stabs, pads, leads, piano) | Note and chord reading (the Lab has chord names per 8 bars only), a poly synth with a few presets (stab, pad, pluck, organ) | Reading several notes at once reliably; "other" mixes many instruments |
| **Vocals** | A voice: words, pitch, chops | Probably not a copy: a pitch line for a lead synth, or vocal-like chops; the words are the artist's | Rights and taste: what "my own vocal" means here |
| **Texture / FX** | Risers, impacts, noise sweeps, atmosphere | A few generators (noise riser, downlifter, impact) timed to the section, not read note by note | Little to read from the original; mostly a sound palette |

## Questions for the owner (one at a time)

1. **Which family first?** Recommendation: drums, because they are the clearest to read (hits on a
   grid), the most different from bass, and the owner already wants their own kick next to Mine.
2. **Copy the pattern, or only the feel?** For drums: the same hits on the same steps, or a
   pattern in the same style that's the owner's own? (Bass copies the pattern today.)
3. **Vocals:** leave them out, make a lead synth that follows the vocal's pitch, or make
   vocal-like chops? Recommendation: leave out of this phase; it is the riskiest for rights and taste.
4. **One Make screen for every family, or a tailored one per family** (a step grid for drums, a
   keyboard roll for chords)?
5. **AI fine-tuning** (backlog): should the knobs be tuned toward the closeness score by a
   search or a model in this phase, or stay "Suggest settings" as today?

## Riskiest assumption

That separated parts other than the bass can be read well enough (drum hits by type, several notes
at once in "other") for Make's result to sound inspired by the original. Test it with a spike
first, as for the Lab: read the drums and "other" of 2 tracks and measure against a hand check
(hit timing ≤ 10 ms, kick/clap/hat labels, chord notes) before any design.

## Design round plan

1. Feature drill-down (objects, lifecycle, screen states) for the chosen families.
2. The designer builds ~10 directions for Make with several families; the owner picks 3.
3. The critic (one, fixed scorecard) scores the 3; the owner picks the final one.
4. **Canvas sign-off** (decision 0028 amended 27 Oct): the final screens on a Claude Design canvas,
   the owner comments in place; the UI build starts only after the owner approves.
5. Slices: one family per slice, each built, user-tested, evaluated and fixed before the next; one
   branch, one PR, one final review with an early owner listening check per family.

## Things to keep

- Clean and minimal (decision 0007); still framing, no per-keystroke motion.
- Make's current bass flow must keep working exactly as it does (saved sounds render unchanged).
- Graders use the sandbox (`ACCESS_CODE=test-code`, in-memory store), never the owner's real data.
