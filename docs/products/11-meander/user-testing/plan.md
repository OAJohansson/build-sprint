# Test plan: Meander

## How to run the app for testing

- Start: `pnpm -F 11-meander dev` (port 3000), or the live URL once the build is merged.
- Viewport: **1440 × 900 (laptop)**, the main device (L3). One extra pass at 390 × 844 for R8.
- Seed data: first run = clear the site's local storage; returning user = open three schools and one thinker, then set the stored visit dates to 1, 3 and 6 days ago.
- Simulated parts: none in the MVP (the map content is a fixed file; "Study with Claude" only copies a prompt).

## Scenarios

Written as Sam's real moments. Each has a success bar from the brief.

### S1 · Where does existentialism sit? (job 1, orientation signal)
- **Moment:** desk, a free hour, opening Meander for the first time.
- **Task:** "I've been reading about existentialism. Show me where it fits."
- **Success:** within 5 minutes, without help, can say what came before existentialism, what it pushed against, and one school it led to. All three answers correct.

### S2 · Something connected but different (job 2, the hop signal)
- **Moment:** just finished a Claude module on existentialism, a bit tired of it.
- **Task:** "I want something related but fresh for my next half hour."
- **Success:** picks a connected school from the map or its "go next" suggestions and opens it, in ≤ 3 clicks from the existentialism view, and can say why it's connected. (Bar: 3 of 3 runs.)

### S3 · Go deeper on one thinker (job 3)
- **Moment:** in a school's view, one name catches their eye.
- **Task:** "Tell me about Simone de Beauvoir, then let me study her with Claude."
- **Success:** opens the thinker, reads the summary, uses "Study with Claude", and the copied prompt names the thinker. ≤ 2 clicks from the school view.

### S4 · Time passes: where have I been? (day-7 signal, R5)
- **Moment:** returning user state, six days later.
- **Task:** "What have I looked at this week, and where should I go next?"
- **Success:** the visited schools are marked with the right dates without a reload problem; visits either side of midnight count as separate days; nothing silently reset.

### S5 · Lost and back (R6)
- **Moment:** deep in a thinker's view.
- **Task:** "Take me back to the whole picture."
- **Success:** back to the whole map in one action (Esc or the visible control), from both a school and a thinker.

## Value questions

- Would Sam open this before a Claude session, or skip it after the first look?
- Does the map make them *want* to hop, or just tell them they could?
- What's missing that would make them come back tomorrow?
- Can they see where they've been at a glance, and does it feel like wandering or like a scorecard?

## Trust checks

- Accuracy: spot-check 20 claims (thinkers, dates, links) against the Stanford Encyclopedia of Philosophy; 0 invented thinkers or links (guardrail, R7).
- After S4, compare the stored visits with what was actually opened.

## Out of scope

Other fields, live map generation, non-Western traditions, phone polish beyond R8's "nothing broken".
