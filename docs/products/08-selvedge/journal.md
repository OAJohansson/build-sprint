# Journey

What happened, what was decided and why. Newest last.

## 19 Oct: discovery

- **Problem in.** Owner brought a fashion taste idea: saves scattered across Instagram, Pinterest
  and screenshots, a hand-made moodboard costs an evening, so style stays wordless and shopping
  random. Added to the Problems page. Owner noted the theme (self-expression and taste, like
  Scribble, Inkling and Folio) but with a visual, creative stretch like Six AM.
- **Name: Selvedge**, the self-finished edge on raw denim (a nod to the workwear in the owner's
  style), read as "self-edge": your own taste. Chosen from four (Selvedge, Second Look, Rail, Fit
  Check) before `pnpm new`, because renaming later means a new folder and Vercel project.
- **Brief drafted.** Riskiest assumption: saving through the share sheet is as quick as a
  screenshot (usability), with a feasibility unknown underneath (what Instagram, Pinterest and
  the gallery actually send). The owner's own style notes became the answer key for the style
  read, written before any model (Folio's lesson).
- **Pushed back on scope.** The four MVP steps (capture, AI tagging, auto-board, style DNA) are
  about two days. Proposed: keep the chain thin (capture, board with browser-computed palette,
  one AI read of the board) and drop per-save AI tagging. Plus a share-target probe in the first
  hour, shipped on the empty starter, to see what each app sends before designing.
- **Open owner calls:** one device or sync between phone and laptop (sync needs a backend), the
  MVP cut, and where new brands come from (AI knowledge or a hand-made list).

## 21 Oct: owner's three calls

- **Both devices.** Saving must work on the phone (that's where inspiration turns up), and the
  board is edited on the laptop because editing on a phone is too fiddly. So saves sync through
  the shared Supabase project: images in a Storage bucket, shrunk in the browser first, behind an
  access code (decision 0021).
- **Scope widened, then re-cut.** Wanting to *edit* the board is new scope. Kept small: reorder,
  bigger or smaller per piece, remove; no free-form canvas. Paid for by the owner's cut: day 1 is
  capture and board only, the AI style read moves to day 2. Trade-off named: the value
  assumption (is the read trustworthy?) isn't tested until tomorrow; today tests the riskiest one
  (saving as quick as a screenshot).
- **Brands the middle way.** The AI suggests freely, known and new, and each brand comes with a
  one-tap search link so an invented brand shows itself. Day 2.

## 21 Oct: share-target spike

- **Built** on branch `08-share-probe`: a manifest with a `share_target` (images, title, text,
  url), an app icon (indigo denim with its selvedge stripe), a service worker that keeps each
  share in IndexedDB and opens `/probe`, and the probe page, which lists exactly what arrived
  (fields, file type and size, a thumbnail) with "Copy as text". If a share arrives before the
  worker runs, a server route sends you to the probe with what was missed, so nothing is lost
  silently.
- **Checked** in headless Chromium with a real multipart form POST, the way the share sheet
  sends it: the worker caught it, kept the 400×600 PNG and opened the probe. The fallback route
  answers 303 with the missed fields. The app's browser pane can't run service workers, so the
  check used Playwright's Chromium driven over the debugging protocol (no new packages).
- **Owner's phone test (after merge and deploy):** in Chrome on the Android phone, open the live
  URL, menu → Install app, open it once. Then share one of each: an Instagram post, a Pinterest
  pin, a gallery screenshot, and choose Selvedge. On the probe, tap "Copy as text" and paste the
  result here. The question: which apps send a picture, and which only a link?

## 22 Oct: probe results

- **Live** at https://selvedge-sandy.vercel.app (owner ran `pnpm ship`). Installed on the
  owner's Android phone; Selvedge appears in the share sheet.
- **What each app sends:**

  | Source | Sends | Picture? |
  | --- | --- | --- |
  | Gallery | the file: `image/jpeg`, 6,203 KB | Yes, full size |
  | Instagram | `text`: the post link (`instagram.com/p/…`) | No |
  | Pinterest | `title`: "Take a look! 📌", `text`: the message plus a `pin.it` short link | No |

  Links arrive in `text`, never in `url`, so capture has to pull the link out of the text.
- **Links still lead to a picture.** Fetched from a server, both pages carry a public preview
  image (`og:image`): Pinterest a stable 736 px image, Instagram a 640 px square crop whose link
  expires. So the server downloads and keeps the picture at save time. Risk: Instagram can block
  server fetches; a screenshot stays the fallback, and a link with no picture still saves.
- **Consequences for design:** one inbox for both kinds (a picture, or a link with the picture
  we fetched); a 6 MB photo must be shrunk in the browser before upload (decision 0021). The
  Instagram square crop may cut off part of an outfit, so the board should cope with squares.
- **Taps (owner, 22 Oct):** 3 taps from Share to saved. The target was 2; the owner finds 3
  acceptable. Recorded as a pass with a note; worth recounting once the real inbox replaces the
  probe.
- **No picture? Say so (owner's call).** When a link's picture can't be fetched, Selvedge tells
  me and suggests taking a screenshot instead (requirement 3b), rather than quietly saving a
  bare link card.

## 22 Oct: re-cut to a three-day style DNA

- **Owner widened the idea** to a style DNA: upload images, make moodboards, get an AI summary
  of the style. Plus **several boards by season** (Summer 2026, Autumn 2026) to track how taste
  changes; a **hand-drawn character** wearing each board's style (references: loose fashion
  sketches with ink lines and watercolour washes); the home page opening on the latest
  character; and later a character that **looks like me**, from a selfie. The UI should play
  on the hand-drawn idea; try several colour palettes.
- **Named as scope widening** (playbook: re-cut on every widening). The character needs an
  image model (Claude can't draw), a second key and a few cents a drawing; the selfie adds
  likeness and face-photo storage. Re-bet out loud: **three days instead of one.**
- **Owner's plan:** day 1 capture, inbox, seasonal boards and board editing, no AI, plus a
  one-hour character spike (two image models, a real board, judge the drawings first). Day 2
  the style read and the character, home opens on the latest character. Later: the selfie
  likeness, once face-photo storage is decided.
- **No-go reversed:** "AI-generated clothes images" was a no-go; the owner reversed it, since
  the character illustrates their own taste. New no-go: prompting "in the style of" a named
  living illustrator (one reference is signed by one); we take the feel, not the hand.
- **Design note:** clean and minimal (0007) still wins, so the hand-drawn feel lives in the
  character, the type and a few ink details, on a calm layout.
- **Character spike set-up:** no OpenAI or Google key in the repo, but OpenRouter (key already
  used by Inkling) serves both families through one key. Candidates: Google's
  `gemini-nano-banana-2.1` and OpenAI's `gpt-5.4-image-2`; both take the board's images as input.

## 22 Oct: character spike

- **Board:** the owner's 18 saves for **Summer 2026** (outfit photos and flat lays), shrunk to
  768 px. Kept out of git: they're other people's photos.
- **Ran** `apps/08-selvedge/spike/character.mjs`: the same board and prompt to two image models
  through OpenRouter, two prompts each: **board** (the images alone, what day 1 knows) and
  **read** (the images plus the style in words, what day 2's style read will add). Style asked
  for in words only (loose ink lines, marker and watercolour washes, off-white paper); the
  illustration references weren't sent, so no living illustrator's hand is copied.
  `gemini-nano-banana-2.1` was rate-limited upstream twice, so Google's `gemini-3-pro-image`
  stood in. Drawings in `design/character-spike/`.

  | Model | Time | Cost | Board alone | Board plus words |
  | --- | --- | --- | --- | --- |
  | OpenAI `gpt-5.4-image-2` | 88 s | $0.23 | brown boxy tee, slate carpenter trousers, brown tote, Bostons with white socks, cap | cream striped camp-collar shirt, long denim shorts, crossbody, sunglasses, chain, Bostons and socks |
  | Google `gemini-3-pro-image` | 29 s | $0.15 | Carhartt-style vest over a white tee, olive double-knees, Bostons, cap | navy striped camp shirt, light wide jeans rolled, tote, sunglasses, chain, Bostons |

- **First read (Claude):** both models pass the feasibility question: every drawing wears real
  pieces from the board in its palette, in a sketchbook style. OpenAI's line is looser and
  closer to a designer's sketch; Google's is cleaner and more illustrated, three times faster
  and cheaper, but drew a Carhartt logo despite "no logos". Adding the style in words made both
  pick the board's signature pieces (camp-collar shirt, sunglasses, chain), which supports doing
  the style read before the drawing on day 2.
- **Owner's pick: OpenAI `gpt-5.4-image-2`, board alone.** "This one is so good, it's spot on.
  It's my style, full stop," and they like the sketch style too. Notable: the winner came from
  the images alone, with no style read in words, so on day 2 the drawing doesn't have to wait
  for the read. The 88 s wait is fine with the owner: fill it with small hand-drawn
  illustrations on screen while the character is drawn.
- **Not yet known:** one drawing per prompt is a small sample. Image models vary between runs,
  so the next drawing from the same board may be weaker, and the character won't look like the
  same person from board to board unless we make it. The newest Google model
  (`gemini-nano-banana-2.1`) was never tried.

## 22 Oct: could Claude do all the drawing?

- **The owner's reference video:** a post about a chess game on notebook paper with doodled
  pieces, "built with Claude Sonnet 5.5". The owner loves seeing a drawing happen in motion and
  asked whether Claude alone could draw the character.
- **Tried it:** Claude (Opus 5.5) drew the winning outfit (brown boxy tee, slate carpenter
  trousers, tote, Bostons with white socks, cap) as SVG ink strokes, animated stroke by stroke,
  then colour washes. What that shows: Claude can draw *in motion*, instantly and for almost
  nothing, but as clean vector lines; it can't match the image model's painterly sketch (faces,
  hands, fabric, watercolour), which the owner called "my style, full stop".
- **Options for the owner:** image model only (best drawing, an 88 s wait); Claude only (live
  drawing, much simpler figures); or both: Claude sketches live in ink while the image model
  paints, then the painting replaces the sketch.
- **Owner's verdict on the Claude drawing: "really bad."** Fair. Researched why the chess video
  looks so much better. The open-source twin (`chess-in-the-margins`) draws every creature in
  code with rough.js (a sketchy-line library), draws each part twice and alternates the copies
  so lines "boil", and animates with GSAP: a crafted drawing engine refined over many rounds,
  not a single SVG written blind. Its subjects are cartoon doodles (simple shapes Claude does
  well), not a realistic fashion figure (faces, hands, folds, watercolour, which code draws
  badly). My test had none of that: one pass, no library, no render-and-look loop.
- **Better idea for "see it drawn":** let the image model make the drawing, then trace its ink
  lines into vector strokes and animate them on, before the colour fades in. Real drawing, real
  motion. Claude-drawn doodles (rough.js style) suit the small illustrations around the app and
  the waiting screen.

## 22 Oct: draw-on spike

- **Built** `apps/08-selvedge/public/spike/draw-on.html`: takes the finished drawing and replays
  it as if drawn. It finds the ink (pixels clearly darker than their surroundings, so a dark
  wash like the brown tee isn't mistaken for a line), walks each connected line outward from its
  top so ink flows along the strokes, reveals the lines with six "pens" at once (54 long lines,
  then the short hatching marks), then fades the watercolour in. About 9 s of drawing plus
  1.6 s of colour; all in the browser, on any drawing, nothing to install.
- **First pass** also drew 2,200 specks of paper grain and a black patch from the dark tee wash;
  fixed by using local contrast only and leaving specks to the colour pass.
- **Result:** a clean pencil sketch of the owner's character builds up top to bottom, then the
  colour washes in. It runs after the drawing arrives, so it adds to the 88 s wait instead of
  hiding it; on day 2 the waiting screen covers the model's time, then the draw-on is the reveal.
- **Not checked:** other drawings (thresholds are tuned on one), a phone (1 million pixels of
  work up front, about a second on a laptop).

## 22 Oct: spike findings, and back to the MVP

- **Why the second attempt worked:** the first had Claude invent the drawing in code; the
  second let the image model draw and Claude only replay it. Each tool did what it's good at.
- **Claude only?** Not at this quality: Claude can't paint pixels, and code draws people and
  fabric badly. A Claude-only "paper doll" (a drawn base figure and garment library, dressed per
  board) stays an option: instant, free, the same character every season, but limited.
- **Owner's lean:** OpenAI for the drawing plus Claude's draw-on reveal (decision 0022, proposed).
  The owner called time on the spike: "we have spent too much time on this". Back to day 1
  (capture, inbox, seasonal boards, board editing); the character waits until that ships.

## 22 Oct: design session (board), Discover

- **Screen:** the board (laptop), because it carries the payoff jobs (seeing my style, then the
  read and the character); the phone inbox gets its own session next.
- **Seeds:** four random strings gave Sketchbook scroll, Contact sheet, Clothes rail and Tailor's
  pattern paper. Plus Designer's sketchbook (the owner's references), Museum wall, Care label,
  Selvedge edge (the name), and two that sound wrong: Departure board, Laundrette noticeboard.
- **Contact sheet:** the owner couldn't picture one-liners, so all ten became rough frames of the
  same board with the real Summer 2026 saves (`design/contact-sheet.html`; the photos sit in a
  git-ignored `design/board/`). Real content this time, after Six AM's "childish" thumbnails.
- **Contact sheet 1 rejected:** "none of these are along the direction I was thinking." The
  owner wants a **collage, as if cut out of magazines**: images cropped and stuck together by
  hand. (They meant to attach an example board; it didn't come through.)
- **Contact sheet 2** (`design/contact-sheet-2.html`): ten collage directions, all cut-and-paste
  with whole looks beside cropped details (Bostons, caps, stripes, Gazelles, sunglasses): Kraft
  and scissors, Torn pages on black, The details, Photocopy zine, Swatch book, Magazine spread,
  Stitched strips, Scrapbook, Quiet collage, and Ransom note (sounds wrong). Cuts are drawn in
  code (clip-path polygons for scissor and torn edges), which also tells us the real app can do
  them on any save.
- **Contact sheet 2, owner:** "nothing really hits the mark." Wants it closer to their own
  moodboard: "a bit random and overlapping", "not too polished, more like a hand-made thing";
  Magazine spread was closest. (The example board still hasn't come through.)
- **Collage lab** (`design/collage-lab.html`): instead of ten more guesses, a generator. Every
  shuffle lays the 18 saves out again, cut three ways (scissors, torn, a rough cut around the
  figure), overlapping, with paper scraps, tape and magazine words; sliders for pieces, overlap,
  tilt, details, scraps and words; six presets (Spread messier, The pile, Cut-out people, Kraft
  and tape, Torn on black, Few and big). It doubles as a test of the real auto-layout: the app
  has to make this arrangement itself.

## 22 Oct: the owner's own moodboard, and a pivot to an editor

- **Reference at last** (`design/board/owner-moodboard-spring-summer.webp`, kept out of git):
  photos tiled edge to edge with no gaps and no tilt; cut-outs with no background laid on top
  (Dr. Martens, a Boston clog, sunglasses, a flat lay); plain colour-swatch squares overlapping
  the photos; one title, "SPRING / SUMMER", hand-lettered on a cream pill in the middle. "Random
  and overlapping" meant layered, not tilted scraps; every direction so far had missed that.
- **Collage lab, owner:** "just random blobs of colours" (the photos likely didn't load in the
  view they opened). Dropped either way: the owner wants to **make** the board, not have it made.
- **Owner's new shape:** a board editor. Drag and drop images onto a board; a crop tool; cut a
  figure out of its background, like their board; an optional rough "cut from a magazine" edge
  (an option, not the default).
- **Named as scope change:** day 1 had "the app lays the board out, light edits" and "no
  free-form canvas"; background removal was listed as a rabbit hole. Owner calls pending: how to
  cut out (scissors you trace, automatic removal, or both), and whether the app still lays out a
  first draft to edit.
- **Owner's calls (22 Oct):** cut-outs work **automatically, then you fix** them with scissors
  traced by hand; a new board starts as a **tiled draft to edit**, like their own; and to pay for
  the bigger editor, **cut-outs move to day 2**. Day 1 is now capture, inbox, seasonal boards and
  the editor (drag, resize, crop, layers, optional rough edges). Brief updated; the stop line
  now allows overlapping and layering, still no rotation or free text.
- **Prototypes built** (`/prototype`, `apps/08-selvedge/src/app/prototypes/board-editor`, at
  `/prototypes/board-editor`): three layouts on one shared engine. **Workbench** (tools always
  visible: saves tray left, tool bar top), **Desk** (a board on a desk, saves as a strip of
  prints, tools float by the picked piece) and **Gallery** (the board fills the screen; a small
  bar on selection, saves in a sheet on request). Same board in each, drafted like the owner's:
  14 saves tiled edge to edge in two rows, six palette squares over the seams, a hand-lettered
  "SUMMER 2026" pill. Edits: drag, resize (corner), crop (pan, zoom with slider or wheel),
  forward and back, delete (button or key), rough edge (off by default), add a save by click or
  drag, a second board, "start again from a draft". Photos in a git-ignored
  `public/prototype-board/`. Checked in the browser: every edit, all three layouts.
- **Owner's pick, round 1:** Workbench's tray on the left, plus the tools floating by the picked
  piece (from Desk and Gallery): "you need to move the mouse less". Crop must be a real crop
  (handles), not only pan and zoom; background removal stays day 2. The features are there; the
  design has no identity yet. The home page will carry more identity later (its own design).
- **Round 2 (identity):** the merged layout in three personalities: Pencil (muted sketch,
  graphite on paper, the owner's ask), Sketchbook (the sketch plus watercolour washes in the
  palette, the owner's ask), Workwear (indigo, the selvedge stripe, stitching: identity from the
  name).
- **Round 2 built** (same `/prototypes/board-editor`; round 1's layout files retired, kept in
  git): `editor.tsx` (tray left, tools in a chip by the picked piece) and `themes.css`. Pencil
  and Sketchbook draw their lines on a separate layer bent by an SVG noise filter, so borders
  wobble like pencil while text stays crisp; hover and active states are pencil hatching
  (Pencil) or watercolour washes in the palette (Sketchbook). Workwear uses the selvedge stripe
  under the top bar, dashed thread stitching, and a leather-patch logo. Checked: all three render
  and edit.
- **Owner's pick, round 2: Sketchbook** ("love it!"): pencil lines plus watercolour washes in
  the palette, saves as tilted prints. Next: the intended aesthetic in one sentence, then the
  critic loop.
- **Two feels, two tests (owner, 22 Oct).** Torn between "a designer's sketchbook" (where the
  current design leans, and liked) and "cutting from magazines" (more creative, but a fear it
  turns into a caricature). Built **Cut paper** next to Sketchbook: torn newsprint for the top
  strip and the tool chip, scissor-cut scraps of palette paper as active states, a magazine
  serif (Bodoni Moda) with small caps captions, masking tape on the prints only. Guardrail: no
  ransom letters, no tape and scraps everywhere. Each goes to the design critic against its own
  sentence:
  1. Sketchbook: "Like working in a designer's sketchbook: pencil lines, a wash of colour, and
     my photos taped in, never like software."
  2. Cut paper: "Like sitting at a table cutting pieces out of magazines: warm, hand-made, a
     little imperfect, and calm enough that my clothes do the talking."
- **Critic round 1: both 5/10.** Shared verdict: "a standard canvas editor with sketchbook
  stickers applied on top" (Sketchbook) and "a scrapbook costume" (Cut paper). Top gaps:
  Sketchbook, the board as a Figma-like artboard; Cut paper, the torn top edge as caricature.
  Both: the rounded pill tool bar, corner handles, help strings, polaroid frames, too many voices.
- **Round 1 fixes.** Shared: tools are Crop, Rough edge, one layer toggle ("Bring to front" or
  "Send to back") and Remove; they sit below the piece; help strings gone; "Start again" at the
  end of the tray; the tray is a pile at each photo's own shape. Sketchbook: no artboard (the
  page is the board, a pencil margin marks it), highlighter on the logo only, board names as
  index tabs, the picked piece lifts, a pencil tick as the corner, tools on a strip of tape,
  tray prints mixed (taped, cut, pencil-framed). Cut paper: decoration removed (no torn strips,
  frames or tape), one serif plus a small sans in the tool bar, square corners, a 1px sheet edge
  and its caption. Overruled for the owner to confirm: both critics wanted Rough edge out of the
  tool bar; it stays, because the owner asked for it.
- **Critic round 2: both 5/10 again.** Not rising, so stopped and shown to the owner (the
  session's rule). The critic also reversed itself: Sketchbook round 1 asked for index tabs and
  kept the logo highlighter, round 2 called the tabs "browser tabs" and the highlighter a
  cliché; Cut paper round 1 anchored the board top and dropped print frames, round 2 wanted it
  centred with frames back. It also judged the board's own "SUMMER 2026" pill (the owner's
  design) as chrome. Notes raised in both rounds, worth keeping: the selection is too faint; the
  tool bar must never cover the title; one handwriting face for everything reads as a kids' app
  (hand face for titles only, a quiet small face for tool words); vary the tape.
- **Learning:** a critic with no memory re-litigates; after two flat rounds, the owner's eye
  beats a third round.
- **Owner: "I didn't want you to change the sketchbook design, I liked it as it was."**
  Restored the round 2 Sketchbook exactly from git (`c0195e6`) as **Sketchbook V1**
  (`editor-v1.tsx`, `.t-sketchbook1`, with round 2's own tools), kept the critic-loop version as
  **Sketchbook V2**, and Cut paper beside them. The picker now shows all three.
- **Learning:** the critic loop edited the owner's pick in place. When the owner has picked and
  likes a design, the loop works on a copy and the pick stays untouched; "pick" means keep.
- **Locked: Sketchbook V1** (owner, 22 Oct), plus one thing from V2: the soft pencil frame
  around the collage (drawn on its own layer, so V1 still clips pieces to the board). Next:
  Deliver (subtract, AI tells, the owner's own copy), then promote V1 into the app.
- **Deliver (owner, 22 Oct).** Subtract: removed the top-bar hint and the tray footer (the one
  AI tell found: helper text where nobody gets stuck); kept Back and "Start again from a draft".
  Copy: the owner kept the current wording for now (Your saves, + New board, Start again from a
  draft, Crop, Done cropping, Rough edge, Forward, Back, Delete), to revisit later.
- **Design session summary (board editor):** seeds and ten directions, two contact sheets and a
  collage lab all missed until the owner's own moodboard arrived; round 1 layouts (Workbench,
  Desk, Gallery) gave the layout; round 2 personalities gave Sketchbook; critic rounds 1 and 2
  (5/10 each, contradicting) were stopped; the owner locked Sketchbook V1 plus V2's frame.

## 22 Oct: day-1 build, the order

PR #51 merged (the design session). Branch `08-day1-build`. Six AM's pattern carries over
(server routes with the secret key, an access code on every route, an in-memory stand-in locally
without keys); new for Selvedge: the access code also lives in a cookie, because the share
target's service worker can't type a code. Build order, each step shippable:

1. **Data and access:** Supabase schema (`selvedge_saves`, `selvedge_boards`, a private
   `selvedge` bucket), server store with the in-memory stand-in, the access-code gate and cookie.
2. **Capture:** the service worker queues shares in IndexedDB, shrinks images (long side about
   1600 px, WebP), uploads when online; links get their picture from `og:image` on the server,
   and if that fails the save says so and asks for a screenshot (requirement 3b).
3. **Inbox (phone):** saves, newest first, where each came from, the screenshot ask; laptop
   drag-and-drop bulk upload.
4. **Boards and the editor:** promote Sketchbook V1 from the prototype into the app (and delete
   the prototype surface), seasonal boards, the tiled draft from picked saves, autosave.
5. **Real crop:** handles to trim each side, on top of pan and zoom.
- **Step 1 done: data and access.** `supabase/schema.sql` (tables `selvedge_saves` and
  `selvedge_boards`, a private `selvedge` bucket for webp, jpeg and png up to 5 MB, RLS on with
  no policies); `src/lib/library.ts` (types and checks: UUIDs, names, board docs, the first link
  in shared text, the source by host); `src/lib/server/store.ts` (Supabase, or an in-memory
  stand-in locally; `SELVEDGE_MEMORY_STORE=1` forces it); the access code by header or cookie
  (`/api/access`); routes `/api/saves`, `/api/photos`, `/api/boards`. Tested locally against the
  in-memory store with a throwaway code: 13 checks pass. Not yet tested against Supabase: the
  schema has to be run first (owner). Keys checked for format only, never printed.
- **Schema run** by the owner in the Supabase SQL Editor ("Success. No rows returned"). The same
  checks against the real project pass: access refused without the code, cookie set, a photo
  stored in the private bucket and streamed back byte for byte, an Instagram link recognised, a
  board saved and loaded, bad input and wrong file types refused. Test rows deleted afterwards
  (0 saves, 0 boards left). Run with a throwaway access code, so the real one was never read.

## 22 Oct: step 2, capture

- **Service worker** (`public/sw.js`): a share goes into an IndexedDB queue on the phone at once,
  the share sheet closes onto `/inbox`, then uploads run: pictures shrunk on the phone to a long
  side of 1600 px as WebP, links sent as they are. Failed uploads stay queued and retry on the
  next share, when the inbox opens, when the phone is back online (Background Sync) or on demand.
  Each picture in a multi-photo share is its own save.
- **Link pictures** (`src/lib/server/link-picture.ts`): the server fetches the shared page,
  reads `og:image`, downloads it and keeps the copy; only public web addresses (localhost and
  private networks refused); size and time caps. Picture shapes come from the file's own header
  (`image-size.ts`). **Found:** Instagram serves its preview to a plainly named link-preview bot
  but not to a "phone browser" identity, so the fetcher names itself honestly as Selvedge.
- **The screenshot ask:** a link whose picture can't be fetched is saved as a link and the inbox
  says "Couldn't get the picture from this post. Take a screenshot and share that instead."
- **Plain inbox** at `/inbox` with the access-code form (designed in step 3); the app now opens
  there. The probe page and its store are retired.
- **Tested end to end** in headless Chromium against Supabase: a 3000 × 4000 photo shared,
  shrunk to WebP and stored with the right shape; the owner's Pinterest and Instagram links
  saved with their pictures; a share made offline waited on the phone and arrived once back
  online. Local and private addresses refused. Test rows deleted afterwards.
- **Not yet checked:** a real Android phone; whether Instagram treats Vercel's servers like my
  laptop. Marked shortcut: offline, the inbox page itself can't load (the share is still kept).

## 22 Oct: live, and capture works on the phone

- **Keys reached production.** The first ship had no keys; after they were added, `pnpm ship`
  set them but its deploy was cancelled by the skip-unchanged rule, so production refused every
  code (503). Patched with `.env.example` (PR #55, a real deploy with the keys); the proper fix,
  ship forcing the build after a key change, went to its own session (PRs #56 and #57, merged).
- **Owner's phone test (22 Oct): all good.** The access code works on the phone; a Pinterest
  pin, an Instagram post and a gallery picture were shared to Selvedge and all three arrived in
  the inbox with their pictures. So Instagram's preview works from Vercel's servers too, which
  was the one thing only the real phone could show. The riskiest assumption (saving is as quick
  as a screenshot, and every source gives a picture) holds for one person.
- **Instagram pictures were cropped** (owner, 22 Oct): "a problem for the collage later". Cause:
  Instagram's `og:image` is a zoomed square crop (its link says so: `c819.0.2457.2457`, 640 px),
  here head and shoulders with the outfit gone. **Fix:** for Instagram posts the server now reads
  the post's public embed page (the official way sites embed a post) and keeps the photo as
  posted, the largest size up to 1600 px; `og:image` stays the fallback. Checked with the owner's
  post: stored 1080 px with the whole outfit. Pinterest's preview was already uncropped.
  Limit (marked shortcut): a carousel gives its first photo. Saves made before the fix keep the
  crop: remove and share them again.
- **Live, it stored Instagram's logo** (owner, 22 Oct: "just showing an icon"). The stored file
  was the 4168 px Instagram logo PNG. From my laptop the same post's embed page and og:image are
  both real photos, so Vercel's servers get something else from Instagram (likely a login page,
  some of the time: the first save this morning worked from Vercel). **Fix:** a guard keeps an
  Instagram picture only if it comes from Instagram's photo CDN (`/v/t…`) as JPEG or WebP; the
  logo and other placeholders are refused, so the save falls back to the screenshot ask instead
  of storing a logo. Order: embed page (photo as posted), then og:image (cropped, but real).
  **Diagnostics:** `[instagram]` log lines (status, page reached, refused types; no personal
  data) so a re-share shows in Vercel's logs what Instagram sent. Locally the owner's new post
  stores portrait (0.75) with the whole outfit.
- **Re-share after the guard (owner, 22 Oct): works.** Vercel's log shows the embed page answered
  (268 KB, no refusals), and the save stored the photo as posted: 1280 × 1706 portrait, whole
  outfit. So from Vercel the embed page works at least some of the time; the earlier logo came
  from a moment it didn't. When it doesn't, the guard now turns that into the screenshot ask.
  Watch the `[instagram]` log lines for how often that happens.

## 22 Oct: step 4, the board editor in the app

- **Promoted Sketchbook V1** (as locked, with V2's soft frame) from the prototype into the app at
  `/board`: `src/components/board/engine.tsx` (pieces, edits, canvas), `sketchbook.css`, the page
  in `src/app/board/`. The prototype surface is deleted (the prototype skill's rule 5); its
  photos folder and git-ignore line went with it. The access-code form is now a shared component.
- **Seasonal boards:** names from the date (`src/lib/season.ts`: spring Mar–May, summer Jun–Aug,
  autumn Sep–Nov, winter Dec–Feb, winter keeps the year it starts in), numbered when taken
  ("Autumn 2026 (2)"). Unit test: 6 cases (normal, midnight at a month change, New Year inside
  winter, a leap-year February end, first board, numbering), all pass.
- **New board:** name it (this season by default), pick saves (the 14 newest picked to start),
  "Make the board": tiled edge to edge, the palette from the photos, the title pill.
- **Palette** (`src/lib/palette.ts`, in the browser, no AI): first try picked only whites and
  greys (walls, pavements, backdrops). Now greys, extremes and photo edges count less: the test
  board gave off-white, taupe, khaki, denim blue, mushroom and dark taupe.
- **Autosave:** each edit is sent 0.7 s after the last one (and when the tab is hidden); a
  quiet "Saving…" shows meanwhile. Checked: a dragged title saved and survived a reload.
- **Tested** in the browser at 1440 × 900 against the in-memory store with the 18 design photos.
  Not yet: the owner's real saves, a second device, the real crop (step 5).

## 22 Oct: the owner's first board, and fixes

- **Feedback 1–7** logged (`feedback.md`): drop the pick count; nothing picked by default and a
  clearer selected state (3 options); a new board starts empty, photos dragged on; resizing a
  photo must not crop it; no palette squares by default, instead a shapes-with-text tool; a real
  crop; background removal as its own feature.
- **Owner's calls:** the picker picks the board's tray (the board starts empty, you drag from
  it; "All saves" shows everything and a save dragged on from there joins the tray); order: the
  quick fixes, then shapes with text, then the real crop, then background removal.
- **Fixed:** 1 (the count line is gone), 3 (empty board, the board's own tray saved with it),
  4 (a photo keeps its shape when resized, so its whole picture stays; only Crop reframes it),
  and half of 2 (nothing pre-picked). "Start again from a draft" now tiles photos only.
- **Select states** for 2: `design/select-states.html`, A Pencil tick, B Taped in, C Highlighter.
- **Select states, round 2** (owner: "not sure about any of these"; wants the logo's yellow, soft
  and subtle, "surprise me"): `design/select-states-2.html`. D Yellow dot (a watercolour dot at
  the corner and the faintest pencil frame), E Underlined (a highlighter stroke under the photo
  that grows in), F Selvedge thread (a fine yellow stitch down the photo's edge with a knot: a
  selvedge is denim's finished edge, marked with a coloured thread). Every photo stays in full
  colour; no hard outlines.
- **Owner's pick: D, the yellow dot**, now in the picker (a small watercolour dot of the logo's
  yellow and the faintest pencil frame). **The selvedge thread (F) is kept as a design concept**
  for later ("it ties back to the brand... I want to use it somewhere"), recorded in the backlog.
  Feedback 2 fixed.
- **Shapes with text** (feedback 5): the tray has a Shapes row (square, rectangle, a round pill,
  drawn in pencil) to click or drag on. A picked shape's tool box gets colour dots (the pill's
  cream, the logo's yellow, then the palette read from the board's photos) and a text field;
  text is hand-lettered and turns cream on dark colours by itself. Checked: a yellow
  "SPRING / SUMMER" pill and a denim "DENIM" square, both autosaved with colour and text. The
  stop line now allows text inside shapes (still no loose text, no rotation).
- **The real crop** (feedback 6): each photo keeps a crop box, the part of the original that
  shows, as fractions of the photo; the original is never cut. Crop shows the whole photo faded
  around the piece and the kept part bright, with handles on every corner and side: drag one to
  trim, and the piece takes the new shape; drag inside to slide the photo under the box. Done
  cropping keeps it, Reset brings back the whole photo at its own shape. Older pieces (framed
  with cover and a focus point) carry their framing into a crop box unchanged. Picking another
  piece leaves crop mode. Checked: a bottom trim (450 → 344 high), a right trim (308 → 240 wide),
  a slide to the photo's left edge, Done, and Reset (back to 240 × 300, the photo's 0.8 shape).

## 23 Oct: background removal

- Built locally while the owner tests the live site. **Remove background** in a photo's tool box
  cuts it out in the browser with `ormbg` (Apache-2.0, 44 MB once, decision 0025): a Web Worker
  runs the model, the cut-out (WebP with transparency, same size as the photo) is kept beside the
  original in the bucket, and the piece switches to it; **Restore background** switches back.
- **Model choice:** imgly (AGPL) and RMBG (non-commercial) ruled out by licence, BiRefNet by
  reported browser memory crashes, MODNet by being portrait-only.
- **Tested** in headless Chromium at 1440 × 900: a person in front of a fence and building came
  out clean (17 s, including the first download), and the jersey flat lay kept every item with the
  grey backdrop gone (7 s with the model cached). No errors.
- Not yet: hand fixing of misses (backlog), real saves, a phone.
- **Owner's first live cut-outs (23 Oct): "not perfect, but workable."** Three misses: a ghosted
  forearm (the model unsure, so half-transparent), leftover background (a car and grey bits by
  a bag), part of a chair kept. Compared on the owner's three photos, in Node: **A** today's ormbg;
  **B** ormbg plus a tuned clean-up ("fairly sure" counts as solid, stray islands dropped, small
  holes filled); **C** BEN2 (MIT, 219 MB) plus the same clean-up. B brings the arm back but keeps
  the car (it touches the bag) and a clothes pile; **C wins all three**: the arm with its watch,
  no car, no clothes pile. In the browser, BEN2 on WebGPU ran out of memory in headless Chrome; on
  the CPU (WASM) it works at about 37 s a photo (ormbg about 7 s).
- **Owner's call: keep quick as the default (with the tuned clean-up), add "Cut out more
  carefully" with BEN2 for the hard ones.** Built: the tuned clean-up now runs after both models;
  after a quick cut-out the tool box offers **Cut out more carefully**, which shows the download
  progress the first time and then "about half a minute". Checked end to end in headless Chromium
  on the owner's mirror selfie: quick 8 s (arm back, clothes pile still there), careful 48 s
  including the 219 MB download (clothes pile gone); the option disappears once careful is done.
  No errors. Practice: **progressive disclosure**, the expensive option appears only when the
  cheap one has been tried.

## 23 Oct: design session (inbox), Discover

- **Screen:** the inbox (phone first; the laptop adds drag-and-drop bulk upload). Identity stays
  the locked Sketchbook V1, so the directions vary layout and grouping, not the look.
- **Seeds:** four random strings gave Day pages, Contact sheet, The pile and Strips by source.
  Plus Masonry wall (the safe default), Not on a board yet, Colour notes, Season shelves, and two
  that sound wrong: One at a time, Ledger.
- **Contact sheet** (`design/inbox-contact-sheet.html`): all ten as rough phone frames with the
  owner's real saves, each showing the same moment (just saved, one waiting, one link without
  its picture), since one-liners were hard to picture last session.
- **Owner's pick: Day pages**, with three changes. (1) **Folders** too: Days stays the default, a
  Folders page lets me make folders, name them anything (no defaults) and rename them later.
  (2) **A save lives in one place:** moving a photo into a folder takes it off its day page.
  (3) **Colour notes** (from direction 7) only inside folders, switched on or off per folder.
  And the yellow tape goes: "my eyes are gravitating towards the tape rather than the clothes."
  Named as a scope widening (folders weren't in the MVP); the owner's calls on it: move with
  Select, then Move to (the board picker's yellow dot); the switch per folder; the board tray's
  All saves can be narrowed to one folder.
- **Built** on `08-inbox-design`: a `selvedge_folders` table and `folder_id` on saves (deleting a
  folder sends its saves back to their day pages); `/api/folders`; `PATCH /api/saves` to move;
  day grouping in `src/lib/days.ts` with tests (today, yesterday, midnight, month end, new year,
  empty); the inbox in the sketchbook look (prints, slight tilt, no tape); the Move to sheet with
  "New folder" inline; colour dots read from each photo in the browser; the tray's folder filter;
  and the laptop's drop-anywhere upload through the same queue as shares (requirement 5).
- **Bug found while testing:** a page's first load isn't controlled by the service worker yet,
  and `retryUploads` only spoke to the controlling worker, so a retry on a fresh page did
  nothing (shares too). Fixed once in the shared code: it now waits for the active worker, and
  the worker tells uncontrolled pages when the queue changes.
- **Checked** at phone size (375 × 812) and on the laptop: make a folder, Select two, Move to,
  they leave Today and the folder shows 2; colour notes on; rename; the tray filter (11 → 2);
  delete a folder, its saves come back; a headless drop of two photos lands as two "upload"
  saves. The picked dot was hard to see on a print's white corner, so it's a little bigger and
  further in. The in-app browser can't run service workers, so the drop was tested headless.
