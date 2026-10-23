# Journey

What happened, what was decided and why. Newest last.

## To carry over

Entries for the shared pages, written once at wrap-up of the Ears phase (AGENTS.md).

- `docs/learnings.md` process changelog: first Founder-mode run (decision 0026) on a rebuild of an
  existing app rather than a new product; how the kickoff pack worked when written from a brief
  made with another agent.
- `docs/knowledge-bank.md` (technology): cross-origin audio and tab capture (`getDisplayMedia`
  with `preferCurrentTab`, why Web Audio can't tap an iframe but tab capture can).

## 18 Oct: discovery while Folio wraps up

- **Parallel work, kept safe.** Folio (06) is still being wrapped up in another session, so 07
  started in its own worktree on branch `07-discovery`, cut from `folio-ship-notes` (not `main`)
  so it carries the main-only Vercel config (decision 0016). Rules until Folio is merged: no
  `pnpm sync`, no notebook rebuild or republish; write only inside 07's own files; shared pages
  wait (list below); `pnpm new`'s README change was undone and gets regenerated after Folio; 07
  merges only after Folio. That also means the playbook's "ship the empty starter in the first
  hour" waits until Folio is merged.
- **First idea, parked.** Started with a self-discovery app (research-based questionnaires as a
  "character sheet", core values and needs applied to areas like work and love, reflection after
  each lens, retest framed as "still becoming"). Got as far as the MVP lenses, then the owner
  chose a change of theme: the last few products were all close to self-understanding. Saved with
  its decisions on the Problems page.
- **Pivot to music.** A tool to make house and techno as a beginner, on a laptop. Owner's lines:
  sleek and simple, made only for dance music, the producer is me (no AI-made music or
  AI-generated samples); the only AI allowed is turning a hummed melody into notes.
- **Shape.** Lanes (a jam grid like Ableton's Session View) instead of a timeline; every loop in
  one tempo and key so a beginner can't sound bad; recording the jam is the arrangement; the club
  moves (filter sweep, drop, pump) as single controls. Design inspiration: crate digging in a
  record shop, Berlin warehouse and Chicago house. Energy-curve drawing parked.
- **Library.** Most sample-pack licences forbid redistributing raw sounds in an app, so the MVP
  uses a curated crate of CC0 sounds; Freesound search (needs a small server route to hide the
  API key) comes later.
- **Humming → v2** (owner confirmed, brief signed off): mic access, Spotify's Basic Pitch model
  and snapping notes to key and tempo would double day one.
- **Name: Six AM**, the moment the warehouse lights come on. Picked from a brainstorm in the
  Bending Spoons spirit (inside reference, absurd out of context); can change later.

### To carry over after Folio (done 18 Oct, after Folio shipped on main)

- `docs/knowledge-bank.md`: Barnum effect (Forer, 1949); Johari window (Luft & Ingham, 1955);
  Wheel of Life (Paul J. Meyer); sample licensing (use in tracks vs redistribute in an app);
  audio-clock scheduling ("A Tale of Two Clocks", Chris Wilson). Each with 1–3 quiz questions.
- `docs/ideas.md`: already updated on this branch (self-discovery row, music row).
- `README.md`: run `pnpm sync` after Folio merges.
- Notebook: `pnpm sync && pnpm notebook`, then republish.

## 18 Oct: brief signed off, persona and test plan

- Owner confirmed the brief and humming in v2; setup committed on `07-discovery`.
- **Persona:** the owner (they/them), a house and techno lover who has never produced and closed
  the big DAWs after a look. Words to use are the club's (drop, pump, crate), not the studio's.
- **Test plan:** five scenarios on a 1440 × 900 laptop viewport: first sound, build and record a
  groove, the filter move, play it back after a reload, and a long run with the tab in the
  background. Key limit: the test agent can't hear, so it checks timing from the transport
  position and clip states; whether it sounds like house is the owner's ear test.
- Dev server moved to port 3007 so Six AM and Folio (3000) can run at the same time.

## 18 Oct: design session, Discover

- Ran `/design-session` for the main screen (the jam grid). Four random seeds gave four
  directions (Four on the floor, Turntable, Crate spines, Night bus board); the references gave
  Berlin warehouse, '80s drum machine, '70s hi-fi and Xerox club flyer; Gallery wall labels (far
  away) and Cloakroom tickets (sounds wrong) completed the ten.
- Owner found it hard to choose from one-liners and asked to blend all ten as references. Pushed
  back: blending averages into the generic look the method avoids. Instead built a **contact
  sheet** (thumbnail sketches): all ten as rough static frames of the same screen and content,
  `design/contact-sheet.html`, to pick three from pictures, not words.
- **Contact sheet rejected.** Owner: "childish, too simple", and the lanes concept didn't land at
  all; they expect a timeline. This is the brief's usability risk ("a beginner understands lanes
  without a tutorial") failing on its first user, before any code. The flat static frames also
  hid the time dimension, so "click a clip" had nothing to explain it. Only the Turntable caught
  their eye.
- **Decision: timeline first** (owner, 18 Oct). The main screen is a timeline you drag loops
  onto, with a record-crate sound browser to pick from; live jamming moves to the backlog. Why:
  it matches the owner's mental model (Jakob's law, Jakob Nielsen: people expect your product to
  work like the ones they already know, here GarageBand), and it shows the job "see what plays
  when". Card bet, brief (jobs, risks, MVP, requirements, unit tests) and test plan updated.
  Feedback 1 → fixing.
- Carry over: Jakob's law to the knowledge bank (design and UX).
- **Features agreed before layout** (content before layout). Looked at GarageBand's main window
  (control bar, tracks area, Loop Browser) and rekordbox 7 (dark, waveforms coloured by sound, a
  library list). The mix: GarageBand's layout with rekordbox's look and browser. MVP screen:
  control bar (play, back to start, bar and tempo display, filter, undo), four fixed tracks with
  mute, loops as waveform blocks that snap and repeat, a playhead, and the crate (groups, list,
  preview, drag). Not yet: volume per track, more tracks, zoom, loop-a-section. Brief updated.
- **Contact sheet 2** (`design/contact-sheet-2.html`): ten looks on that same anatomy, from
  Studio light (GarageBand) and Booth (rekordbox) to Warehouse, Record shop, Turntable, '70s
  hi-fi, '80s drum machine, Night bus, Gallery and Acid house; the crate moves between bottom,
  right and left.
- **Owner's three: 04 Record shop, 05 Turntable, 07 '80s drum machine.** Why, in their words:
  "I like the colours, they feel a bit warmer." Next: build them as working prototypes with
  `/prototype` (owner runs it).
- **Prototypes built** (`/prototype`): `apps/07-six-am/src/app/prototypes/main-screen`, three
  variants behind the picker on one shared engine (snap to bar, repeat in whole loops, overwrite
  on overlap, undo, mute, a silent playhead at 124 BPM). Record shop (night, sleeves on the left,
  the previewing record slides out), Turntable (daylight, a deck that spins what you preview),
  Drum machine (hardware keys mute tracks, LEDs show what's sounding, the crate as sample pads).
  Checked in the browser: drag from the crate, move, repeat, overlap trim, mute, delete, undo,
  play, preview. No sound yet.
- Shared files touched (watch at merge): `pnpm-lock.yaml` (07's dependencies) and
  `.claude/launch.json` (a `07-six-am` entry). If either conflicts with Folio, take main's and
  rerun `pnpm install`.
- **Crate at the bottom for all three** (owner, feedback 4): rekordbox's layout, the timeline
  full width on top. Record shop's sleeves now sit in a row and the previewing record is pulled
  up out of its sleeve; Turntable's deck sits bottom-left beside a three-column list.
- **One crate design for all three** (owner, feedback 5): Turntable's crate (a deck that spins
  what you preview, group tabs, a three-column list) is now a shared component, styled in Record
  shop's dark wood and Drum machine's beige hardware. The palettes stay as the difference. The
  sleeves and sample pads are gone.
- **Pick: Record shop.** Owner: "dark mood but with fun colours. That's how I like my music:
  fun Chicago house, disco-inspired tracks played in a dark, moody warehouse in East London."
  The block colours pop against the dark; retro but stylish, not overdone.
- **Intended aesthetic** (the yardstick for the critic): *fun Chicago house and disco colour
  popping against a dark, moody East London warehouse; retro, but stylish and never overdone.*
- Next: the Define phase, a critic loop on screenshots at laptop size (1440 × 900, not the
  skill's phone size, since Six AM is laptop-first).
- **Critic round 1: 6/10.** Top gap: brown-on-brown, nothing pops. Fixed: near-black base,
  more saturated block colours, serif only for logo and deck title (mono elsewhere), colour
  bars on track headers, a coloured drop preview with its bar number. Not taken, because they
  go against the owner's picks: back to sleeve tiles, remove the deck.
- **Critic round 2: 6/10, not rising**, so stopped and showed the owner (skill rule). Top gap
  now: solid colour blocks swamp the dark (wants dark tinted clips with coloured waveforms,
  rekordbox-style), which contradicts the owner's "the bars pop nicely against the dark".
- Owner asked to see the critic's version. Built as a fourth picker option, **Critic's take**
  (Record shop with all six round-2 notes: tinted clips with coloured waveforms and full colour
  only under the playhead or when selected, half-height waveforms, no turntable but a stop-
  preview button, crate dots only on loops already used, the drag ghost outlined with its bar
  marked on the ruler, a quieter transport). The owner compares before and after.
- **Owner's pick: Critic's take, with the vinyl player kept bottom left** (feedback 7). So the
  owner overruled one critic note (the deck) and accepted the rest, including the dark tinted
  clips, despite liking the solid blocks earlier: seeing both side by side changed their mind.
- **Deliver, subtract** (what breaks if it's gone?): removed the "On the deck" label (also an
  eyebrow tell); the ruler now labels every 8 bars, house's phrase length, instead of every 4
  (grid lines stay at 4). Also removed the dot on loops already in the track; owner: you can
  use the same loop many times, so it has no purpose. Everything else kept.
- **Deliver, AI tells** (against `tells.md`): no gradients, glows, cards-in-cards, emoji, sparkles
  or hype copy left. Two candidates shown before/after: the boxed "M" buttons (pills on
  everything) and monospace on every label (reads like a code editor; a possible new tell for
  the list). Owner: plain "M" that fills only when muted; keep the mono, it matches the retro
  readout and the hardware feel (so not added to the tells list).
- **Deliver, copy:** owner keeps the copy as it is for now.
- **Logo** (owner asked, using the `design` skill): its AI generator needs a Gemini key (not set,
  and a paid spend decision), and its brief suggested neon glow (an AI tell, and against "never
  overdone"). So four hand-drawn SVG marks in the four timeline colours instead
  (`design/logo-options.html`): Sunrise record, Four to the floor, Six o'clock, The build.
  Owner picked **Sunrise record**; it now sits next to the name, with a faint outer ring so the
  black disc stays visible on the dark bar. Next: promote the winner into the real app.
- **Promoted** (owner, 18 Oct): the main screen is now the app's home page. Rules in
  `src/lib/timeline.ts` with unit tests for snap to bar, repeat in whole loops and overwrite on
  overlap (8 passing; the brief's unit-test pick); the studio in `src/components/studio/`; one
  CSS module with the final values; IBM Plex Mono and Instrument Serif in the layout; the logo
  as the favicon. The prototype route, the other variants and the picker are deleted; the
  contact sheets and logo options stay in `design/` as the record. Marked shortcuts: made-up
  crate with no audio, drawn waveforms, a silent rAF playhead, nothing saved yet.

## 18–19 Oct: real sound

- Folio had already shipped on main; merged main in and did the parked carry-over (knowledge
  bank, to-do, README, notebook).
- **Synthesis first** (owner, decision 0019): every loop is a recipe (an instrument plus notes
  on a 16-step grid) in A minor at 124 BPM, played by Tone.js instruments: a 909-style kit, a
  303-style acid line, sub, reese, stabs, pads, organ, strings, piano, shaker, FM chop, ride,
  cowbell and noise sweeps. Samples from Freesound later.
- **Timing on the audio clock:** a lookahead scheduler books notes 120 ms ahead every 25 ms; the
  playhead reads the audio clock instead of counting frames. The timeline becomes one 1024-step
  index (`src/lib/schedule.ts`, unit tested: repeats, cut-short notes, empty timeline, a repeat
  ending where the next loop starts, starting mid-bar). 14 tests pass.
- Mute silences a track's channel, the filter knob sweeps a master low-pass (now starts fully
  open), clicking a loop previews it in time with the track, or on its own when stopped.
- Checked in the browser with a temporary level meter (the test agent can't hear): sound while
  playing, drums louder when they come back at bar 41, quieter with drums muted, silent after
  stopping, preview plays on its own. Whether it *sounds* like house is the owner's ear test.
- **Owner's first listen: "sounds great."** One gap: no visible way to remove a loop (Delete
  works but nothing on screen says so; a discoverability problem, Don Norman's signifiers).
  Added drag to the bin: hold a block for a quarter of a second, or start dragging it, and a
  bin covers the crate ("Drop here to remove"); over it the block dims and the bin turns red;
  let go and the loop is removed (undo brings it back). Feedback 8.

## 19 Oct: saving

- Owner asked for saving and a UI for saved tracks, plus song analysis (upload a track or use
  Spotify to see how it's built) and more sounds. Song analysis and more sounds went to the
  backlog; Spotify closed its audio-analysis API to new apps in late 2024, so analysing an
  uploaded file is the likelier route.
- **Where to save: Supabase** (owner: "I want my tracks on any device"), decision 0020: one
  `sixam_tracks` table in the project CrossFit, Scribble and Folio share; name plus the whole
  arrangement as JSON; server routes only, with the secret key; an access code as the login; an
  in-memory store in development. Pattern copied from Folio.
- **The UI:** autosave a moment after each change ("Saving…" → "Saved", or "Not saved · Retry");
  the track name in the bar, click to rename; a My tracks panel with New track, open, and delete
  with a confirm step. A first visit starts from the demo track ("My first track").
- `src/lib/ago.ts` ("5 min ago", "yesterday") with tests for midnight, month end and a missing
  date (decision 0011); 18 tests pass. Block ids are random now, so blocks added after
  reopening a track can't clash with saved ones.
- Checked in the browser on the in-memory store: an edit and a rename survive a reload; new
  track, switching back and deleting work. Not yet checked against the real Supabase (the owner
  runs the schema and adds the keys).
- **Live on the real Supabase** (owner ran the schema, added the keys and typed the code): the
  first track was created in the database, saves return 200, a reload loads it back, a mute and
  unmute each save. Fixed a wasted save on every load (React's development mode runs effects
  twice; autosave now compares with the track as loaded instead of skipping the first run).

## 19 Oct: more sounds

- Owner chose more synthesised loops first (always in key) over Freesound samples. The crate
  doubled to **48 loops, 12 per group**: garage, disco hats, rimshots, tribal toms, techno
  thump and a snare fill; disco octaves, acid squelch, walking funk, sub stabs, deep pluck and
  rolling sixteenths; Rhodes, disco strings, house organ, a dub chord with echo, a sunrise arp
  and gospel chords; congas, clave, tambourine, a downlifter, a rave siren and vinyl crackle.
- New instruments for them (toms, rim, octave bass, pluck, FM electric piano, dub echo, arp,
  conga, clave, tambourine, siren, crackle); each noise sweep now has its own synth, so a
  riser and a downlifter can overlap. The crate list scrolls (two rows show at a time).
- A test now checks the crate and the recipes agree (every loop has notes, inside its length,
  12 per group); 21 tests pass.
- Level check with a temporary meter: all 24 new loops sound. The disco strings were nearly
  silent (a slow string attack can't speak in a 16th note), so they got their own fast-attack
  synth; six quiet ones were turned up to sit with the originals.
- **Owner hit an error message** while trying them (feedback 9): "reading 'bars'" of
  undefined, every 25 ms. The sound engine had started before the new loops existed and the
  dev server's hot reload kept that old engine running, so previewing a new loop crashed its
  scheduler tick. Can't happen on the live site, but the scheduler is now defensive: a loop or
  instrument it can't play is skipped and reported once, and the music keeps going. All 48
  previewed cleanly after a fresh reload.

## 19 Oct: shipped and wrapped up

- Owner: "ship and wrap up now, leave the rest in the backlog." Skipped, and logged at the top of
  the backlog: `break-ui`, the guidelines review, the simulated user test and a second-device test.
- Wrap-up: success check in the brief (honest: owner's use only, no user test), retro with three
  process changes made in the playbook, key learnings, interview story, card set to shipped.
- Merged to `main` (PR #35); the owner ran `pnpm ship 07-six-am`. **Live at
  https://six-am.vercel.app.** Checked: the page, logo and access-code screen load, the API
  refuses a missing or wrong code (so `ACCESS_CODE` is set), and with the owner's code their
  tracks load from Supabase. The first load after a deploy took a moment (two database trips
  in a row on a cold server); logged in the backlog.

## 20 Oct: installable as a Dock and home-screen app

- Owner asked for Six AM as an installable web app, done in its own worktree and branch (the new
  "Parallel sessions" rule) while Selvedge is built in parallel.
- Copied Scribble's pattern (03): a web app manifest (`display: standalone`, warehouse colours),
  an icon drawn in code (the favicon's record with the striped sun label; 180, 192 and 512 px) and
  Apple web-app tags. Safari's Add to Dock (Mac), Chrome's Install, or Add to Home Screen open it
  in its own window with no browser bar. The SVG favicon stays for browser tabs.
- Scope call: install only, no offline mode or service worker. Six AM needs the network for its
  tracks (Supabase), so offline would be a bigger, separate build.
- Heads-up: an installed web app keeps its own storage, so the access code is asked once in the
  installed app; the tracks come back from Supabase.
- Checked: production build passes, manifest and all three icons served (PNG), app loads with no
  console errors.
- **Live** (20 Oct): PR 45 merged; Vercel's auto-deploy of `main` went Ready and
  https://six-am.vercel.app now serves the manifest and icons (PNG), the API still asks for the
  access code. `pnpm ship 07-six-am` stopped at its env-var step ("Invalid JSON (400)" from
  `vercel api ... env?upsert=true`); not needed here since the project already had its env vars.
- **`pnpm ship` env-var bug fixed** (21 Oct). Root cause: the Vercel CLI (54.x) parses the
  `--input` body, but its HTTP client only JSON-encodes plain objects, so the env-var *array* went
  out as "[object Object]" and Vercel answered "Invalid JSON". It only bit when re-shipping an
  existing project that has env vars (first deploys send one object; Mallow has no env vars).
  Fix in `scripts/ship.mjs`: one upsert per env var, and `vercelApi` refuses arrays with a clear
  message. Checked without touching real values: `{}` gets Vercel's "missing `key`" validation
  error, `[{}]` gets "Invalid JSON".

## 23 Oct: Ears v1, the first Founder-mode session

- **Owner's call:** rebuild Six AM beyond its MVP, starting with **Ears v1** (paste a SoundCloud
  link, play it in Six AM, capture tab audio, get top-3 genres, BPM, key, energy and brightness in
  about a minute, Copy for Claude, set Studio BPM, local session list). Run as the first Founder
  session (decision 0026): the PM session runs the squad, the owner writes the kickoff and judges
  the result. Hard rule: works with streamed, undownloadable tracks; never stores or uploads audio.
- **Kickoff pack** transcribed from the owner's brief (copied in as `kickoff-source.md`):
  `kickoff.md`, `evals.md` (part 1) and `decisions.md` added, matching `pnpm new --mode founder`.
  Card set to `mode: founder`, `status: building`. Out-of-scope items and roadmap phases moved to
  `backlog.md`.
- **Gaps sent to the owner in one message** (L2): appetite, feel references and sentence, things
  to avoid, genre display (style vs family vs both), batch analysis in MVP or Phase 2. PM defaults
  stand, marked "owner to confirm", until answered. The laptop question is answered: MacBook Pro,
  Apple silicon.
- **Found in the repo** (brief's open question 2): the Studio's tempo is a constant (`BPM = 124` in
  `src/lib/timeline.ts`, loops synthesised at it), so F10 needs the tempo to become variable; kept
  to the smallest change (rabbit hole noted in the pack).
- **Owner's answers, gaps 1 and 5** (relayed from the parent session): no fixed appetite, the
  squad may work overnight, but the owner has about 3 hours for anything that needs their hands
  (L3); batch analysis is Phase 2 (L4). Feel, things to avoid and genre display are still being
  discussed; the owner wants the design as close to the existing MVP as possible. PM defaults stay
  provisional until relayed.

- **Step 0 capture spike page** ready (`apps/07-six-am/public/spike/capture.html`, throwaway, served at localhost:3007/spike/capture.html): SoundCloud widget loads and reports READY in 2.4 s with the right title in the built-in browser; tab capture needs the owner in real Chrome (asked).
- **Discovery (light)** done by the `discovery` agent: Ears section appended to `brief.md`, persona
  and test plan updated (S1–S5). Its assumptions are logged as L5–L11; the PM settled the first-run
  timing question (L12), how capture is graded given agents can't click Chrome's picker (L13) and
  the private/geo-blocked test case (L14).
- **Playlist check in the spike** (in the built-in browser, no owner needed): *B b baaangers* no
  longer loads in the widget (ERROR; oEmbed 404), so it looks already emptied or private: the owner
  has sorted it into genre sets (Gospel in the Forest, Bounce Therapy, The Category Is: SERVE, You
  Are Edging Me, Groove & Shoulder, To the Warehouse, House Reworks, and more). The widget lists a
  set's tracks, but only the first ~5 come with full details (House Reworks: 9 tracks, 5 with
  titles; Groove & Shoulder: 6, 5): the build must fetch the rest (e.g. by skipping to them)
  before listing. One set (cunty-lil-bangers) gives a widget ERROR: a useful real test for US1's
  "clear message".
- **Step 0 capture spike: PASS** in the owner's Chrome 154 (87% audible, peak -10.5 dBFS, 32.7 s at
  44.1 kHz): tab capture hears the cross-origin SoundCloud player. Proceed, no fallback (L15).
- **Why the track stopped at ~33 s:** SoundCloud served a 30 s preview. The widget says so:
  `policy: "SNIP"`, `duration` 30000 against `full_duration` 429270 (7:09 of audio). Checked all 10
  validation tracks through the widget: only track 1 (Hard Reset, Redemption) is a preview; the
  other 9 are `ALLOW` with full length. `monetization_model` is `NOT_APPLICABLE`, so it isn't a
  Go+ track; it's the uploader's or a region setting, and it snips the same signed out and in the
  owner's Chrome. Ears detects SNIP and analyses the preview, labelled as such (L16).
- **Genre display, owner's call (option A):** raw Discogs styles only in the MVP; families to the
  backlog. The genre eval now uses a match set of Discogs styles per validation track, written
  before any result (L19). Discogs has no ballroom or "melodic house" style, so tracks 8 and 10
  use the closest styles.
- **Feel, owner's call:** "I think I prefer the tool version", sketch A of three shown in the
  parent session (rekordbox-style table of analysed tracks under a compact player bar). The session
  list becomes the main surface; actions work on the selected row (L20).
- **Things to avoid, owner's call:** "I'm happy with the default list" (L21). All kickoff gaps settled; the pack is complete and the squad runs without further kickoff questions.
- **Step 1 model spike built** by the engineer (`/spike/model`, worker and features in
  `src/lib/ears/`): Discogs-EffNet ONNX in a worker, mel and features in plain TS (L22, L23, T1).
  PM smoke check of `?test=tone` in the built-in browser: Test PASS, BPM 124, A minor, model from
  cache in 0.1 s (18 MB), inference 294 ms for 30 s, top styles Minimal Techno / Minimal / Techno /
  Tech House. Real tracks need the owner's Chrome (asked: FOVOS Work, Gag On It remix, Knober
  Realize; the brief's Brejcha example has no URL, so Realize stands in for the minimal/tech end).
