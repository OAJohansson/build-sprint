# Clew: build handoff

For the engineer. The mockups in this folder are generated from `_src/` (`node build.mjs`, `./shoot.sh`); nothing on the globe is hand-placed per focus. `_src/layout.mjs` is plain functions with no DOM and can be lifted as it is.

## Tokens

| Token | Value | Used for |
| --- | --- | --- |
| `ground` | `#101918` | Page (under a radial light: `#1f2d29` → `#141f1d` → `#0c1413`) |
| `lift` | `#18231f` | Card and popover surface |
| `bone` | `#e9e2d4` | Text, dots, threads |
| `brass` | `#d3a66c` | Here (filled), visited (ring), a thread between two visited schools, the primary button |
| `quiet` | bone at 72% | Secondary text (dates, hints, labels like "It asks") |
| `faint` | bone at 14% | Hairlines and borders |

Brass has exactly three meanings: a filled brass point is where you are; a brass ring is a school you have visited; brass on a button is the one primary action. Nothing else is brass.

| Type | Value |
| --- | --- |
| Names | Fraunces, weight 300 at optical size 144 for the focused school (48 px) and the thinker (36 px); weight 400 for schools one thread away (22 px), key ideas (17.5 px) and questions (19 px, weight 300) |
| Everything else | Hanken Grotesk 400; 600 on the primary button |
| Other schools | 15 px at bone 86% (front), 14 px at bone 62% (far side) |
| Verbs ("built on") | 13.5 px, full bone |
| Dates, hints, section labels | 13–13.5 px, quiet |
| Smallest text anywhere | 13 px |

| Size | Value |
| --- | --- |
| Globe | centre (510, 456), radius 410 on a 1440 × 900 screen; card 340 wide at x 1056 |
| Dots | here 14 px, one thread away 12 px, others 8 px, far side 6 px |
| Threads | 1 px at 34% (20% on the far side); from the focus 1.6 px at 90%; walked 1.5 px brass |
| Radii | card 22, popover 16, button 13, pills 99 |
| Clear oval round the title | 190 × 78 half-axes; threads from the focus stop at its edge |

## Where a school sits, for any focus

1. Every school has one fixed place on a unit sphere, stored in the data file as `pos: [latitude, longitude]`. These were found once (`_src/embed.mjs`) so that every linked pair sits 44–50 degrees apart and no two schools are closer than 44 degrees. Add a school by adding a `pos`; re-run `embed.mjs` if the links change a lot.
2. To focus a school, turn the globe so that school faces the viewer. For each other school compute the angle from the focus (`theta`, 0–180 degrees) and its direction round the focus.
3. Flatten the whole sphere onto the disc: distance from the centre = `R × (theta / 180)^0.6`, capped at `0.93 R`. Linked schools therefore land about 175–190 px from the centre; the far side of the globe is squeezed toward the rim.
4. Depth is tone and size, not blur: a school more than 100 degrees away is "far side" (smaller dot, dimmer label, fainter threads).
5. A thread is the great circle between two schools, sampled in 28 steps and projected the same way (`thread()`), so threads curve like lines on a globe with no tuning.
6. With nothing in focus (first visit, "Whole field") the globe faces its emptiest spot (`emptiest()`), so no school sits under the welcome line.

Because the places are fixed and spread evenly, any focus gives a balanced globe; re-focusing is a rotation, which is also what a later transition would animate (motion is not designed yet).

## Where a label sits

Labels are placed after layout, in the browser (`_src/lib.mjs`, about 30 lines):

- Order: schools one thread away first, then by angle from the focus.
- Each label tries 24 places round its dot (12 directions, two distances), starting pointing away from the centre.
- A place costs more if it overlaps another label, the title, the card, the header or a dot, sits outside the globe, or lies on a thread (threads from the focus count four times). Cheapest wins.
- Whatever still passes behind a label is knocked out with an SVG mask, so a thread never draws through text.

Checked for all 16 possible focuses with `./check.sh`: no label overlaps another label, the title, the card or a dot. Between 0 and 6 threads per focus pass behind a label and are knocked out (2 with Existentialism in focus, 6 with Stoicism). With Scholasticism in focus one label pokes a few pixels past the rim.

## Interactions

| Action | Result |
| --- | --- |
| Click a school (dot or label) | The globe turns to it; it becomes the title; a visit is recorded with today's date |
| Hover a school | Name underlines, dot gets a soft ring (pointer devices only) |
| Click "Themes" under the title | Popover with the school's themes, anchored under the title; click again or Esc closes it |
| Click a thinker in the card | Card swaps to the thinker; the thinker hangs under the title on a short brass thread |
| Click "Study with Claude" | Copies the prompt; the button becomes "Copied" and the first lines of the prompt show beneath, announced politely to screen readers; reverts after a few seconds |
| "← Existentialism" in the card, or a thinker name at the bottom | Back to the school, or across to another thinker |
| "Whole field" pill | Nothing in focus; card closes |
| Esc | Closes the innermost thing: popover, then thinker, then focus (to the whole field) |
| Tab | Header, then schools one thread away, then the other schools nearest first, then the card |
| Enter or Space on a focused school | Same as click |
| Arrow keys | Not designed |

No transition is designed; changes are instant. Keyboard-triggered changes should stay instant when motion is added.

## Phone (390 wide)

No globe. One school at a time: title, "One thread away" as a list on a single vertical thread, then questions and thinkers. Tap a neighbour to move. Themes, thinker and copied states on the phone are not drawn yet.

## Known limits

- Long names wrap at 170 px (230 px for schools one thread away); see `worst-case.png`.
- Long questions make the card taller; it stays vertically centred.
- "over 3 days" is a fixed string in the mockups; it must come from the visit history.
- Stoicism's detail content and the prompt text are sample copy.
