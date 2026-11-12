# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

## Problem

*Draft for the kickoff gate.* When I get curious about a big field like philosophy, I dive into one school and stay there for weeks, because I have no picture of the whole field to show me what's connected and where else I could go. So I go deep, get bored and drop the subject, when what keeps me going is variety: small pieces across connected areas.

## Who

Me: curious across psychology, philosophy and history, remembers what they see more easily than what they hear, studies on their own with Claude (Socratic modules, quizzes). Tends to obsess over one thing until bored; now deliberately mixes the day for variety. Full persona in `user-testing/persona.md` after the gate.

## Moment of use and jobs to be done

**Moment:** at a desk on the laptop, in a sit-down study session, usually right before or between Claude modules. The phone works but is simpler (one area at a time); the whole-field view is a laptop job.

1. When I get curious about a new field, I want to see its whole shape at a glance, so I know where my interest fits.
2. When I've spent a while in one area and want variety, I want to see what's connected nearby, so I can switch to something fresh without losing the thread.
3. When I zoom into an area, I want a short summary of its key questions, themes and thinkers, so I can decide whether to dig in (and then go deeper with Claude).

## Today's alternatives

- **Claude Socratic modules with quizzes:** good for depth, and staying. But linear: one school at a time, no picture of the whole, nothing suggests where to go next.
- **Articles and Wikipedia:** start in the middle of a topic, text-first; you have to find the next article yourself.
- **Illustrated overview books** (e.g. "big ideas" style philosophy books) and timelines: visual and broad, but fixed, can't zoom, and don't know where you've been.
- **Why switch:** the map is the missing first step and the "what next" between modules, not a replacement for them.

## Riskiest assumptions

**Riskiest (L4): value.** The MVP must test it.

- **Value (riskiest):** a map makes me actually hop between connected areas and keep going for weeks, rather than being nice to look at once.
- **Feasibility:** Fable can draw an accurate, good-looking map of a field; an AI-drawn history can invent links between thinkers.
- **Usability:** zooming between levels stays clear, and I can find my way back.
- **Viability:** model cost per map and per zoom stays small for one person.

## Success: what good looks like

**Main outcome (L5):** I keep studying a field across connected areas, in small pieces, instead of going deep in one school and dropping it.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Hop (early sign of value) | First session, and the simulated user test: from the map, I pick a second, connected area and start it | Yes in my first session; 3 of 3 in the user test |
| Still going after a week (value) | The app's own "where I've been" history, read on day 7 | At least 2 connected areas touched on 3+ separate days |
| Orientation (job 1) | After 5 minutes on the map: where does existentialism sit, what came before it, what did it push against? | I can answer all three without looking |
| Guardrail: accuracy | Spot-check 20 claims (thinkers, dates, links) against a reference (e.g. Stanford Encyclopedia of Philosophy) | 0 invented thinkers or links; at most 1 small slip |

## MVP and stop line

**Decided (L6).** Appetite: one day. Tests the riskiest assumption (will I hop?).

**Ships:**
1. **The whole field:** one map of Western philosophy, Greeks to today: eras and schools, and how they connect ("built on", "pushed against"). (Job 1)
2. **Zoom into a school:** its key questions and themes, 3–5 thinkers, what it reacted against, and 2–3 "go next" neighbours. (Jobs 2, 3)
3. **One level deeper, a thinker:** a short summary and key ideas, plus a ready-made prompt to study it with Claude. (Job 3; keeps the modules that already work)
4. **Where I've been:** areas I've opened are marked on the map, with dates, saved in the browser. (Job 2, and the day-7 signal)

**How (provisional):** Fable writes the philosophy map once, while we build; it's checked against the accuracy guardrail and shipped as a fixed file. No live AI calls in the MVP.

**Stop line, straight to the backlog:** any field beyond philosophy, generating a map live from a typed topic, deeper levels than thinker, Eastern and other traditions, the in-app study modules, sharing.

## Feature drill-down

The product's objects, each through four checklists: lifecycle (create, find, change, organise, remove, take out), connections, screen states (empty, working, error, full) and trust (undo, confirm, nothing lost). Claude pre-fills a call and a reason; I change what I disagree with. MVP rows become requirements; Later rows go to the backlog (playbook step 1).

