# User test: Inkling, 2026-10-12 (Maya, 19)

**Persona:** Maya, 19, first-year law student unsure law is theirs · **Method:** simulated
(user-tester agent), Playwright Chromium 390×844 @2x · **Build:** local `/demo`, commit 46d9e5f

## Verdict

"Lowkey yes, for a week at least. It didn't pep-talk me or give me a five-step plan, it gave the
thing in my head a name, said it isn't a verdict, and I went to bed with one sentence. But when I
opened the Log book, what I'd written had been cut down and my answer was gone. If it does that
with my real words, I'm out."

## Jobs

| Job | Score | Why |
|---|---|---|
| Get the loop out of my head, see it clearly | 4 | 6 taps to a one-line takeaway; the friend question helped me step back |
| Know what my pattern is and why | 4 | Plain, normalising idea card; doesn't show my sentence, can't tap for more |
| See it adding up | 3 | Ideas shelf, "Came back twice", "In your words" are good; nothing connects ideas over weeks |

## Scenarios

| # | Scenario | Result | Taps / time | Main issue |
|---|---|---|---|---|
| S1 | Tonight's question, in bed | pass | 6 taps / ~1:40 (pre-filled; ~3:30 typed) | "Continue" under a question, idea card in between (F3) |
| S2 | Something on my mind | pass, with friction | 7 taps / ~1:45 | Just write still asks two questions; entry keeps only the first sentence (F1, F3) |
| S3 | What have I figured out? | pass | 2 taps / ~20 s | Tonight's ideas on the shelf before being met (F4) |

**Different from ChatGPT (asked after):** "ChatGPT would've said law's a great foundation and given
me options. This didn't tell me what to do. It asked what I'd want a friend to find out first, which
made me step back. And it named the thing, identity foreclosure, and kept it with my own sentence.
ChatGPT forgets; this has a shelf." Both target phrases, unprompted.

**Idea moment:** 4/5, a gift, not homework. Minus one: "foreclosure" sounds clinical (and like
mortgages to a law student), and the card doesn't show my sentence.

## Findings

| ID | Severity | What happened | Suggestion |
|---|---|---|---|
| F1 | major | The entry page shows a shortened version of what I wrote; my follow-up answer is missing | Keep every turn's full text; show it on the entry page |
| F2 | major (demo) | Typing my own words still gets the scripted reply and entry; nothing says so | "Demo: replies are pre-written, whatever you type." |
| F3 | minor | "Continue" under a question; idea card between the question and "Answer the question"; Just write still quizzes | "Answer this"; or idea after the answer; a "stop here" option |
| F4 | minor | Tonight's ideas already listed on the shelf, with empty pages | Seed only past ideas |
| F5 | minor | Idea card doesn't show which sentence of mine it came from | "From what you wrote: '…'" |
| F6 | minor | "Not tonight" throws typed words away | Keep the draft, or ask |
| F7 | minor | Small brown labels 3.7–4.4:1 | Darken to ~#7a4f36 |
| F8 | minor | Small targets: Leave demo, Not tonight, back links, filter chips | Pad to 44 px |
| F9 | polish | "Lately" doesn't update after a session; a free write leaves no trace on Today | Update Lately |
| F10 | polish | Idea chips on the takeaway aren't tappable | Link to the idea |
| F11 | dev only | Next.js dev badge covers the Ideas tab | Ignore |

## Guardrails, measured

- 0 of 53 requests to Supabase, OpenRouter or `/api/*`.
- No horizontal overflow at 390 px (17 screens).
- Main actions ≥ 56 px tall; tabs 80×60. Secondary controls below 44 px (F8).
- Contrast: "Today's question" 3.67; "Tonight you noticed" 3.93 / 3.99; inactive tabs 4.06; done
  note 4.26; small labels on cream 4.27; "Last came up" 4.40. Body text 7.5–13.5.

## Value and progress

- Earns its place: the bedtime flow, the idea card ("it isn't a verdict"), the one-line takeaway,
  Ideas with "In your words".
- Doesn't yet: the Log book filters; Just write (turns into the same Q&A).
- Would bring her back: seeing tonight's step again ("How did the lecture go?"), said once.
- Most valuable progress view: a "Your thread" card naming the question she keeps circling, its
  ideas in date order with her sentences, ending on her latest step (the parked thread card).

## Method notes

Scripted AI and pre-filled words (own typing also tested: ignored by the script, F2). Couldn't
judge keyboard overlap, real typing, real AI, reduced motion, VoiceOver. Screenshots:
`shots/maya-*.png`. Suggestion for the test system: always check the saved entry against what was
typed.
