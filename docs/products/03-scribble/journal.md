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

### Prototype round 1 → round 2
- **Round 1** (Notebook, Letters, Typewriter): owner felt the three were too similar. Fair: same
  palette, same layout, same controls; they differed mostly in typeface.
- **Owner's sharper picture:** an old typewriter in a little workroom, smoking a cigarette,
  typing. Typewriter is the overarching feeling.
- **Round 2, three different ideas of "typewriter":** *Platen* (the machine: paper feeds up,
  uneven struck letters, key clicks and a bell, the reader replies in red ribbon), *Cards* (the
  desk: index cards, a row of the week's cards, a date stamp, a memo slip clipped on), *Smoke*
  (forward only: finished sentences drift up and fade, no going back, embers for the week).

### Platen chosen, made more of a machine
- **Owner's pick: Platen.** It mimics the experience of typing on a typewriter, sound included.
  But "the paper is just stuck to a blackboard": not enough typewriter. Asked for more, without
  going overboard.
- **Named what was missing:** the paper was a typewriter, the machine wasn't. Added the carriage
  (knobs, return lever, roller), a paper bail, a type guide with red and black ribbon that follows
  the letters, a slight carriage drift with the bell at each line end, an enamel body with a
  brass nameplate, and a shadow where the paper goes into the roller. No full keyboard.
- **Owner: "we took it too far."** The type guide (the U-shaped bracket with the red ribbon line)
  following every letter was distracting, and the whole thing was getting busy. Removed the type
  guide and the carriage drift; the machine stays still (knobs, roller, bail, body, nameplate)
  and only the letters move. The line-end bell stays (sound, not motion). Rule taken forward:
  the typewriter feel comes from the static frame and the sound, never from things moving while
  you write.

### Round 3: three typewriter machines
- **Owner: "you're not listening".** Removing the type guide helped, but it still didn't feel
  like a typewriter, and they asked for three new directions so we don't get locked into one.
  Keep: the sheet rising as you type, and the key clicks. Remove: the line-end bell (distracting).
  And: everything below the paper didn't read as a typewriter: "why is it black? Shouldn't it be
  silver, metallic?"
- **My miss, named:** I treated "simpler" as "remove a part" when the ask was a different machine.
  What makes a typewriter recognisable is keys and metal; the black bar had neither.
- **Round 3:** *Chrome* (1930s silver portable, brushed metal, chrome-rimmed keys, ribbon cover),
  *Enamel* (1960s green portable with cream keys you actually type on; the phone keyboard stays
  away), *Ink* (the machine as a sepia line drawing on cream, with the fan of typebars; light).
  All share the rising sheet and clicks; no bell anywhere.

### Round 4: the feeling of a typewriter, without the typewriter
- **Owner:** drawing an actual typewriter "looks childish". Keep the paper and the struck
  letters, keep the essence of typing on a typewriter, but no machine in the design; a nice
  visual design with an old-school typewriter vibe.
- **What went wrong, named:** this is literal vs evoked skeuomorphism, the distinction from the
  design-vocabulary step. Three rounds drew the object; the owner wanted its qualities.
- **Typewriter qualities kept:** the line holds still and the page rises; struck, uneven ink in a
  typewriter face; black and red ribbon as the palette; manuscript conventions (typed header,
  double spacing, page count, the `###` end mark); soft key clicks (no bell).
- **Round 4:** *Manuscript* (the screen is the page, lamplight at the edges, centred underlined
  title, double-spaced), *Night* (warm ink on near-black, almost nothing but your line), *Ribbon*
  (graphic: black band with the prompt, cream page, red strip for actions).

### Design decided: Manuscript by day, Night by night
- **Owner couldn't choose between Manuscript and Night** and asked how to decide. Coached:
  pros and cons against the brief (moment of use: bed at night vs bus and coffee in daylight;
  perfectionism: a manuscript can raise the stakes, a dark scratchpad lowers them), taste is
  legitimate, and a reversible choice is a two-way door (Bezos): decide fast. Also: test in
  the real moment, and the coin-flip trick.
- **Decided (owner):** both, following the phone's light or dark setting. Manuscript in light
  mode, Night in dark mode, Night when there's no preference. Same layout, two palettes.
  Real use over the next days can tell whether one is worth dropping.
- Ribbon is parked in the backlog.

### Build steps 1 and 2: the real screen and saving everything
- **Promoted the design** (prototype skill, phase 6): Manuscript in light mode, Night in dark mode,
  from one layout and two palettes; prototype surface deleted. Typed header (`SCRIBBLE · NO. n`,
  the week as ■ □ □ □, `pieces`), the line holds still while the page rises, struck type, soft
  key clicks, `###` under a finished piece, the reader's reply typed in red.
- **Saving, two layers** ([decision 0009](https://github.com/OAJohansson/build-sprint/blob/main/docs/decisions/0009-scribble-supabase-and-ai-feedback.md)):
  every keystroke goes to this device at once; the database gets it 1.5 s after typing stops. Each
  piece's id is made on the device, so autosave just upserts the same row. One table,
  `scribble_pieces`, in the existing Supabase project; access code as login; in-memory store in
  local dev. A quiet "saved" next to the word count answers "did it save?".
- **Checked in the browser:** draft restored from the database with this device's copy wiped
  (another device); a reload a moment after typing kept the newest words (device copy wins when
  newer); set down → done with a date, feedback saved with it, week marks fill, device copy cleared.
- Also: 40 hand-written prompts (no repeats of recent ones), "your pieces" list to reread, export
  all as Markdown, key sound toggle. Feedback is still the sample until build step 3.
- Fixed while testing: the word count and save status were squeezed to "— …" on a phone; they now
  get their own line.
- **Owner asked whether sharing CrossFit Log's Supabase project is a problem.** Fine at one user; trade-offs (blast radius, shared fate vs free-plan fit, stays awake, reversible) added to decision 0009 and the knowledge bank.

### Deploy, and making setup faster
- PR #23 merged; owner created the Vercel project and deployed. Owner: too much time goes into
  setup every day. Proposed a `vercel login` once plus a `pnpm ship NN-slug` script the owner runs
  (keys go from their Mac to Vercel, never through Claude) and a `vercel.json` that replaces the
  "skip deployments" toggle. **Decided:** sprint to-do #8, right after Scribble's wrap-up.
- **Owner's idea:** rebuild Scribble as a native Mac app in Swift, to learn Swift and because
  they'll use it often; showcase it to recruiters through an open-source GitHub repo. Sprint
  to-do #9, with the open questions (repo, sync, notarization) noted.
- **Owner's idea:** a list of problems to solve in the notebook. Turned the old feature-first
  "Product ideas" list into **Problems to solve** (who, when, what it costs), with its own
  notebook page; one list, problem-first, matching playbook step 1.
- **Owner:** the Vercel project was named after the repo again (as with Horizon); explained the rename and adding a new .vercel.app domain; `pnpm ship` will name it from product 04. **Owner's idea:** one place to see all ongoing tasks across the sprint and job hunt, an executive-assistant view: sprint to-do #10 and a row in Problems to solve.
- **Live:** https://scribble-notebook.vercel.app (Vercel project renamed to `scribble`, new domain added). Checked: the page loads, and the API refuses without the right access code.
- **Phone check passed:** "saved" appeared on the live site. Owner: "it feels nice", plus four
  points (feedback #6–9): editable weekly goal, unclear marks, unclear "another spark", and a
  stronger learning loop (scaffolding before writing, a short theory note in the feedback, one
  lesson per piece). Asked for a critique before any changes.

### Owner feedback 6–9, and build step 3 (the reader)
- **Critique before changes (owner asked):** the marks and the goal are one problem, solved by
  progressive disclosure (tap the marks → "this week: 2 of 4 · goal − 4 +"). "Another spark"
  failed clarity over cleverness and sat far from what it changes (proximity). On the learning
  loop: one lesson per piece is deliberate practice (Ericsson); but a pop-up before writing would
  add a step and raise the bar, against the riskiest assumption (perfectionism). Instead, feed
  forward (Hattie and Timperley): the last lesson becomes one quiet "last time" line.
- **Decided (owner):** goal card on the marks; "↻ not this one" under the prompt (owner asked for
  five more options, chose this plus the icon); a craft note in the feedback and the "last time"
  line; no pop-up. Curriculum and craft notebook went to the backlog.
- **Built:** `/api/feedback` with Claude Sonnet 5.5 (structured output: strength, try next, the
  craft, a short lesson; medium effort; server-side refusal fallback; stable system prompt,
  cached). The last lesson and recent lessons go with each request, so the reader can notice
  progress and avoid repeats. The craft note types out after the reply, under a rule.
- **Checked locally with the sample reader** (no key on this Mac): swap, set down, reply, craft
  note, "last time" on the next page, goal card saved. The real Claude call gets its first test
  live once `ANTHROPIC_API_KEY` is in Vercel.
- **Live check of the reader and polish:** everything works on the phone. Owner: "not this one" under the prompt looks messy; moved back to the footer (the proximity argument lost to a calmer page). Feedback #10.
- **First real reader reply, owner's verdict (feedback guardrail):** it quoted and built on their
  own words; one clear suggestion, no rewrite; the craft note taught something specific ("detail
  is everything: keep the detail in rather than summarising"). 3 of 3 on the checklist for the
  first piece. The model eval can stay in the backlog for now.
