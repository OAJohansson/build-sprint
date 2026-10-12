# Review feedback

Every audit, break-ui and user-test finding, with what happened. Master copy:
`docs/product/polish-sprint/feedback.md` in kids-app.

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Own check (prototype) | `font-sans` points at itself in `globals.css` (`--font-sans: var(--font-sans)`), so the app falls back to the browser's default font instead of Geist | fixed |
| 2 | Own check (prototype) | Steps variant: white text on tangerine `#ec7a3c` is about 2.9:1 contrast, under the 4.5:1 minimum — 1) | fixed |
| 3 | Own check (prototype) | The Wordmark's `aria-label` sits on a plain `<span>`, which most screen readers ignore, so the name can be read as "Inklı ng" — `role="img"` | fixed |
| 4 | User test (Sam, hiring manager) F1 · major | The demo never says replies are scripted and words pre-filled; the "made-up data" note disappears in the writing flow | fixed |
| 5 | User test (Sam) F2 | First reply ends with a question but the button says "Continue" — "See the idea" / "Answer this" | fixed |
| 6 | User test (Sam) F3 | "Answer the question" after the idea card is ambiguous (which question?) — "Back to your question" | fixed |
| 7 | User test (Sam) F4 | The follow-up write screen shows the whole last paragraph, not just the question — only the question sentence is shown | fixed |
| 8 | User test (Sam) F5 | Secondary tap targets under 44 px: Leave demo, Not tonight, Back, filter pills, idea chips | fixed |
| 9 | User test (Sam) F6 | Idea chip on the takeaway isn't tappable, but on Today it is | fixed |
| 10 | User test (Sam) F7 | Small rust labels fall to 3.6–4.3:1 contrast on peach/pink backgrounds | fixed |
| 11 | User test (Sam) F8 | Who it's for (16–25s) is never said — "For 16–25s working out what they want." | fixed |
| 12 | User test (Sam) | "Lately" on Today still shows the previous entry after tonight's is done (reads stale) — shows the latest other entry, incl. earlier today | fixed |
| 13 | web-design-guidelines | `autoFocus` on the writing box pops the keyboard on phones (evening.tsx:119) | fixed |
| 14 | web-design-guidelines | Writing flow has no `<h1>`; textarea lacks name/autocomplete="off"; "Loading" without "…" | fixed |
| 15 | web-design-guidelines | Tab bar and "Leave demo" navigate with buttons/`<a>` instead of `<Link>` | fixed |
| 16 | web-design-guidelines | "Not now" discards a typed draft without warning — drafts kept in memory until the page closes | fixed |
| 17 | web-design-guidelines | Done-card title button has no focus style; a mention card can be a button that does nothing | fixed |
| 18 | break-ui · Ugly | Arabic (right-to-left) writing renders with punctuation at the wrong end: user text needs `dir="auto"` | fixed |
| 19 | break-ui · Fragile | Dates without a year: after a year of use "400 entries since 8 Sept" and "Week of 8 September" are ambiguous — year shown when it isn't this year | fixed |
| 20 | break-ui · Fragile | An idea's "In your words" lists every mention (could be hundreds); the Log book renders every entry (400 → 58,000 px page) | parked |
| 21 | break-ui · Held up | Long names, titles, idea names, pasted URL, emoji, empty, one, 400 rows: no overflow at 375 px, plurals right, empty states present, crisis card shows on a closing reply | fixed |
| 22 | User test (Maya) F1 · major | The entry page shows only a clipped first message; later answers are missing (real and demo) | fixed |
| 23 | User test (Maya) F2 · major (= #4) | Typing your own words in the demo still gets the scripted reply, unannounced | fixed |
| 24 | User test (Maya) F3 (≈ #5, #6) | Button order/labels between reply, idea and answer; Just write still asks two questions — "That's enough for now" plus clearer labels | fixed |
| 25 | User test (Maya) F4 | Demo: tonight's ideas already on the shelf before they're met | fixed |
| 26 | User test (Maya) F5 | Idea card doesn't show which sentence it came from — real data doesn't know which sentence prompted the idea | parked |
| 27 | User test (Maya) F6 (= #16) | "Not tonight" throws typed words away — drafts kept in memory | fixed |
| 28 | User test (Maya) F7, F8 (= #10, #8) | Label contrast; small targets — labels darkened (now 5.2–6.5:1), small controls padded to 44 px | fixed |
| 29 | User test (Maya) | "Foreclosure" sounds clinical (and like mortgages); "Psychology · Identity development" reads like a module heading — real term; story for the interview | won't do |
