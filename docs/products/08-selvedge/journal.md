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
