# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Owner review (prototype) | Round 1 directions too similar: same palette and layout, mostly a typeface change | fixed (round 2: three different ideas) |
| 2 | Owner review (prototype) | Platen: the paper looks stuck to a blackboard; needs more of a typewriter, without going overboard | fixed (carriage, bail, body, nameplate) |
| 3 | Owner review (prototype) | Too far: the moving type guide with the red line is distracting; keep it simple | fixed (type guide and carriage drift removed) |
| 4 | Owner review (prototype) | Still not a typewriter below the paper; why black, not silver/metallic? Want three new typewriter directions; keep rising paper and key clicks; drop the line-end bell | fixed (round 3: Chrome, Enamel, Ink; bell removed) |
| 5 | Owner review (prototype) | Drawing an actual typewriter looks childish; keep the essence (paper, struck letters, typing feel) but no machine | fixed (round 4: Manuscript, Night, Ribbon) |
| 6 | Owner review (live, phone) | Let me set how many pieces per week I aim for | fixed (tap the marks: goal 1–7, saved on the device) |
| 7 | Owner review (live, phone) | Not clear what the four marks mean; make it clearer without adding the word "week" | fixed (tapping them opens "this week: 2 of 4 · goal − 4 +") |
| 8 | Owner review (live, phone) | "Another spark" is unclear | fixed ("↻ not this one", under the prompt) |
| 9 | Owner review (live, phone) | Make it a stronger learning tool: a reminder of what to keep in mind before writing, and a short creative-writing theory note that explains *how* (e.g. how to end on an image). Still one solid lesson per piece, low friction | fixed (craft note in the feedback; "last time" line before the next piece; no pop-up) |
| 10 | Owner review (live, phone) | "↻ not this one" under the prompt looks messy; better in the footer next to "set down the pen", as before. Everything else works | fixed (back in the footer, new label kept) |
| 11 | Audit (web-design-guidelines) | The reader's reply was in a live region while typing out, so screen readers would read it letter by letter; the word count was announced on every keystroke | fixed (reply announced once; only the save status is live) |
| 12 | Audit | Loading text without "…" ("opening the notebook", "your reader is reading", "saving"); no hover states; no `color-scheme`; unlock input missing name/spellcheck; "That code didn't work." had no next step; pieces page had no heading | fixed |
| 13 | Audit | Tapping the page to focus the writing area is a click handler on a `div`; `autoFocus` on the writing area | won't do: the hidden textarea is the real, keyboard-reachable control; the tap is a convenience. Autofocus serves the main job (first word fast) |
| 14 | break-ui | Emoji with skin tones or hearts (👵🏼 ❤️) and letters with combining accents were split into separate letter boxes | fixed (split by grapheme with `Intl.Segmenter`) |
| 15 | break-ui | At 320 px with a goal of 7 and extra pieces, the header wrapped onto two lines | fixed (no wrapping; "SCRIBBLE ·" hides below 360 px) |
| 16 | break-ui | Opening a piece from a long list and coming back jumped to the top | fixed (list position kept) |
| 17 | break-ui | Typing cost: 8 ms per keystroke at 22–330 words, 29 ms at 2,000 words (dev build) | fine; fragile only for very long pieces |
| 18 | break-ui | 200 pieces render as one list (no paging); "export all" and the key-sound switch sit at the bottom of it | open: decision for the owner |
| 19 | break-ui | While writing, you can only add to or delete from the end, and earlier lines of a long piece scroll out of view with no way back until you set the pen down | open: decision for the owner (typewriter rule chosen in the prototypes, never explicitly confirmed) |
| 20 | break-ui | Vietnamese letters fall back to another font (Courier Prime lacks them) | won't do for now: rare for this writer; readable |
| 21 | User test F1 (major) | A finished piece without a reply can't get one once you leave the set-down screen | fixed ("Ask for a reader" on any finished piece's page) |
| 22 | User test F2 (major) | Red ink below 4.5:1: Night worst 2.94, Manuscript worst 3.64 | fixed (Night red #e8806b, Manuscript red #8a2617, struck red never below 90%: worst ~4.9:1) |
| 23 | User test F3 | Manuscript muted text over the vignette 3.72–4.06 | fixed (muted #574e42: ~4.9–5.3:1) |
| 24 | User test F4 | The reply types out below the fold; the suggestion and craft note can be missed | open: decision (auto-scroll is motion while reading) |
| 25 | User test F5 | "not this one" after you've started moves your text under a new prompt; caret lost | open: decision |
| 26 | User test F6 | Closing within 1.5 s of typing left the last words off other devices | fixed (save on page hide, keepalive) |
| 27 | User test F7 | No undo after "set down the pen"; a finished piece can't be reopened | open: decision |
| 28 | User test F8 | Tap targets of 32 px (marks, "pieces", goal − +, "← write") | fixed (44 px) |
| 29 | User test F9 | "· read" tag is ambiguous | fixed ("· has a reply") |
| 30 | User test (progress) | Job 3 scored 2/5: nothing shows what you're getting better at | open: "what you're practising" list (backlog candidate) |
