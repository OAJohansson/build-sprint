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
