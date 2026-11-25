# Clew: build handoff (round 4, 24 schools)

For the engineer. The mockups are generated from `_src/` (`node build.mjs`, `./shoot.sh`); nothing on the globe is hand-placed. `_src/layout.mjs` is plain functions with no DOM and can be lifted as it is. The eight added schools and their links are sample content, unchecked.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| `ground` | `#101918` | Page (under a radial light: `#1f2d29` → `#141f1d` → `#0c1413`) |
| `lift` | `#18231f` | Card and panel surface |
| `bone` | `#e9e2d4` | Text, dots, threads |
| `brass` | `#d3a66c` | Here (filled point), visited (ring), the primary button |
| `quiet` | bone at 72% | Secondary text |
| `faint` | bone at 14% | Hairlines and borders |

Brass has three meanings and no others: a filled brass point is where you are; a brass ring is a school you have visited; brass on a button is the one primary action. There is no brass thread any more.

Bright means one thing: a school one thread away from the focus (22 px Fraunces, full bone, 12 px dot, bright thread). Every other school is dim whether visited or not: 15 px Hanken Grotesk at bone 78% on the near side, 14 px at 70% on the far side. A visited school only adds its ring.

| Type | Value |
| --- | --- |
| Focused school | Fraunces 300, optical size 144, 48 px |
| Thinker name | Fraunces 300, 36 px; panel summary 30 px |
| Schools one thread away | Fraunces 400, 22 px, with the verb above at 13.5 px in full bone |
| Questions | Fraunces 300, 18 px |
| Card rows (themes, thinkers) | Hanken Grotesk 15.5 px; open theme text 14.5 px |
| Smallest text | 13.5 px (dates, hints, section labels) |

| Size | Value |
| --- | --- |
| Globe | radius 410; centre (500, 456) when a card or panel is open, (720, 456) when not |
| Card and panel | 386 wide at x 1010, vertically centred, at most 860 tall (scrolls inside beyond that) |
| Dots | here 14 px, one thread away 12 px, others 8 px, far side 6 px |
| Threads | 1 px at 30% (15% when an end is on the far side); from the focus 1.6 px at 90%, dotted for "pushed against / pushed back" |
| Fade oval round the title | 186 × 86 half-axes: threads from the focus run to the centre and fade out inside it |

## Where a school sits, for any focus

1. Every school has one fixed place on a unit sphere: `_src/positions.mjs`, written by `node embed.mjs`. Re-run it when schools or links change. At 24 schools and 37 links it finds: no two schools closer than 35 degrees, linked schools 36–72 degrees apart.
2. To focus a school, turn the globe so it faces the viewer; for every other school take its angle from the focus (`theta`) and its direction round the focus.
3. Flatten the whole sphere onto the disc: distance from the centre = `R × (theta / 180)^0.48`, capped at `0.93 R`. Linked schools land roughly 175–265 px from the centre; the far side is squeezed toward the rim.
4. Far side = more than 100 degrees from the focus: smaller dot, dimmer label, fainter threads.
5. A thread is the great circle between two schools, sampled in 28 steps and projected the same way.
6. With nothing in focus the globe faces its emptiest spot.

## Where a label sits

Placed after layout, in the browser (`_src/lib.mjs`):

- Order: schools one thread away first, then by angle from the focus.
- Each label tries 36 places round its dot (12 directions, three distances), starting pointing away from the centre.
- Costs, highest first: overlapping another label, the title, the card or the header; covering another school's dot; sitting nearer another dot than its own; leaving the globe; lying on a thread (a thread from the focus counts fourteen times).
- Whatever thread still passes behind a label is knocked out with an SVG mask.

Checked for all 24 focuses with `./check.sh`: no label overlaps another label, the title, the card or a dot. Per focus, 7–22 faint threads pass behind a label and are knocked out, and in 7 of the 24 focuses one or two labels poke past the rim (Existentialism is one of them: Classical Greek and Post-structuralism). Known weak spot: when two schools one thread away sit close together (Phenomenology and Absurdism from Existentialism, 35 degrees apart), one label can land on the other's bright thread and cut it.

## The card

Three sections, in this order: "It asks" (three questions), "Themes" (one row each), "Thinkers" (one row each).

- Clicking a theme opens it in place: its row turns semibold on a slightly lighter panel, with two or three sentences and the thinkers it belongs to. One theme open at a time; clicking it again closes it. Rows highlight on hover.
- A thinker name inside an open theme opens that thinker.
- Clicking a thinker swaps the card to the thinker (summary, key ideas, "Study with Claude", the other thinkers in one row). The thinker also hangs under the title on a short brass thread.
- "Study with Claude" copies the prompt; the button becomes "Copied", a line confirms it and the first four lines of the prompt show beneath. The row of other thinkers stays.

## Your thread

- A quiet "Your thread" button in the top bar, shown once there is at least one visit.
- It opens a panel in the card's place: the count ("4 schools on 4 days"), "since" the first date, then one row per day, newest first, with the schools (and thinkers) opened that day. Every name in it is a link to that school or thinker.
- The count is computed from the rows: schools = distinct schools visited; days = distinct dates.
- Close with the "Close" button, Esc, or the "Your thread" button again; the school's card returns.
- Nothing about visits appears on the globe except the brass ring: no dates, no count, no hover dates.

## Back to the overview

There is no "Whole field" pill. Three ways back: Esc, clicking empty space on the globe, clicking the Meander logo. In the overview nothing is in focus, no card is open and the globe sits in the middle of the screen. On the very first visit there is no welcome line and no "Your thread" button (decision L15): the globe alone invites.

## Interactions

| Action | Result |
| --- | --- |
| Click a school (dot or label) | The globe turns to it; it becomes the title; the visit is recorded with today's date |
| Hover a school | Name underlines, dot gets a soft ring (pointer devices only) |
| Click a theme row | Opens in place; closes any other |
| Click a thinker | Card swaps to the thinker |
| Click "Study with Claude" | Copy, then the Copied state; reverts after a few seconds |
| Click "Your thread" | Opens or closes the panel |
| Click the logo, or empty space on the globe | Overview |
| Esc | Closes the innermost thing: Your thread, then an open theme, then the thinker, then the focus |
| Tab | Logo, Your thread, schools one thread away, the other schools nearest first, then the card |
| Enter or Space on a school | Same as click |
| Arrow keys | Not designed |

No transition is designed; changes are instant.

## Phone (390 wide)

No globe. Title, then "One thread away" as a plain list (dot, verb, name; a brass ring on visited ones; no joining line), then questions, themes and thinkers. Only the school screen is drawn.

## Known limits

- Long names wrap at 170 px (230 px for schools one thread away); see `worst-case.png`.
- With a theme open the Existentialism card is about 820 px tall; a longer theme text would make it scroll.
- Stoicism's themes have no text yet; the prompt text and all eight added schools are sample copy.
