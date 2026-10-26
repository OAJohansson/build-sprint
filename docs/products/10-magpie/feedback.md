# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Audit major | Validation errors don't take you to the field (off-screen with the keyboard open) | fixed (focus and scroll to it, aria-describedby) |
| 2 | Audit major | Filter sheet doesn't hold focus or make the page behind inert | fixed |
| 3 | Audit major | Sticker and photo images not lazy; 'See all' with hundreds would load all | fixed (loading=lazy) |
| 4 | Audit major | Sticker/My photo toggle 30 px tall | fixed (44 px hit area, same look) |
| 5 | Audit major | Long name overflows the drawing circle when there's no photo | fixed (clamped to 3 lines) |
| 6 | Audit minor | Long search text or city pushes the page sideways | fixed |
| 7 | Audit minor | Chips 36–40 px tall | fixed (hit area extended, same look) |
| 8 | Audit minor | Return in Name submits the form | fixed (closes the keyboard instead) |
| 9 | Audit minor | Undo, Remove and Draw again fail silently offline | fixed (one-line message) |
| 10 | Audit minor | Welcome and access screens under the Dynamic Island | fixed (safe-area padding) |
| 11 | Audit minor | Sheet and shelf rows chain scroll to the page | fixed (overscroll contain) |
| 12 | Audit minor | Edit page for a missing yum shows a lone button | fixed (Maggie and a line) |
| 13 | Audit polish | No press feedback on shelf stickers and text buttons | fixed |
| 14 | Audit polish | Place on result cards breaks mid-word | fixed (truncate) |
| 15 | Audit polish | Progress bar animates width | fixed (transform) |
| 16 | Audit polish | iOS autofill bar on name and place fields | fixed (autocomplete off) |
| 17 | Audit polish | Undo timer runs while the tab is hidden | fixed (pauses) |
| 18 | Audit polish | Browser bar stays cream on the dark camera and coral saved screens | parked (backlog) |
| 19 | Audit polish | Fredoka latin only: accented names mix fonts | fixed (latin-ext) |
| 20 | Critic r1 (G 6/10) | Saved: Maggie too small under a big tilted sticker; she should hold it up | fixed |
| 21 | Critic r1 (H, K, L) | Stickers glossy with thin outer edge and wide white border | fixed in prompt v2 (re-evaluated) |
| 22 | Critic r1 (G) | yum no. chip lost its butter fill; hearts chip should be solid; stray white dot | fixed |
| 23 | Critic r1 (E) | Sub-kinds wrap to two rows; location line wraps awkwardly | fixed |
| 24 | Critic r1 (L) | Latest wraps into two uneven rows on the laptop | fixed (single scrolling rows) |
| 25 | Critic r1 (H) | Cards narrower than the reference; fade behind Snap button | won't do (build matches the reference's 80 px cards and floating button) |
| 26 | Sticker eval v1 | Cluttered photo drew the wrong item: the photo prompt didn't name it | fixed in prompt v2 |
| 27 | Sticker eval v1 | Ramen copied bowl print and glyphs; tiramisu kept the tablecloth; some outlines thin | fixed in prompt v2 (re-evaluated) |
| 28 | Critic r2 (L) | Laptop shelves pushed the page wider than the screen; See all off-screen | fixed (min-w-0) |
| 29 | Critic r2 (H, G, K) | Row snap ignored padding; saved chips 3+1; sticker sat on Maggie's head; tail dot gone; hero sticker high | fixed |
| 30 | Sticker eval v2 | 5 of 15 stickers end in white (no outer outline): cut-out risk | fixed in v3 (edge drawn in code; 15/15) |
| 31 | Sticker eval v3 | Double ring on 4 stickers where the model still draws its own outline; die-cut bumps where a glass foot sticks out | parked (kickoff rabbit hole: don't chase perfect consistency) |
| 32 | User test F1 (S3 6 taps, bar 5) | Wine hidden until Drinks is tapped | fixed (sub-kinds always shown; picking one picks Drinks) |
| 33 | User test F2 | 'red wine' finds nothing; no-filter empty copy says 'fewer filters' | fixed (kind words searchable; 'Try another word?') |
| 34 | User test F3 | Shelf slots blank for ~1.5 s while images load | fixed (paper-coloured placeholder shape) |
| 35 | User test F4 | A yum with no city falls out of London and Away | fixed (city falls back to the book's home city) |
| 36 | User test F5 | Name not focused after the shutter | fixed |
| 37 | User test F6 | Only two 'Your top' rows; cocktails vanish | fixed (up to three) |
| 38 | User test F7 | Around London count and Clear search under 44 px | fixed |
| 39 | User test F8 | Disabled button labels 2.3–2.6:1 | fixed (fill pales, label stays 7:1) |
| 40 | User test F9 | Shared photo gets today's date, not the photo's | parked (backlog) |
| 41 | User test F10 | Empty card behind Maggie on the access screen reads like an input | won't do (in the approved design) |
| 42 | User test: Relive 3/5 | No view per trip or city; 'Away' mixes Taipei, Tokyo, Rome | parked (backlog: Trips row; owner's call) |
| 43 | PM check | A sticker failed on an OpenRouter 429 (rate limit); the photo stood in and Draw it again worked | fixed (one retry after 3 s on 429/5xx) |
| 44 | User re-check | 'red wine' still finds nothing (no yum has 'red') | fixed (no full match → any-word matches, best first) |
| 45 | User re-check | Fallback city labelled 'where you were last' on a device that never had one | fixed ('your home city') |
| 46 | Critic r3 (L 8.5) | Laptop panel shows drink sub-kinds before Drinks is picked | won't do (F1 brought S3 inside its tap bar; the user test wins) |
| 47 | Critic r3 (H) | Plum hot shot sticker has a flame ('hot' taken literally) | parked |
