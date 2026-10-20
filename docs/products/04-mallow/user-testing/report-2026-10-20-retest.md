# User test: Mallow v2 (re-test of S1 and S5), 2026-10-20

**Persona:** Priya, 31, UX researcher, anxiety and poor sleep, balanced oil at bedtime plus a vape when needed · **Method:** simulated (agent), Playwright, 390×844 ×2, touch · **Build:** branch `04-mallow-v2-test-fixes` (9fd55d8, PR 40: fixes for feedback 34–37), local dev server · **Scope:** setup (S1) and the Journey read (S5) only. Compare with [this morning's report](report-2026-10-20.md).

> **Session note:** R1's "12 days late" is worked out, not observed. In the run, the vape's start
> date was entered with "Pick a date", and the 20 Sep date came from "About a month ago" on the
> appointment step.

## Verdict

"Setup now takes my whole plan in one go, and nothing is filled in for me. Journey finally says what I'd tell Dr Okafor: anxiety was 'quite', now 'a little to quite', a little better. I'd keep it. The one thing I'd still check is which date 'about a month ago' actually saved."

## Jobs

| Job | Score 1–5 | Why |
| --- | --- | --- |
| 1. See how sleep and anxiety changed, and what I was on | 4 (was 3) | Caption and Summary agree for all three symptoms. "When" still comes from reading the graph |

## Scenarios

| # | Scenario | Result | Taps / time | Main issue |
| --- | --- | --- | --- | --- |
| S1 | Fresh install: anxiety + sleep, oil, vape, follow-up | pass (was struggle) | 35 taps (native date picker = 3, text field = 1), ~80–95 s, one flow | No quick pick near "6 weeks", and the date a quick pick resolves to is never shown in setup (R1) |
| S5 | Read the change on Journey | pass (was struggle) | 2 taps (Journey, Sleep), +1 for Mood, ~40 s | The caption gives then → now but not when; the vape start is still read off the "5 Sep" tick (#39) |

**S1, what was saved (`04-mallow:data`) against what she meant:** oil 0.3 ml, Bedtime, from 21 Jul ("About 3 months ago"); vape 2 puffs, When needed, from 8 Sep (picked a date); last appointment 20 Sep ("About a month ago"); next 24 Oct, Dr Okafor; baseline anxiety quite, sleep poorly, mood a bit low. All correct. Nothing suggests a dose.

**S5, what Priya says (~40 s):** "Sleep was poor before. It came down through August, the first five or six weeks, and it's been 'a bit broken' since, so better. Anxiety was 'quite' before. Now it's a little to quite, a little better, mostly in the last month. Oil 0.3 ml every night since 22 July. Vape since early September, around 5 Sep." All three correct against the hand count (anxiety by month 2.22 → 2.00 → 1.54; sleep 2.09 → 1.54 → 1.25; vape first used 6 Sep).

**Caption against Summary ("Since before treatment"):** anxiety "a little better" in both; sleep "better" in both; mood "better" in both. The Summary's "Since last visit" values (a little better, a little better, about the same) are labelled, so they don't read as contradictions. The caption is the same in all three ranges.

**Causal nudge:** 0 causal words from the app. Priya still says on her own, "it eased once I had the vape". The near miss "Helped 'quite a bit' or more" (her own ratings) is already known.

**Dr Okafor (10 s):** reads the caption, sees the oil flat at 0.3 ml and vape dots from early September, and asks "How many puffs a week?" (#43).

## Re-checked findings

| ID | Status | Note |
| --- | --- | --- |
| F1 (#34) | fixed | Caption reads as a change and matches the Summary |
| F5 (#35) | fixed | Both comparisons labelled on each card |
| F6 (#37) | fixed | "Anything else on your plan?" adds the vape in setup; start never prefilled |
| S1a (#36) | fixed | "– ml" / "– puffs"; Save says "Add your amount" until set |
| S1b (#37) | fixed | Last appointment asked with quick picks, no prefill |

## Findings

| ID | Severity | Where | What happened | Why it matters to Priya | Suggestion | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| R1 | minor | S1, "About when did you start it?" | Nothing between "About a month ago" and "About 3 months ago"; for a 6-week-old vape the nearest pick would save 20 Sep, ~12 days late (worked out, see note). The resolved date is never shown, and the strip then draws it as exact | Wrong history, and a start drawn where anxiety drops strengthens a causal reading | Show the resolved date under the chosen chip ("≈ 20 Sep"); add "About 6 weeks ago" or "About 2 months ago" | s1-01-oil-filled.png, s1-04-pick-date.png |
| R2 | polish | S5, caption | "Now (since 20 Sep)" doesn't say what 20 Sep is | She wonders whether something happened that day | "Now (since your last appointment, 20 Sep)" | s5-01-journey.png |
| R3 | polish | S5, caption | Then → now, but not when it changed | Doctors ask "since when?" | Fix #39 first; a timing clause stays the owner's call (34 chose no date) | s5b-01-sleep.png |

Known issues hit again: #39, #41, #42, #43.

## Guardrails (measured)

| Guardrail | Result |
| --- | --- |
| Change readable (main) | ~40 s, 3 of 3 correct, 0 causal words |
| Setup fits | ~80–95 s for the whole plan including the vape; every step skippable |
| No dose suggestions | 0; amounts start blank |
| Correct numbers | Summary levels match the hand count (anxiety 2.00 → 1.54, sleep 1.54 → 1.25, mood 1.54 → 1.39) |
| Contrast, worst first | Muted "Compared with" 6.49:1 · purple "Since last visit" 9.00:1 · caption 14.92:1 |

## Method notes

Clock fixed at 20 Oct 19:30 (S1) and 09:00 (S5). Native date pickers counted as 3 taps. Times are estimates for Priya. Screenshots stayed in the session's scratch folder.
