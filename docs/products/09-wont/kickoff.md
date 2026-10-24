# Kickoff pack: Wont

The owner's kickoff for a product (decision 0026). In Founder mode the owner writes it alone and
the PM session builds from it. Drafted by Claude from the owner's calls in the kickoff
conversation (24 Oct), in the owner's words where possible; the owner can edit any line.

**Mode:** founder
**Appetite:** one day (owner). The intro animation gets at most ~1.5 hours; if it runs over it
becomes three still panels and the animation moves to the backlog. Other cuts, in order, if the day
runs out: the urge "ride it out" pause (keep the one-tap urge log), the friction-step field.
**Evals:** `evals.md` (agent-checkable part) · owner-only checks kept outside the repo
**Evidence:** `research.md` (principles P1–P18, anti-patterns A1–A14)

## Problem

When a new habit is fragile, one late morning or one nicotine pouch feels like failure, and that
bad feeling turns one slip into a lost week. Without a morning commitment I sleep in; afterwards I
feel bad about it. Habit apps I could use count streaks that reset to zero and nag with alarms,
which is the design the research says backfires.

## Who

Me. Day 5 of waking at 7am, day 2 without nicotine pouches (quit 23 Oct). I know what I should do;
what I lack is something that keeps me honest with myself and keeps one bad day from ending the
attempt. "Worth it" = still on both habits in four weeks.

## Moment of use and jobs to be done

Morning on waking (did I get up on time?) and evening before bed (did I read, write, stay off
pouches?); plus any moment a craving hits. On my phone.

1. When I slip (a late morning, a pouch), I want to log it honestly and be met with
   encouragement and one next step, so I can keep one slip from becoming a lost week.
2. When I start a habit, I want to write it as a clear commitment to myself (after I ___, I
   will ___, with a daily goal I can't fudge), so I know each day whether I kept it.
3. When I've kept my commitment, I want to log it in one tap and feel a small, satisfying
   moment, so I can see my progress build.

## Today's alternatives

Nothing for sleep but willpower and morning commitments (which work, but not every day has one).
Quit apps like I Am Sober and streak apps like Streaks: one tap and clear, but the counter resets
to zero on a slip, which turns one mistake into failure. Atoms uses if-then plans but is
subscription-led. Why switch: an app built around the comeback, not the streak.

## Riskiest assumptions

- **Value (riskiest):** that tracking against my own written commitment, with gentle comeback
  messages instead of reset streaks, keeps me going after the first miss. The MVP tests it the
  first time I log a late morning or a pouch.
- Usability: logging is fast enough that I do it every day (one tap, under 5 s).
- Feasibility: day logic is right (a bedtime after midnight belongs to the evening before; a
  clean day only counts once the day is over).
- Viability: none, it's for me.

## Success: what good looks like

Outcome: in four weeks I still wake at 7am most days and haven't gone back to pouches.

- Signal: I log every day for 14 days (count of days logged).
- Signal: after a slip, the next day is logged as kept (comebacks / slips).
- Signal: wake-up kept on at least 5 of 7 days per week, from the log.
- Guardrail: I never feel the app punished me for a slip (my own check after the first slip).

## MVP and stop line

**In:**
- A short intro animation (15–20 s, skippable, once on first launch, replayable) with three
  messages: about two months, not 21 days; tie it to something you already do; missing a day
  doesn't reset you, coming back counts.
- Create a **build** habit: an if-then commitment (after I ___, I will ___), a daily goal that is
  clearly met or not (e.g. "up by 7:00", "10 pages"), and an optional "why this matters to me".
- Create a **stop** habit (nicotine pouches): trigger, one friction step, one replacement action.
- Today screen: each habit logged in one tap (kept / missed; for stop habits: clean / slip with
  size / urge, with a short "ride it out" pause).
- Progress that survives a miss: a rolling rate ("6 of the last 7") and clean days counted, never
  a counter that resets to zero; history always kept.
- The comeback: after a missed day, the next open shows a gentle message with one next step; the
  next kept day is marked as a comeback.
- One small celebration when a habit is logged as kept.
- Data in localStorage on one device.

**Out (to `backlog.md`):** notifications and email, morning motivation, evening log reminder,
self-doubt, weekly review, automaticity check (SRBAI) and graduating a habit, accountability
partner, sync across devices, accounts.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| R1 | First launch plays the intro animation; it can be skipped and replayed | Fresh install shows it; skip works; replay from settings |
| R2 | A build habit is created as an if-then commitment with a daily goal | Created with anchor, action and goal; shown on Today |
| R3 | A stop habit is created with trigger, friction step and replacement | Created and shown on Today |
| R4 | Each habit is logged for today in one tap | One tap from Today, saved after reload |
| R5 | A stop habit logs clean day, slip (with size) and urge separately | Each event saved and shown in history |
| R6 | A miss never resets progress to zero; the main number is a rolling rate or clean-day count | After a miss the number dents, history intact |
| R7 | The open after a missed day shows a gentle comeback message with one next step | Simulated miss, then reopen: message shows, no failure words |
| R8 | The first kept day after a miss is marked as a comeback | Visible mark in history |

**No-gos:** accounts, a backend, notifications, points or badges, a streak that resets to zero.

**Rabbit holes:** a custom animation engine (use CSS or one small library); flexible schedules
beyond daily; editing past days beyond the last few.

## Feel references

Owner's words: "I don't want it to feel like a checkbox list, I want it to feel like a drawing
board, with big cards." Screenshots in `design/references/` (inspiration, not templates; the squad
should go further than them).

- **A drawing board / pinboard** (owner) — habits are big cards laid out on a surface you work
  on, not rows in a list.
- **Bold full-width colour cards** (`ref-1`–`ref-3`, a dark habit planner) — each habit as a big,
  saturated, colour-coded card with large type; the card itself is the button.
- **Soft cards with progress as fill** (`ref-4`–`ref-6`, a pastel tracker) — progress shown by
  the card filling with colour, not by a number or a tick.
- Not taken from these references: the streak counters, "keep long streaks" banners, coins,
  crowns and trophies (research anti-patterns A1, A5).

**The feel in one sentence:** A drawing board of big, bold cards, each one a promise to myself,
calm and warm, never a checklist and never a scold.

## Things to avoid

- Guilt copy ("You broke your streak!"), red crosses, failure language
- Streaks that reset to zero
- Points, XP, badges
- Lots of motion: one small moment on keeping a habit, nothing per tap (my design rule)
- "21 days to a habit" or "1% better = 37x"
- A checkbox list: rows with tick boxes (owner)
- Trophies, coins, crowns, streak banners (seen in the references; not wanted)

## Decisions already made

- Data in localStorage, one device, no backend (no notifications means none is needed).
- Next.js from the starter, deployed on Vercel like the other products.
- Evidence comes from `research.md`; the squad cites principle numbers (P1–P18) for design calls.

## Unit tests

- Which day a log belongs to: a log at 00:30 for bedtime counts for the evening before; month end.
- Rolling rate and clean-day count: normal week, a slip in the middle, empty history.
- Comeback detection: a kept day right after a missed day; two misses in a row; first day ever.
