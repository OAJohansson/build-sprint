# 0028 — Founder mode v2: owner design pick, one critic, slices, pre-approved ops

- **Date:** 2026-10-25
- **Status:** accepted; amends decision 0026 (Founder mode)

## Context

The first Founder run (07 Six AM: Ears v1, v1.1 and the Mentor, 23–25 Oct) shipped, but slowly
and with weak design. The run report (`docs/products/07-six-am/founder-run-report.md`) traced it
to a few causes: the owner saw the design only at the final review, so one review meant
rebuilding the Mentor (about 7 h); a fresh critic every round gave scores that bounced between 4
and 8 and never converged; designers fixed critiques by adding, until the owner said "too much
going on"; one phase was one big untested piece until the end; one PM session ran 27 h and broke
twice; a routine database migration waited about 3 h for an approval; a taste-dependent eval
(genre in the owner's words, with an empty profile) burned hours and about $4 on a bar it
couldn't reach; and graders filled the owner's real Mentor chat with about 60 test turns. The
owner went through the report's proposals one by one on 25 Oct.

## Decision

Ten changes to Founder mode. The kickoff itself stays as it is (owner's call: revisit only if
the next one feels slow).

1. **Owner design pick, early, using the usual workflow.** The designer runs the design-session
   flow up to the prototypes: about 10 directions, screenshotted. The owner picks 3 (their one
   design moment), and the squad develops those 3 into the starting designs before any build.
   The critic scores the 3, and the owner picks the final one (amended 25 Oct, see below). No
   other owner checkpoint until the final review.
2. **Visual references are optional.** The kickoff pack can pin 2–3 real screenshots ("like
   Claude's chat panel"); the critic scores against them when they exist. The owner can leave it
   blank to let the squad be creative, and the feel sentence then carries the brief.
3. **Remove first.** Every design round lists what was removed before what was added; adding
   needs a stated reason. The critic's first question for every screen is "what on this screen
   did the user not ask for?"
4. **One critic, fixed scorecard.** One `design-critic` instance for the whole slice (resumed,
   not re-spawned), scoring five fixed points 0–2 each: clutter, hierarchy, legibility, feel
   (against the references or the feel sentence), honest copy. Total out of 10, so rounds are
   comparable. The 9/10 bar stays a target, not a blocker.
5. **Slices inside a phase, one review.** The PM cuts each phase into 3–4 slices (one screen or
   one job each), builds and tests each slice (user-tester, data-evals, fixes) before starting
   the next, and keeps them on one branch and one PR. The owner still has only the final review.
6. **A fresh PM session per phase.** After each merge the PM session ends; the next phase starts
   in a new session that reads the card, kickoff pack, decision log, journal and backlog. Anything
   the next phase needs must be in those files.
7. **Pre-approved routine actions.** A fixed list, the same for every phase (in `AGENTS.md`):
   additive database migrations for the product's own tables, setting the product's own Vercel
   env keys, preview deploys, and writes to the product's test sandbox. Anything destructive
   (drop, delete, truncate, rewriting the owner's rows) or outside the product still asks. Every
   pre-approved action is logged in the journal. The project's permission settings allow these
   where the tool can be scoped; where it can't, the PM asks once at kickoff for the whole phase.
8. **Design skills before the critic.** The designer runs `emil-design-eng`, `web-design-
   guidelines` and `break-ui` on every screen before it goes to the critic, not at the end. On
   the next product, trial one new design tool or skill on one slice, and keep it only if it
   lifts the scorecard.
9. **Fair evals.** Agent evals only for what the method can reach without the owner's taste
   (speed, cost, honesty, invented facts, persistence, the user test). Checks that need the
   owner's taste data (e.g. "genre in my words") run after the owner's profile or tags exist, as
   part of the owner's final review, not as an agent bar.
10. **A test sandbox.** For any product with a backend, graders use a separate access code and
    separate data, so tests never write to the owner's real data. Setting it up is ops.

Phone push for "needs you" notifications was the eleventh point; the owner has turned it on.

## Alternatives considered

- **A 2-minute screenshot check after the first prototype round** (the report's option 1A). The
  owner preferred their existing workflow (10 directions, pick 3), which gives the same early
  look and is already familiar.
- **A preview for the owner after every slice.** Earlier feedback, but it turns one review into
  four; the owner didn't want more reviews before the final one.
- **A faster, templated kickoff** (standard defaults, at most 3–5 questions). Parked: the owner
  wants to keep today's kickoff and change it only if the next one is slow.
- **A hard element budget per screen** instead of remove-first. Simpler, but crude.

## Consequences

- One short owner moment early (picking 3 of about 10) in exchange for no rebuild at the end.
- Critic scores mean something across rounds; the risk of a critic getting used to a design is
  limited by the fixed five points.
- More planning for the PM (slices, a new session per phase); more reliance on written records.
- Routine actions no longer stall overnight runs; destructive ones still always ask.
- Revisit after the next Founder product's retro: did the pick-3 moment and the scorecard lift
  the final design score, and did any slice still need a late rebuild?

## Amended 25 Oct: the final pick is the owner's too

On merging 09 Wont, this decision met Wont's rule (decision 0026, changed 24 Oct) that the owner
makes both design picks. The owner chose: keep 0028 otherwise, but the final pick of the 3 is
theirs. On Wont every design call that mattered was a taste call the pack couldn't carry (two
contact sheets rejected, wontons over jars, the mark, the harsh header the critic and PM let
through). The PM still gives a recommendation with the critic's scorecard.

## Amended 27 Oct: the canvas sign-off before the build

On the Six AM Lab (Phase 4), the owner asked to see the final screens on a Claude Design canvas
before any UI was built (L163, L195). It caught taste calls that the picks and the critic had not
(card size, header pills, the Studio's lane rows) while they were still cheap to change. The owner
made it permanent: after the final pick, the final screens go on a canvas, the owner comments in
place, open questions get quick mockup options with updated screens beside the originals, and the
UI build starts only after the owner approves the canvas. It is the owner's third design moment;
there is still no other checkpoint before the final review.
