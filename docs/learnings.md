# Learnings

The key lessons from every product in one place, so I can refresh what I've learned without
opening each product. Each product keeps the full detail and its retro in
`docs/products/NN-slug/learnings.md`.

## Design principles

Rules I now apply to every product (detail in the playbook).

- **Evoke, don't depict.** A theme's feel comes from type, colour, texture and rhythm, not from
  drawing the object. Illustrated typewriters looked childish; typewriter type and ink didn't.
  *(03 Scribble)*

- **Progress without punishment.** Show progress as thinking or skill changing over time, never as
  streaks or counts you can lose. It's kinder, it's what keeps people (the apps young people keep
  never punish), and for 16–17s it's the law (UK Children's Code: no nudge techniques). *(05 Inkling)*

- **Measure readability, don't eyeball it.** Pick text colour against the exact background
  behind it and check the contrast number for every state. *(02 Horizon)*
- **Clean and minimal.** Every element earns its place; don't repeat in words what the visual
  already shows; make features discoverable with a quiet cue, not a sentence. *(01 CrossFit Log,
  decision 0007)*

## Key learnings by product

### 01 CrossFit Log

- **Frame the moment of use first.** v1 logged workouts well but missed the real job: knowing my
  PB when the coach says "70%". A one-hour needs brainstorm fixed what a day of building didn't.
- **Show three different designs, then mix.** Choosing was fast, and A's board plus B's review beat
  either option alone.
- **Give something back.** An app that only stores data feels like homework. Percentages, a PB
  celebration and visible progress make logging worth it.
- **Less on screen is clearer.** Three ticked dots said more than the dots plus a sentence; one
  element per idea.
- **Test on a real phone and check every setting on day one.** Android dictation and a wrong
  Supabase key type each cost hours because they surfaced late.
- **Users see a friendly error; the logs get the real reason.**
- **A simulated user finds what my own review misses**, especially wrong numbers.

### 02 Horizon

- **Name the alternative early.** Google already answers "what time is sunset?"; the edge became
  "do I have time?" plus feel, which shaped the whole home screen.
- **A brief (one-page PRD) before code makes prototypes sharper.** Requirements as behaviours,
  plus no-gos and rabbit holes; the prototype prompt just pointed at it.
- **Measure what a feature is for, not that it exists.** The landmark's signal was "which city is
  this?", which exposed Tokyo looking like Paris.
- **The emotional peak shows up in testing.** The sunset moment ("happening now", the afterglow)
  wasn't in the brief but is what people would show a friend.
- **Never let a saved choice stand in for "here".** Reopening on yesterday's searched city gave
  wrong data for the main job.
- **Guardrails need numbers.** Text measured 1.9:1 in the afternoon while looking fine at a glance.
- **Prototype on the live site.** Judging three directions on a real phone made the choice quick.

### 03 Scribble

- **The riskiest assumption can be emotional.** Perfectionism, not technology, was the risk, so
  feedback became opt-in, one lesson per piece, and the weekly goal forgiving.
- **Understand why the current workaround works.** WhatsApp worked because a topic comes to you,
  it's small, and someone replies; the product copied those forces, not WhatsApp.
- **Critique before change.** Checking the owner's pop-up idea against the riskiest assumption
  turned it into a quiet "last time" line that does the same job without friction.
- **Evoke, don't depict.** Four prototype rounds; the fix was the feeling without the machine.
- **Prototypes smuggle in decisions.** Forward-only writing came from a prototype and reached the
  build without ever being chosen; list carried behaviours as owner decisions.
- **Measure the thing, not the tool.** A background tab made typing look 100× slower than it was;
  contrast measured 2.9:1 where the eye said fine.
- **Never lose a piece, in layers.** Device instantly, database after a pause, and on page hide.

### 04 Mallow

- **Find the moment the product is for.** Not "a tracker" (they exist) but the 15-minute follow-up:
  a one-screen summary since the last appointment is the product; logging feeds it.
- **Link the outcome to the action.** A daily trend shows *that* things changed; one-tap relief per
  dose shows whether the medicine did it.
