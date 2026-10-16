# 0013 — A design-session skill and a fresh-eyes critic

- **Date:** 2026-10-16
- **Status:** accepted

## Context

Design so far came from `/prototype` (three variants behind a picker) and the owner's eye. Two
gaps: the variants all came from the same model defaults, and nothing judged a screen except the
model that built it, which is poor at critiquing its own work. Anshu Chimala's article "How to
turn your AI into a world-class designer" (Lenny's Newsletter, Sep 2026) sets out a method for
both, which the owner wanted to turn into a skill we use together.

## Decision

- **Skill `design-session`** (`.claude/skills/design-session/`), run only when called as
  `/design-session <screen>`. Three phases with owner checkpoints:
  - **Discover:** seed strings from a script, 8–10 broad ideas, then `/prototype` for three.
  - **Define:** a critic loop on screenshots until 9/10, or until the score stops rising, four
    rounds at most.
  - **Deliver:** subtract, check the AI-tells list, and the owner rewrites the copy.
- **Subagent `design-critic`** (`.claude/agents/`), on Fable 5.1, with Read as its only tool. It
  sees only screenshots, the intended aesthetic and references. The stopping score stays out of
  its prompt.
- **Our own AI-tells list** (`tells.md`), since the article's list was an image. It's for review,
  not a ban list.
- It replaces `/prototype` as the playbook's design step; `/prototype` becomes its Discover tool.
- Clean and minimal (0007) still wins over any step, the critic included.
- Named `design-session` because another installed skill is already called `design`.

## Alternatives considered

- **The critic loop only:** smaller, but loses the seed and subtraction steps, which target the
  sameness we saw on 03 Scribble.
- **Fold it into `/prototype`:** that's a vendored copy of Emil Kowalski's skill; editing it
  makes updates harder.
- **Image and video generation (techniques 4–5):** left out. It needs a paid key with a spend
  limit and rarely fits clean-and-minimal products; raise it per product if a screen needs it.

## Consequences

- A design session takes longer (two to four critic rounds) but ends with a score and named gaps,
  instead of "looks fine to me".
- The critic is a model too: its taste can drift with model versions. Keep the prompt fixed, and
  let the owner overrule it.
- Smoke test (16 Oct, 06 Folio's Diary prototype): 6/10, six specific gaps (truncated titles,
  clamped opinions, stars too loud). Judge the skill at 06 Folio's retro.