*Draft for the kickoff gate.* Objects (the product's vocabulary): **map** (the whole field), **school** (an area on the map), **thinker**, **link** (built on, pushed against), **visit** (where I've been).

| Object | Action or state | Call | Why |
| --- | --- | --- | --- |
| Map | Open: the whole field on first load | MVP | Job 1 is the first thing you see |
| Map | Find: search for a school or thinker | Later | ~20 schools fit on one screen; search pays off with more fields |
| Map | Zoom and pan freely | No | Two fixed levels (whole field, one school) are clearer than a free canvas, and avoid a rabbit hole |
| Map | Back to the whole field from anywhere | MVP | Never lost: Esc and a visible control |
| Map | Change, organise or edit the map | No | The map is reference content, not my notes |
| Map | Take out: share or download | Later | No one to share with yet |
| School | Open: questions, themes, thinkers, reacted against, go next | MVP | Jobs 2 and 3 |
| School | Go next: jump to a neighbour | MVP | The hop the riskiest assumption is about |
| Thinker | Open: summary and key ideas | MVP | Job 3 |
| Thinker | "Study with Claude": copy a ready-made prompt | MVP | Hands off to the modules that already work |
| Thinker | Open the thinker's own works or further reading | Later | Nice, but the Claude prompt covers "go deeper" today |
| Link | See how two schools connect (built on, pushed against) | MVP | Where existentialism sits is a question about links |
| Link | Explain one link in a sentence | Later | Labels are enough for the first test |
| Visit | Recorded when I open a school or thinker, with the date | MVP | Job 2 and the day-7 signal |
| Visit | Shown on the map (visited areas marked) | MVP | "Where I've been" at a glance |
| Visit | Clear my history | Later | Rarely needed; a browser reset does it for now |
| Visit | Undo or remove one visit | No | Visits are a record, not a choice |
| Screens | Empty: first visit, nothing visited yet | MVP | The map itself is the welcome; one quiet line on how to start |
| Screens | Working or error | No | Fixed content, nothing to load or fail |
| Screens | Full: long school or thinker names | MVP | Real names are long ("Logical positivism"); must not break the layout |
| Screens | Phone | MVP | Works one school at a time; simpler, not broken |
| Trust | Visits survive a reload | MVP | Otherwise the day-7 check is worthless |
| Trust | Nothing to confirm or undo | No | Nothing destructive in the MVP |

## Requirements

*Draft, from the MVP rows above.*

| # | Must | Check |
| --- | --- | --- |
| R1 | The whole map of philosophy (eras, schools, links) fits a laptop screen on first load | At 1440×900, every school is visible without scrolling |
| R2 | Opening a school shows its questions, themes, 3–5 thinkers, what it reacted against and 2–3 go-next neighbours | Every school in the data has all five; spot-check 3 on screen |
| R3 | Choosing a go-next neighbour opens that school | One click from Existentialism reaches a neighbour's panel |
| R4 | Opening a thinker shows a summary and key ideas; "Study with Claude" copies a prompt and says so | Paste the clipboard: the prompt names the thinker |
| R5 | Opened schools and thinkers are marked as visited, with the date, and survive a reload | Open two, reload: both still marked |
| R6 | From any level, Esc or a visible control returns to the whole map | Tested from a school and from a thinker |
| R7 | The content passes the accuracy guardrail | 20-claim spot check: 0 invented thinkers or links |
| R8 | On a phone, one school at a time, nothing cut off or overlapping | At 375 px wide, open a school and a thinker |

**No-gos:** accounts or a backend, live AI calls, fields beyond philosophy, free zoom and pan, editing the map.

**Rabbit holes:** an automatic graph layout (place schools by hand in the data file instead); making the content complete (cap at about 20 schools and 60 thinkers); polishing transitions between levels before the content works.

## Unit tests

The 0–3 pieces of logic that would hurt most if silently wrong, and the edges to check.

*Draft.* One: **counting days and areas from the visit history** (feeds "where I've been" and the day-7 signal). Edges: empty history, two visits either side of midnight count as two days, the same school twice in a day counts once, month end.

## Success check (at wrap-up)