- **Borrow patterns from your own past work.** Vinehealth's "last time you mentioned…" became the
  relief question that works without notifications.
- **In health, words are claims.** Describe a feeling, show the user's own data, never promise a result.
- **Let time pass in tests.** Resume without reload and a moved appointment hid two of four majors.
- **Demo data hides missing features.** A required note field existed only in the demo; test on a
  fresh install.
- **Explaining a delight can kill it.** The plant works unexplained; the purpose is said plainly instead.

### 05 Inkling

- **Make the existing strength visible.** The AI already named the idea in every reply; a chat
  bubble hid it. Its own screen was the wow, and the cheapest thing to build.
- **Audit inherited discovery before quoting it.** A big research pack had no user conversations;
  say "research suggests", and put five interviews first in the backlog.
- **Real data disciplines the design.** Wiring screens to real data showed what the design promised
  but the data didn't have; the demo was changed to match.
- **One data shape, two sources.** A public demo that can't touch real data, and real-data features,
  from the same screens.
- **Test with the user and the audience.** A simulated 19-year-old and a simulated hiring manager
  each found what the other missed; together they found a trust bug the audit couldn't.
- **A model change is a behaviour change.** Safety held on the new model, but two prompt rules broke;
  evals caught them before users did.

### 06 Folio

- **Build the exam before the model.** Without a fixed eval every recommender just sounds
  convincing; with it, "most advanced" becomes a row in a table that has to beat the last one.
- **Measure, don't assume.** The owner guessed 70% of their liked books were in goodbooks; it was
  33%, and 17% of recent saves. That one number reshaped the roadmap.
- **Check the data's claims, including your own.** "No dates" turned out to be "no date
  column, but time order", which changed the exam from random hide-and-seek to leave-last-out.

## Process changelog

Every change to how I build, and the product that taught it.

