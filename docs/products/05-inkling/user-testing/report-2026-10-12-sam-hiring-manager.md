# User test: Inkling, 2026-10-12 (Sam, hiring manager)

**Persona:** Sam, product hiring manager, opening the demo cold on a phone between interviews ·
**Method:** simulated (user-tester agent), Playwright Chromium 390×844 @2x · **Build:** local dev,
commit 46d9e5f (`polish-sprint`)

## Verdict

"A nightly journaling prompt that turns what you wrote into a real psychology idea and keeps it in
a collection, so you build up a picture of yourself over time. That's a product, not a chat box. I
got it in about 70 seconds, nothing broke, and I remember the orange 'Identity foreclosure' card.
I'd interview this person — and I'd ask what's real and what's scripted, because the demo never
tells me."

## Scenario

| # | Scenario | Result | Taps / time | Main issue |
|---|---|---|---|---|
| S4 | First look, cold from /login | **Pass** | 7 taps / ~1:50 to the takeaway (10 / ~2:20 incl. Ideas) | Doesn't say replies are scripted (F1); "Continue" after a question (F2) |

Difference from ChatGPT named unprompted at ~1:10, at the idea card ("it names the pattern as a
real concept and keeps it for you"). No dead ends. Knew the data was made up from the banner.

## Findings

| ID | Severity | What happened | Suggestion |
|---|---|---|---|
| F1 | major | The "made-up data" note disappears during the writing flow; nothing says replies are scripted and words pre-filled | One quiet line on write/reply screens |
| F2 | minor | First reply ends with a question; the only button says "Continue" | "Answer this", or idea first |
| F3 | minor | "Answer the question" after the idea card: which question? | Quote the question |
| F4 | minor | Follow-up write screen header repeats the reassurance paragraph | Show only the question sentence |
| F5 | minor | Secondary targets < 44 px: Leave demo 66×14, Not tonight 90×32, Back 70×32, filter pills 36 px, chips 28 px | 44 px hit areas |
| F6 | minor | Takeaway idea chip isn't tappable; on Today it is | Link it to the idea |
| F7 | polish | Rust eyebrow labels 3.6–4.3:1 on peach/pink | Darken the token (e.g. #7a4a33) |
| F8 | polish | Audience (16–25) never stated | One line on login or the banner |

Also: "Lately" on Today still shows Fri 9 Oct after tonight's entry; reads stale.

## Guardrails, measured

- Network: 0 requests to Supabase, OpenRouter or `/api/*`; 0 requests off localhost.
- Horizontal scroll: none (scrollWidth 390 on every screen).
- Main actions all 56 px tall; tab bar items 80×60. Secondary targets: see F5.
- Contrast (worst): "Today's question" eyebrow #9a6a4c on peach 3.65:1; "Tonight you noticed" on the
  done card 3.56:1; on the takeaway gradient ~3.7–4.0:1; idea card category line 4.14:1; date and
  "Added to your ideas" on the page 4.27:1. Body text well above 7:1.

## Value and progress

- Earns its place: the idea moment; Ideas with "In your words"; the takeaway title in her voice.
- Missing for a reviewer: a 10-second "why this exists" (who it's for, what research says).
- Progress: ideas pile up and "Came back twice" shows a pattern, but it's below the fold. Suggests a
  "recurring themes" strip at the top of Ideas (close to the parked thread card).

## Method notes

Scripted AI and pre-filled text, as the plan says; timing estimated at a skim-reading pace;
think-aloud in character. Screenshots: `shots/sam-*.png`. Suggestion for the test system: ask
"what did you think was real?" after every demo-style run.
