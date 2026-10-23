# Test plan: Selvedge

## How to run the app for testing

- Start: `ACCESS_CODE=test-only-code SELVEDGE_MEMORY_STORE=1 pnpm -F 08-selvedge dev --port 3008`
  (an in-memory store, so no real saves are touched). The test code is local only.
- Sign in once per browser: `POST /api/access` with `{"code":"test-only-code"}` (sets the cookie),
  or the code form on any page.
- Seed: the 18 saves in `docs/products/08-selvedge/design/board/01–18.jpg` (git-ignored, the
  owner's real saves), uploaded through `POST /api/saves` before the run; no folders or boards.
- Browser: headless Chromium (Playwright's build under `~/Library/Caches/ms-playwright/`), driven
  over CDP from a Node script. The phone scenarios at 390 × 844, the laptop ones at 1440 × 900.
- Simulated parts: Android's share sheet (S1) is simulated by POSTing a picture to
  `/share-target` as multipart `files`, as Android does; the service worker catches it.
  Background removal downloads a 44 MB model the first time (about 10–20 s).

## Scenarios

### S1 · Save from the phone (390 × 844)
- **Moment:** mid-scroll on Instagram, thumb on Share.
- **Task:** share a picture to Selvedge, then check it arrived.
- **Success:** the picture shows first in the Inbox under "TODAY" within 5 s; nothing is lost
  (a share while offline shows as waiting and arrives once back online).

### S2 · Sort the inspo (laptop)
- **Moment:** on the sofa with the laptop, 18 saves in the Inbox.
- **Task:** add two photos from the computer (+ Add photos), make a folder "Shirts", move four
  shirt photos into it, turn colour notes on in that folder, rename it "Shirts and tees".
- **Success:** without help, ≤ 2 minutes; moved photos leave the Inbox; the folder shows four
  photos with colour dots; the new name sticks after a reload.

### S3 · Make a board (laptop)
- **Moment:** same evening, wants a Spring / Summer board like the one they once made in Canva.
- **Task:** go to Boards, make a board named "Spring / Summer", drag at least 8 photos on, crop
  one, remove the background of a product shot, add a pill titled "Spring / Summer" and two
  colour squares, one of them coloured with the pipette from a photo.
- **Success:** ≤ 10 minutes, no help; every tool's state is clear (selected, cropping, cutting
  out); photos keep their shape when resized; the menu by a piece is always fully on screen.

### S4 · Mistakes and room (laptop)
- **Task:** delete a piece by accident and get it back; hide the sidebar to see the board
  bigger, then bring it back.
- **Success:** finds Undo (or ⌘Z) and gets the piece back in one step; finds how to hide and show
  the sidebar without a visible button in the way.

### S5 · Time passes, then share it
- **Moment:** later in the week; the tab reloaded.
- **Task:** open the board again, rename it "SS 2026", download it as a picture.
- **Success:** the board is exactly as left (same pieces, crops, cut-out, colours); the rename
  sticks; the download is a sharp PNG of the whole board.

## Value questions

- Does the board feel like *theirs* (made by hand) or made for them?
- Which tool would they use every time? Which never?
- Does anything on screen pull the eye from the clothes?
- Would they set the downloaded board as a wallpaper or post it?

## Trust checks

- After S3, compare the stored board (`GET /api/boards?id=`) with what's on screen: piece count,
  the crop box, the cut-out flag, the colours.
- After S2, the Inbox and the folder together hold every save exactly once.
- Ask afterwards: "Did anything feel like it was decided for you?"