| Date | From | Learning | Change made |
| --- | --- | --- | --- |
| 7 Oct | 01 CrossFit Log | v1 solved the wrong problem: the real job (recalling a PB mid-class) only came out after building. | Playbook step 1: moment of use, top 3 jobs, persona and test plan, three approaches and a stop line before any code. |
| 7 Oct | 01 CrossFit Log | Setup problems (wrong key type, phone-only dictation bugs) surfaced late, one at a time, and cost half a day. | Playbook step 1b setup checklist; `failure()` helper in the starter template: log the real reason, show users a general message. |
| 7 Oct | 01 CrossFit Log | The simulated user found wrong-number bugs that my own review missed. | Persona and plan written at kick-off; the test agent runs before my own review (playbook step 3b). |
| 7 Oct | 01 CrossFit Log | Knowledge lived in chat, not in the notebook. | One folder per product (journal, feedback, user testing, backlog, learnings), shown as notebook sub-pages; retro at wrap-up. |
| 7 Oct | 01 CrossFit Log | Text that restated the visuals ("1 of 3 days · 2 more days…") added noise, not meaning. | Playbook design principle: clean and minimal; don't repeat in words what the visual already shows. |
| 7 Oct | Before 02 | Design came from Claude's general knowledge; no design skill was installed. | Six design skills in `.claude/skills/`, each named at its playbook step (decision 0008); phone baseline in the starter template. Trial on 02, judge at its retro. |
| 7 Oct | Before 02 | I want to learn to work like a product manager, not just ship. | Playbook step 1 becomes discovery: a brief per product (problem, who, jobs, today's alternatives, riskiest assumptions, success measures, MVP) and a success check at wrap-up; sprint goals A/B/C at the top; Claude acts as product coach. |
| 7 Oct | 02 Horizon | We were about to prototype without written requirements. | Brief becomes a one-page PRD with requirements (behaviour + check), no-gos and rabbit holes; each playbook practice credited to its source on a new Product craft page. |
| 7 Oct | 02 Horizon | About an hour lost to the cloud sandbox's network: vercel.app and the APIs were blocked, and the test browser couldn't reach the local app. | Setup checklist (1b): allow `*.vercel.app` and the product's APIs; test a production build at the machine's address. |
| 7 Oct | 02 Horizon | Text measured 1.9:1 but looked fine; the tester judged it by eye. | The `user-tester` agent measures every guardrail in the brief with a number (contrast per state). |
| 7 Oct | 02 Horizon | The audit and the user test ran at once, so the tester re-found a known bug; `break-ui` never ran. | Playbook 3b order: audit and `break-ui` first, fix, then the simulated user test. |
| 7 Oct | After 02 | Part of the sprint's goal is concrete stories for interviews, but they lived scattered across journals and retros. | Wrap-up adds an interview story per product (STAR, themes, assumptions vs reality, follow-ups) and a story bank page that shows which interview themes still need a story. |
| 8 Oct | After 02 | General knowledge (git, product practice, design rules) was scattered across chats and would fade from memory. | A knowledge bank page for general concepts, with quiz questions feeding a notebook Quiz (active recall, Leitner spaced repetition); updated whenever something new is taught. |
| 10 Oct | 03 Scribble | Four prototype rounds: three drew a literal typewriter when the owner wanted its feeling. | Playbook step 1: collect 2–3 references and what not to do before `/prototype`; a feel is evoked, not drawn. |
| 10 Oct | 03 Scribble | Forward-only writing came along from a prototype without the owner choosing it. | Playbook step 1: when a prototype becomes the app, list the behaviours it carries as owner decisions. |
| 10 Oct | 03 Scribble | Vercel setup (project name, domain, env vars, skip toggle) cost time every day. | `pnpm ship NN-slug` (built 12 Oct) and a `vercel.json` per app that skips unchanged builds; playbook step 3 is now one command. |
| 12 Oct | 04 Mallow | The first deploy came after two prototype rounds, so the phone never saw the app while it was shaped. | Playbook step 1: run `pnpm ship NN-slug` on the empty starter right after `pnpm new`. |
| 12 Oct | 04 Mallow | Two of four major findings only appeared when the tester let time pass (resume without reload, a moved appointment). | Test plan template: a "time passes" scenario (resume without reload, cross midnight, cross a key date). |
| 12 Oct | 04 Mallow | A required check-in note existed only in the demo data; nothing caught it until break-ui. | Playbook step 3b: before testing, walk every brief requirement on a fresh install, not the demo. |
| 12 Oct | 05 Inkling | "A few hours" became the whole app plus a provider switch, one reasonable request at a time. | Playbook step 2: re-cut on every scope widening (cut, swap or re-bet out loud) and log it in the journal. |
| 12 Oct | 05 Inkling | Saved entries were cut short, and testers couldn't tell the demo was scripted. | Test plan template: trust checks (compare saved with typed; ask "what did you think was real?"). |
| 12 Oct | 05 Inkling | Switching to the Claude API kept safety but broke two prompt rules, caught only by the evals. | Playbook step 2: run evals before and after any model, provider or prompt change, and record the result. |
| 13 Oct | Before 06 | Reviewed the "ponytail" skill: Claude's judgement calls (what it skipped, shortcuts taken) stayed hidden in the code. | AGENTS.md code habits (decision 0011): a closing "skipped / risk" line, `shortcut:` labels in code, root-cause bug fixes. Skill not installed. |
| 13 Oct | Before 06 | All our testing was user-journey testing; Mallow's time bugs only showed when the tester let time pass. | Unit tests for date, time and streak logic only: Vitest in the starter template, playbook step 2 (decision 0011); a 5-minute unit-test pick in the brief (step 1) and a retro question on whether it caught anything. |
| 16 Oct | During 06 | The model that builds a screen is poor at judging it, and variants drift to the same AI defaults (Anshu Chimala, Lenny's Newsletter). | `/design-session` skill (Discover with seed strings, Define with a `design-critic` subagent that sees only screenshots, Deliver by subtracting, checking AI tells and hand-written copy) replaces `/prototype` as the design step (decision 0013). |
| 16 Oct | 06 Folio | 123 cancelled preview builds in other apps (from ~29 pushes to one branch) used up Vercel's free 100 deployments a day and blocked Folio's first deploy. | Every app, the portfolio and the starter deploy from `main` only (decision 0016); push and merge in batches. |
