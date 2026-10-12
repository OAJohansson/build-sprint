# Brief

*Master copy: `docs/product/polish-sprint/brief.md` in the [kids-app repo](https://github.com/OAJohansson/kids-app). Copied here at wrap-up for the notebook. The full discovery, competitor research and every sprint document are in the [Inkling Product Notebook](https://claude.ai/artifact/SZWbpHSzw5F2MP2D3zuqm5).*


**Date:** 2026-10-12 · **Appetite:** a few hours, fixed (cut scope, not time) · **Status:** agreed 2026-10-12

Why now: a possible demo in an interview with Enthuse. In two minutes it has to show product
thinking (learnings → decisions), craft and a clear user journey, not just a pretty screen.

Built on the desk research in [`../01-discovery/`](../01-discovery/). No new discovery.

## Problem

16–25-year-olds who keep asking themselves "am I on the right path?" go round in circles
instead of getting anywhere. The tool they reach for at night (ChatGPT) agrees with them and
forgets, and what they learn about psychology online is shallow or wrong. Inkling already does
the opposite underneath, but on screen it looks like the chatbot it's positioned against. So
the thing that makes it different is invisible.

Evidence: 58% of US 18–25s lacked meaning or purpose in the past month (Making Caring Common
2023), and insight, not the amount of reflection, predicts wellbeing (Lyke 2009). Users' top
complaint about AI for reflection is "it just agrees with me" (arXiv 2504.20320).

## Who

**Maya, 19, first year of a law degree**, living in halls. She picked law partly because her
parents suggested it, and is starting to wonder whether it's really hers. She watches
psychology TikTok, has a notes app full of half-started journals, and talks things through
with ChatGPT late at night. She isn't in crisis; she's unsettled. Full persona in
`user-testing/persona.md` (written at test time).

Not designed for today, but still safe for them: 16–17s still at school. The crisis handling
stays as it is.

## Moment of use

About 10.30 pm, in bed, on her phone, for 5–10 minutes. Something that day poked the worry
(a seminar she didn't care about, a friend who loves their course). She's a bit wound up,
not distressed, and wants it out of her head before she sleeps.

## Jobs to be done (ranked)

1. When I'm lying awake looping on "am I on the right path?", I want to get it out of my
   head and see it more clearly, so I can stop going round in circles.
2. When I notice something about how I think, I want to know what it is and why people work
   that way, so I feel less weird and more in charge of it.
3. When I've reflected a few times, I want to see what I've learned about myself, so it feels
   like it's adding up to something.

## Today's alternatives

| Alternative | Good | Annoying |
|---|---|---|
| ChatGPT at night | Always there, doesn't judge | Agrees with everything, forgets, unclear who reads it |
| A friend | Real warmth | It's late; doesn't want to be a burden, again |
| Psychology TikTok | Fun, feels relatable | Shallow or wrong, and none of it is about *her* |
| Notes app or paper journal | Private | Blank page, no payoff, abandoned in two weeks |

**Why switch:** Inkling helps her step back instead of agreeing, and she leaves each session
with something kept: an idea that explains what's going on, in her own words.

## Riskiest assumptions

- **Value (riskiest):** young people want to *learn* the idea behind what they feel, not only
  to feel better. Untested by the desk research. Here we can only test a proxy: does the
  "you met an idea" moment land as a gift or feel like homework, for the simulated persona?
- **Usability:** the idea moment doesn't interrupt the reflection.
- **Feasibility:** a public demo mode plus a redesign fit in a few hours.
- **Viability:** a public demo costs nothing to run, can't be abused, and exposes no real data.

## Success: what good looks like for the demo

**Main outcome:** someone seeing Inkling for the first time can say, within two minutes, what
makes it different from ChatGPT, because they've seen it happen.

| Signal | How it's measured | Bar |
|---|---|---|
| The difference is seen, not told | In the simulated test, asked after the run "how is this different from ChatGPT?", the viewer names "it names and keeps the idea" or "it helps you step back", unprompted | Yes, for both personas (Maya and a recruiter) |
| The journey completes | Open the demo → finish with a takeaway, without help, on a 375px phone | ≤ 2 min and no dead ends |
| The idea moment lands | Persona's reaction to the idea card | Rated useful ≥ 4/5, not "lesson-like" |

**Guardrail:** the demo never touches real data. That means zero requests to Supabase or the
AI provider from the demo route (checked in the network log), and the real app's 126 unit
tests and crisis behaviour are unchanged.

## Ideas that could close the gaps

Addresses gap 1 (the selling point can't be seen), gap 2 (no journey) or gap 3 (looks like
ChatGPT). Rough effort: S < 30 min, M ≈ 30–60 min, L > 1 h.

| # | Feature | Gap | Effort | Notes |
|---|---|---|---|---|
| A | **Demo mode** at `/demo`: Maya's seeded data, a scripted day, no sign-in, no database | all | M | Required for recruiters and for the simulated test |
| B | **Writing page, not chat bubbles.** Today's question as a card, your words on the page, Inkling's replies as quiet margin notes | 3 | L | The core of the new look |
| C | **"You met an idea" card.** When a reply names a concept: name, plain explanation, where it comes from, your own sentence it came from, and *Keep* | 1 | M | Data already exists; the real app needs a small API change |
| D | **Takeaway at the close.** The session ends on one card: what you noticed and the idea(s) you kept | 2 | M | The insight is already generated when the conversation closes |
| E | **Two ways in.** "Today's question" or "Just write" (a brain dump) | 2 | S in demo, L in real app | The real app needs a database change: out of scope |
| F | **"Your ideas" shelf.** Each idea you've met, with the sentence of yours it came from | 1, 2 | M | Restyles the existing Library |
| G | **First open, 3 calm screens:** what this is, what happens to your words (private, not therapy), your name | 2, trust | S–M | Learning 5 |
| H | **Fix what breaks a demo:** phone menu, typing dots, toasts instead of browser pop-ups, tab title and icon | 3 | S | Do regardless |
| I | **"Remember Tuesday?"** Review an idea through your own sentence | 1 | M | Wow, but the third thing to learn in two minutes |
| J | Weekly letter "what you learned about yourself" | 2 | L | Backlog |
| K | A map of your ideas | 1 | L | Rabbit hole |

### My recommendation (owner decides)

**Above the stop line:** A, H, B, C, D. That's one journey for one evening: question →
write → meet an idea → leave with a takeaway. It's thin on each gap, and all three are
covered in one flow.

**If time is left, in order:** F, then E (demo only), then G.

**Backlog:** I, J, K.

## Requirements (to finalise after the pick)

- On a 375px phone, `/demo` opens without sign-in and shows Maya's evening in under a second.
- The demo makes zero network calls to Supabase or OpenRouter.
- When a reply names a concept, the idea card appears below that reply. Its explanation says
  "a pattern psychologists call…", never "you have…" (no labels, no self-diagnosis).
- After the closing reply, the takeaway card appears with the insight and the kept ideas.
- The crisis card behaviour in the real app is untouched.

## No-gos

- No changes to AI prompts, postures or crisis logic (evals cost money and protect safety).
  Only exception: E, if the owner picks it, with the evals re-run.
- No database migrations, except for E if picked (applied by hand by the owner).
- No streaks, notifications or nudges (Children's Code).
- No real user data in the demo, and no screenshots of real entries.

## Rabbit holes

- Rebuilding the real chat pipeline around the new journey. Keep the existing API routes and
  extend their responses; don't restructure them.
- Theming every side page (Library, Insights, Settings) to the new look.
- A live AI in the public demo: cost, abuse and safety for a page anyone can open.

## Decisions (owner, 2026-10-12)

1. **Above the stop line:** A demo mode, H demo-breaking fixes, B writing page, C idea card,
   D takeaway. If time is left, in order: F shelf, E "Just write", G first-open screens.
2. **The demo is scripted:** pre-written replies, so it's the same every time, free to run and
   safe for a public link.
3. **Every feature works with real data too, not only in the demo.** Each screen is built once
   with two data sources (the real API, or Maya's demo script). Costs: C and D need the reply
   endpoint to return the concepts and the closing insight; G stores "seen" on the device;
   E needs a migration and an AI prompt change (re-run the evals), so it gets decided when
   we reach it.

## Update after design (2026-10-12)

The owner widened the design to the whole app (Start, Today, Log book, Ideas) in the Steps
look, with free writes separate from today's question, and asked that everything run on real
data. Re-cut to scope A: everything except the Log book's thread card and "Coming back to you"
(both in `backlog.md`). Details in `design.md` and `journal.md`.

## Success check (filled in at wrap-up, 2026-10-12)

| Signal | Bar | What happened | Met? |
|---|---|---|---|
| The difference is seen, not told | Both personas name it unprompted | Sam (hiring manager) at ~1:10, at the idea card: "it names the pattern as a real concept and keeps it". Maya: "it asked what I'd want a friend to find out first… ChatGPT forgets; this has a shelf." | Yes (simulated) |
| The journey completes | ≤ 2 min, no dead ends, 375 px | Sam 1:50 and Maya 1:40 to the takeaway, no dead ends (Maya ~3:30 if typing for real) | Yes |
| The idea moment lands | ≥ 4/5, not lesson-like | Maya 4/5, "a gift, not homework"; minus one for "foreclosure" sounding clinical | Yes |
| **Guardrail:** the demo never touches real data | 0 requests to Supabase / AI / `/api` | 0 of 53 requests (Maya run), 0 (Sam run); the demo now skips the session check entirely | Yes |
| **Guardrail:** crisis behaviour unchanged | Tests and evals pass | 138 unit tests pass; crisis evals pass on the new model (8/8 after a prompt fix) | Yes |

**Did it solve the problem?** For the demo, yes: Inkling no longer looks like a chatbot, the
selling point has its own moment, and there is a journey from question to kept idea. For real
users it's unproven: every test was simulated, and the riskiest assumption (young people want to
*learn* the psychology, not only feel better) is still untested.

**What changed from the plan.** The appetite was a few hours; it took about three and a half,
and scope grew twice by the owner's choice (the whole app instead of one screen; free writes as a
separate way in), plus a switch from OpenRouter to the Claude API. Two no-gos were broken with
the owner's approval: a migration (free writes) and AI prompt changes (a free-write stance, and
two sentences after the evals).
