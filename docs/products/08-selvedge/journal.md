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
