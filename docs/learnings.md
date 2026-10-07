# Learnings

The key lessons from every product in one place, so I can refresh what I've learned without
opening each product. Each product keeps the full detail and its retro in
`docs/products/NN-slug/learnings.md`.

## Design principles

Rules I now apply to every product (detail in the playbook).

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
