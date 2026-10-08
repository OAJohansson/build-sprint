# Learnings

The key lessons from every product in one place, so I can refresh what I've learned without
opening each product. Each product keeps the full detail and its retro in
`docs/products/NN-slug/learnings.md`.

## Design principles

Rules I now apply to every product (detail in the playbook).

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
