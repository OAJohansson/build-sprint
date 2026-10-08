# Journey

What happened, what was decided and why. Newest last.

## 8 Oct · Day 3

### The idea
- **Owner's idea:** an app for small creative writing sessions. A lifelong pull towards
  storytelling, humour and self-expression, held back by the belief that writing talent is innate.
  Journalling for a few months was loved; reviews felt too big to start. WhatsApp chats with two
  friends who work in communication are the one format that sticks: a few sentences, low friction.
- **Goal:** practise a little, often, with low friction to start, then grow towards longer work
  as the muscle and the habit build.

### Discovery
- **Why WhatsApp works** (Moesta's pull forces): the topic comes to you, it's small, someone reads
  it, it feels like play. Reviews fail all four; journalling misses the reader.
- **Owner's answers:** moment is a spare moment on the bus, in bed or on a coffee break, on the
  phone (desktop too). Prompts remove friction, but over time I want to find and choose my own
  topics. **Feedback is critical and must be constructive:** the main goal is to become a better
  writer, taken seriously. Journalling stalled when perfectionism took over ("each entry has to be
  insightful"). Success first = volume of output, like reading a lot.
- **Owner caught their own solutionising** ("an AI trained on top writers") and parked it for the
  prototype stage. Brief only says feedback is a cornerstone.
- **Key tension, now the riskiest assumption:** serious feedback could turn writing into a
  performance again and feed the perfectionism. The MVP must test that feedback helps without
  making it harder to start. Guardrails: time to first word, abandoned pieces.
- Coaching notes: growth mindset (Dweck) as a product principle (make progress visible); volume
  closes the gap between taste and skill (Ira Glass).
- **Name:** Scribble (owner's pick): permission to be imperfect.
- Draft [brief](#03-scribble.brief) written up to success measures for the owner to react to.

### Owner's additions and MVP decisions
- **Ideas for later** (to backlog): an accountability system like CrossFit Log's, a visually
  pleasing app like Horizon, and a cute character with glasses who gives the feedback (like
  Duolingo's owl). The MVP stays basic.
- **Must nail: no lost data.** Pieces go in a database (Supabase, shared project, `scribble_`
  tables), with autosave and an export ([decision 0009](https://github.com/OAJohansson/build-sprint/blob/main/docs/decisions/0009-scribble-supabase-and-ai-feedback.md)).
- **Owner asked how to keep AI cost minimal** (free OpenRouter models, the Claude subscription,
  cheaper models). Worked out: one piece's feedback costs ~2 cents on Opus 5.5, ~1 cent on
  Sonnet 5.5, ~0.06 cents on Haiku 5.5, so about $1 a month at most. Free models risk privacy
  for private writing; a subscription can't power an app's API calls. **Decided: let the eval
  pick the model** (start on Sonnet, keep the cheapest that passes): to-do #1, learning evals.
- **Decided (owner):** feedback only on request; one strength and one thing to try; a weekly
  goal as dots rather than a daily streak (forgiving, suits perfectionism).
- Brief completed: MVP and stop line, 10 requirements, no-gos, rabbit holes. Card bet written.

### Eval deferred
- **Owner's call, for speed:** use their Claude API key with Sonnet 5.5 for the MVP, and do the
  model eval afterwards. Until then, the feedback guardrail is checked by reading the feedback on
  the first pieces against the same checklist. Eval moved to the backlog as "next up after MVP".

### Design direction
- **Owner's feeling:** vintage, paper and ink, but warm: sitting in a low-lit room at night with a
  candle, scribbling down some thoughts.
- **Owner asked for help putting design into words** (a gap they named). Taught the nine
  dimensions: mood words, light and colour, typography, texture (skeuomorphism: literal vs
  evoked), space, motion, details, voice, sound/touch. Showed three colour-and-type samples.
  Added to the knowledge bank.
- **Mood words:** intimate, warm, unhurried; not a costume.
- **Decided (owner):** candlelit dark, always (warm brown-black, parchment text, candle-amber
  accent); evoked texture (faint grain, soft vignette); lightly literary voice ("Set down the
  pen", "Ask for a reader", "Another spark"); typeface left to the prototypes to try.
