# Interview story: Inkling

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** I turned an AI journal that looked like a chatbot into a journal that teaches, by making the strength it already had visible, tested it with simulated users, and shipped it with a safe public demo in an afternoon.

**Themes:** Discovery · Prioritisation · Metrics · Ambiguity · Trade-offs · Technical · Working with AI · Speed

## In 30 seconds

Inkling is a reflective journal for 16–25-year-olds. Its AI already named the psychology behind what
you wrote, but it all happened inside a chat bubble, so it looked like ChatGPT. In about three and a
half hours I redesigned it around one evening's journey: question, write, meet an idea, leave with a
takeaway. I built it to run on real data and as a public scripted demo, and tested it with two
simulated users. Both named the difference from ChatGPT unprompted, and the tests caught a trust
bug I fixed the same hour.

## The story

**Situation.** Inkling is a journaling app for 16–25s that I'd built before. A large desk-research
discovery said the open space is "a journal that teaches": every journaling app applies psychology
but none names it, and the top complaint about ChatGPT as a journal is "it just agrees with me". But
the app looked exactly like ChatGPT. I had a possible interview where I'd demo it in two minutes.

**Task.** In a few hours, give it a real user journey and enough craft to show product thinking. I
set three success signals up front: a first-time viewer can say what makes it different from
ChatGPT; the journey completes on a phone in under two minutes; the idea moment rates 4/5 or more.
Two guardrails: the public demo never touches real data, and crisis handling is unchanged.

**Action.**
- **Audited the discovery first.** It turned out to be desk research only, so I framed everything as
  "research suggests".
- **Found the real gap.** It wasn't a missing feature: the strength was invisible. So the main
  decision was to give "You met an idea" its own screen.
- **Prototyped before building.** I wrote references and no-gos (no chat bubbles; nothing childish,
  school-like or clinical), then picked one of four directions.
- **Designed progress without streaks**, because 16–17s are covered by the UK Children's Code.
- **Built every screen once, with two data sources:** the real API, or a scripted demo that can't
  touch the database or steer an AI.
- **Tested with two simulated personas:** a 19-year-old user and a hiring manager. Then I switched
  the AI to the Claude API, with evals as the gate.

**Result.**
- **Both personas** named the difference from ChatGPT unprompted. The hiring manager got it at about
  1:10 and said they'd interview; the user rated the idea moment 4/5, "a gift, not homework".
- **Guardrails held:** the demo made zero network calls, and the crisis evals passed.
- **The tests caught a trust bug:** saved entries were cut short ("If it does that with my real
  words, I'm out"). Fixed within the hour.
- **The evals caught two prompt rules** the new model broke. Fixed: 6/8 → 8/8.

**What I learned.** The best redesign move was making an existing strength visible. And a model
change is a behaviour change: evals are what make it safe.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| The discovery was solid user evidence | It was desk research; no interviews, brainstorm never held | Reading it before using it |
| The design's "next step" and idea sources could be shown | Real data had neither | Wiring screens to the real API |
| The demo was obviously a demo | Both testers wondered what was real | Simulated user tests |
| Entries kept what you wrote | They kept a clipped first message | Maya's test |
| A newer model would follow the same prompt | It ended on two questions and closed with a question | The evals |

## Likely follow-ups

- **"Why not just use ChatGPT?"** It agrees and forgets. Inkling asks one question that helps you
  step back, names one idea, and keeps it with your words.
- **"Is it safe for under-18s?"** It's positioned as reflection, not therapy. Verified crisis
  services are shown by the app, never named by the AI. No streaks or nudges. The demo can't reach
  real data.
- **"How do you know it works?"** The signals were set before building and met in simulated tests.
  Real users are next; the riskiest assumption (they want to *learn*) is untested.
- **"What did you cut?"** The thread card, sources on ideas, voice, and review. Each is in the
  backlog with a reason.
- **"How did you use AI?"** Claude built and coached; I made the product calls. AI personas and
  evals tested it, and I overruled scope creep only partly.

## Theme prompts

- **Discovery:** *Where did the real problem turn out different from the request?* The request was
  "nicer UI and wow"; the problem was that the core strength was invisible.
- **Prioritisation:** *What did I decide not to build, and why?* The thread card, sources and voice,
  to keep one journey that works on real data.
- **Metrics:** *How did I know it worked?* Three pre-set signals and two guardrails, all measured (0
  network calls, 4/5, 1:10 to "aha").
- **Failure:** *What did I get wrong?* Scope grew without a fresh appetite, and tests ran out of
  order. The process changes cover both.
- **Ambiguity:** *Which decision did I make with incomplete information?* Framing the problem from
  desk research only, stated honestly, with real interviews as the next step.
- **Trade-offs:** *What did I give up?* A live AI in the public demo (traded for safety and
  repeatability); light colours over the darker brand look (traded for warmth).
- **Craft:** *Which detail made it feel great?* The idea arriving as its own tangerine card, and
  "That's enough for now", so writing never feels like a quiz.
- **Technical:** *How would I explain it simply?* One data shape, two sources: the screens don't
  know whether they're showing your journal or Maya's.
- **Working with AI:** *Where did I correct it?* The evals showed the new model breaking the
  one-question rule; two sentences fixed it.
- **Speed:** *How did I ship fast without lowering the bar?* A fixed appetite, a brief before code,
  prototypes before building, and blockers fixed the same hour.

**Evidence:** brief and success check, both user-test reports, the eval QA note, and the demo
script (`docs/product/polish-sprint/` in kids-app).
