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

*Draft for the kickoff gate.* **Main outcome:** I keep studying a field across connected areas, in small pieces, instead of going deep in one school and dropping it.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Hop (early sign of value) | First session, and the simulated user test: from the map, I pick a second, connected area and start it | Yes in my first session; 3 of 3 in the user test |
| Still going after a week (value) | The app's own "where I've been" history, read on day 7 | At least 2 connected areas touched on 3+ separate days |
| Orientation (job 1) | After 5 minutes on the map: where does existentialism sit, what came before it, what did it push against? | I can answer all three without looking |
| Guardrail: accuracy | Spot-check 20 claims (thinkers, dates, links) against a reference (e.g. Stanford Encyclopedia of Philosophy) | 0 invented thinkers or links; at most 1 small slip |

## MVP and stop line

## Feature drill-down

The product's objects, each through four checklists: lifecycle (create, find, change, organise, remove, take out), connections, screen states (empty, working, error, full) and trust (undo, confirm, nothing lost). Claude pre-fills a call and a reason; I change what I disagree with. MVP rows become requirements; Later rows go to the backlog (playbook step 1).

| Object | Action or state | Call | Why |
| --- | --- | --- | --- |

## Requirements

| # | Must | Check |
| --- | --- | --- |

**No-gos:** 

**Rabbit holes:** 

## Unit tests

The 0–3 pieces of logic that would hurt most if silently wrong, and the edges to check.

## Success check (at wrap-up)
