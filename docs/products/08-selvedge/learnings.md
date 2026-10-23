# Learnings

What building this product taught me.

- **Spikes answer questions cheaply, and need a stop.** The share probe (an hour) changed the
  capture design; the character spike proved the idea in four drawings. Then it ran on into a
  Claude-only test, research and a draw-on, and the owner had to call time. Next time: set the
  question and the timebox before the spike starts, and stop when it's answered.
- **A pick is a keep.** The critic loop rebuilt the Sketchbook design the owner had just picked
  and loved; it had to be restored from git. Test changes on a copy, next to the pick.
- **A critic with no memory goes in circles.** Two rounds at 5/10, with round 2 reversing round
  1's notes; after two flat rounds the owner's eye beats a third round.
- **Let each tool do what it's good at.** An image model paints; Claude writes the code that
  animates it. Asking Claude to paint in code gave a "really bad" figure; asking it to replay a
  painting gave the moment the owner loved.

## Retro

**Numbers:** planned 1 day, re-cut to 3 (day 1 capture and board, day 2 the AI, the selfie later);
day 1 alone took 3 days (21–23 Oct) and the AI wasn't started. 25 pull requests merged. 45 feedback
items: 33 from the owner (31 fixed), 12 from the simulated user test (3 fixed, 1 half, 8 logged).
Bugs and who found them: **the owner** (live): the production access code (no env vars on the
deploy), Instagram's square crop and then its logo, the tool menu cut off at the screen edge, the
first cut-outs' misses; **me** (building): an autosave loop, refs read while drawing, a palette of
greys, upload retries that did nothing on a page's first load, the export's on-screen offset, the
Boards link pushing "+ Add" off a phone; **the user test**: undo not saved (data loss) and pieces
dragged off the board. **The unit-test pick** (season names and day grouping) passed first time
and caught nothing: the bugs lived in the service worker and the editor's state, where a
reload-and-compare check would have caught the worst one.

**Keep**
- Probing before designing (the share target), and contact sheets with my real saves.
- The live design passes: using the deployed app and sending feedback in batches, one PR each.
- Asking for my calls on naming, placement and scope instead of deciding silently.

**Change**
- A design I've picked stays as it is; critic changes go on a copy beside it (the process change).
- Name the product's nouns early: "Today", "Days", "This board" and "All saves" were all renamed.
- Run the simulated user test before my own live testing, not at wrap-up: it found a data-loss bug
  in a feature I'd already signed off.

**Try next time**
- A glossary of 3–5 nouns in the brief before the first screen.
- A reload-and-compare step after every editor scenario.

**What surprised me**
- My own moodboard changed the product: I wanted to make it, not have it made.
- Background removal in the browser was good enough, free and private; a second, careful model
  fixed the hard photos.
- Instagram hides the full picture behind an embed page; its preview is a square crop, and
  sometimes its logo.

**Growth**
- **A (product):** look at what the user actually makes before building what they asked for; the
  generator I planned was the wrong product.
- **B (product craft):** naming systems (one word per concept, named by meaning) and not asking
  for decisions too early (premature commitment, recognition over recall).
- **C (technical):** an installable web app with a share target, a service-worker queue that never
  loses a share, and machine learning in the browser (two models on WASM in a Web Worker).

**Process changes carried forward** (max 3, logged in `docs/learnings.md`)
- A pick is a keep: the design-session critic's fixes go on a copy beside the owner's pick, never
  over it (playbook step 1 and the `design-session` skill).
- A feature drill-down after the MVP and before design: every object through lifecycle,
  connections, screen states and trust, pre-filled by Claude, decided by the owner (owner, 23 Oct:
  rename, delete, download and undo were all found late).
