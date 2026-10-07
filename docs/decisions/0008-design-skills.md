# 0008 — A small set of design skills, each tied to a playbook step

- **Date:** 2026-10-07
- **Status:** accepted; kept after product 02's retro (see Consequences)

## Context

Before product 02, I wanted to know whether Claude skills could make the apps better designed and
easier to use. No general app-design skill was installed: the built-in `artifact-design` only
covers Artifact pages, so design so far came from Claude's general knowledge plus the
clean-and-minimal principle (0007). I asked for an assessment of two popular skill sets and a wider
search.

## Decision

Vendor six skills into `.claude/skills/` (sources, versions and licences in its README) and name
each one at its playbook step, so Claude uses them by default:

| Step | Skill | Job |
| --- | --- | --- |
| 1. Three approaches | `prototype` (Emil Kowalski) | 3 working variants of the main screen behind a picker; pick one, the rest is deleted |
| 1b. Setup | `mobile-native` (Emil) | Phone fixes; the baseline is now in `templates/next-starter` |
| 2. Build | `emil-design-eng`, `animate` (Emil) | Polish: press feedback, timing, when *not* to animate |
| 3b. Test | `break-ui` (Emil) | Worst-case data behind a toggle: long names, zero, one, huge numbers |
| 3b. Test | `web-design-guidelines` (Vercel) | Accessibility and interface audit, `file:line` findings |

`dataviz` (built in) stays the skill for charts. The Vercel skill is changed to read a pinned copy
of its rules instead of fetching them from a URL on every run.

## Alternatives considered

- **UI UX Pro Max** (nextlevelbuilder, ~134k stars). A large keyword-searched database of styles,
  palettes and UX rules. Rejected: its own data for "Fitness/Gym App" recommends vibrant orange,
  dark OLED, neumorphism and gamification, the opposite of 0007; it leans to marketing pages
  (landing patterns, conversion); and it only works by running Python scripts, which need approval
  each time in this environment.
- **Anthropic's frontend-design** (official plugin). Good process, but tuned for bold, distinctive
  looks, which pulls against clean and minimal for small daily-use tools.
- **Impeccable** (pbakaus, 24 commands) and **Taste-skill** (Leonxlnx). Capable, but they overlap
  with the set above. Revisit if the set leaves gaps.
- **Emil's other skills** (`write-swift`, `animate-expo`, `ask-sonner`, `apple-design`,
  `improve-animations`, …): off-stack or niche for a one-day product.

## Consequences

Skills improve execution (phone feel, robustness, consistency), not whether the product solves the
right problem; framing and user tests still carry most of the UX. Fewer skills means fewer
conflicting rules: when they disagree (for example, pull-to-refresh), the playbook and 0007 win.
Judge it at product 02's retro: fewer "looks broken / feels off on the phone" findings than day 1,
and a faster design choice? If not, drop them.

**Verdict after 02 Horizon (7 Oct):** keep. `/prototype` made choosing a direction quick (three
working variants on the live site), the `web-design-guidelines` audit caught unreadable text
(1.9:1) and five accessibility gaps, and there were no "feels like a website" findings on the
phone (the `mobile-native` baseline). `break-ui` wasn't run; the playbook now runs it before the
user test.
