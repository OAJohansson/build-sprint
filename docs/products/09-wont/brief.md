# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.
Founder mode: drawn from [`kickoff.md`](kickoff.md) (the source of truth) by the discovery agent, in
the owner's words where possible. Lines marked *(assumed: …)* are the smallest, most reversible
answer where the pack is silent; each is logged as an L-decision. Evidence: [`research.md`](research.md)
(P = principle, A = anti-pattern).

## Problem

When a new habit is fragile, one late morning or one nicotine pouch feels like failure, and that bad
feeling turns one slip into a lost week. Without a morning commitment the owner sleeps in and feels
bad about it afterwards. The habit apps they could use count streaks that reset to zero and nag with
alarms, the design the research says backfires (A1, A2, A3). The cost today: a lost week after one
slip, and with it the attempt.

## Who

The owner. Day 5 of waking at 7am, day 2 without nicotine pouches (quit 23 Oct). They know what to
do; what they lack is something that keeps them honest with themselves and keeps one bad day from
ending the attempt. "Worth it" = still on both habits in four weeks. Full persona:
[`user-testing/persona.md`](user-testing/persona.md).

## Moment of use and jobs to be done

On the phone, at three moments: **morning on waking** (did I get up on time?), **evening before bed**
(did I read, write, stay off pouches?), and **any moment a craving hits**.

1. When I slip (a late morning, a pouch), I want to log it honestly and be met with encouragement
   and one next step, so I can keep one slip from becoming a lost week. *(P5, P7)*
2. When I start a habit, I want to write it as a clear commitment to myself (after I ___, I will
   ___, with a daily goal I can't fudge), so I know each day whether I kept it. *(P1, P13)*
3. When I've kept my commitment, I want to log it in one tap and feel a small, satisfying moment,
   so I can see my progress build. *(P2, P6)*

## Today's alternatives

- **Willpower and morning commitments:** work, but not every day has one.
- **Quit apps (I Am Sober) and streak apps (Streaks):** one tap and clear, but the counter resets to
  zero on a slip, turning one mistake into failure (A1).
- **Atoms:** uses if-then plans, but subscription-led.
- **Why switch:** an app built around the comeback, not the streak (P5, P6).

## Riskiest assumptions

- **Value (riskiest):** tracking against my own written commitment, with gentle comeback messages
  instead of reset streaks, keeps me going after the first miss. The MVP tests it the first time I
  log a late morning or a pouch. *(P5, P7; test plan S3)*
- **Usability:** logging is fast enough to do every day (one tap, under 5 s). *(S1)*
- **Feasibility:** the day logic is right: a bedtime after midnight belongs to the evening before; a
  clean day only counts once the day is over. *(S4 and the unit tests)*
- **Viability:** none; it's for the owner.

## Success: what good looks like

Outcome: in four weeks the owner still wakes at 7am most days and hasn't gone back to pouches.
Daily active use is *not* the goal (A13).

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Logs every day | Count of days with at least one log, from the app's history | 14 of 14 days |
| Comes back after a slip | Comebacks ÷ slips (a slip or miss followed by a kept/clean next day), from history | Every slip gets a comeback day *(assumed: the pack gives no number; "every" is the owner's stated hope and easy to lower)* |
| Wakes on time | Wake-up habit kept, from the log | ≥ 5 of 7 days per week |
| **Guardrail:** never feels punished | The owner's own check after the first slip; agents check S3 and R7 for words from "Things to avoid" | Never; zero guilt words on any screen |

User-test bars (from [`evals.md`](evals.md)): S1 ≤ 5 s / ≤ 1 tap; S2 ≤ 60 s / ≤ 8 taps; S3 ≤ 20 s /
≤ 3 taps; S4 numbers right, history intact; every top job ≥ 4/5; design critic ≥ 9/10 on the main
screen; contrast ≥ 4.5:1; saved = typed 100%; works at 390 × 844 with targets ≥ 44 px.

## MVP and stop line

Appetite: one day. The intro animation gets at most ~1.5 h; if it runs over it becomes three still
panels and the animation moves to the backlog. Further cuts, in order: the urge "ride it out" pause
(keep the one-tap urge log), then the friction-step field.

**In:**
- A short intro animation (15–20 s, skippable, once on first launch, replayable) with three
  messages: about two months, not 21 days (P8, A6); tie it to something you already do (P1);
  missing a day doesn't reset you, coming back counts (P5, P6).
- Create a **build** habit: an if-then commitment (after I ___, I will ___), a daily goal that is
  clearly met or not ("up by 7:00", "10 pages"), and an optional "why this matters to me" (P1, P11).
- Create a **stop** habit (nicotine pouches): trigger, one friction step, one replacement action
  (P13, A9).
- Today screen: each habit logged in one tap (kept / missed; for stop habits: clean / slip with size
  / urge, with a short "ride it out" pause) (P2, P14, P16).
- Progress that survives a miss: a rolling rate ("6 of the last 7") and clean days counted, never a
  counter that resets to zero; history always kept (P6, A1, A11).
- The comeback: after a missed day, the next open shows a gentle message with one next step; the
  next kept day is marked as a comeback (P5, P7).
- One small celebration when a habit is logged as kept (the owner's one-moment motion rule).
- Data in localStorage on one device.

**Out (in [`backlog.md`](backlog.md)):** notifications and email, morning motivation, evening log
reminder, self-doubt, weekly review, automaticity check (SRBAI) and graduating a habit,
accountability partner, sync across devices, accounts.

**Day rules the pack implies but doesn't spell out** *(each assumed, smallest reversible choice):*
- **Day boundary:** a log belongs to the previous day until **04:00 local time**, so a 00:30
  bedtime log counts for the evening before. *(assumed: the pack says "after midnight belongs to the
  evening before" but names no cutoff; 04:00 is a common choice and one constant to change)*
- **Time zone:** the phone's local time zone; 25 Oct 2026 is the EU clock change (a 25-hour day),
  so day maths uses calendar dates, not 24 h of milliseconds. *(assumed: owner is in Europe)*
- **A day with no log:** once over, it counts as **not kept** in the rolling rate and triggers the
  comeback message, but is shown in history as "not logged", never as a failure. *(assumed: skipping
  the app after a slip is the "giving up" moment the research says matters most (research §"The
  hours after a slip"); treating silence as neutral would hide it)*
- **Clean days:** a stop habit's day counts as clean once it is over and has a clean log and no
  slip; a slip logged later that same day overrides the clean tap. The clean-day number is the total
  of clean days since the habit started, never consecutive. *(assumed: the pack says "clean days
  counted" and "only once the day is over")*
- **Rolling rate window:** the last 7 days, today included only once it is logged; a habit younger
  than 7 days uses its age ("3 of the last 3"). *(assumed: matches the pack's "6 of the last 7")*
- **Kept for a stop habit:** "clean" is the stop habit's "kept": it gets the celebration and can be
  a comeback. *(assumed)*
- **Wake-up goal:** self-reported by the tap; the time of the tap is never used to judge it (A8,
  P12). *(assumed)*
- **Ride it out:** 60 seconds, one tap to leave at any time (P14, P16, A12). *(assumed: the pack
  says "short"; 60 s is the research's figure)*
- **Comeback message:** shown once per comeback, on the first open after the missed day, per habit;
  it never stacks into a list of failures. *(assumed)*

## Feature drill-down

The product's objects, each through four checklists: lifecycle (create, find, change, organise, remove, take out), connections, screen states (empty, working, error, full) and trust (undo, confirm, nothing lost). Claude pre-fills a call and a reason; I change what I disagree with. MVP rows become requirements; Later rows go to the backlog (playbook step 1).

Objects (the product's vocabulary): **habit** (build or stop, a card on the board), **log** (kept,
missed, clean, slip with size, urge), **comeback** (a mark on a kept day after a miss), **intro**.

| Object | Action or state | Call | Why |
| --- | --- | --- | --- |
| Habit | Create build habit (anchor, action, goal, optional why) | MVP | R2; top job 2 |
| Habit | Create stop habit (trigger, friction step, replacement) | MVP | R3 |
| Habit | Find and open (see its card and history) | MVP | R5, R8 need history to be visible |
| Habit | Edit wording | MVP | A typo in a commitment you see every day breaks trust; recreating would lose history (A11). Reuses the create form |
| Habit | Reorder cards on the board | Later | Two to four habits fit on one screen |
| Habit | Delete, with a confirm | MVP | Without it a test habit stays forever; confirm because it removes history |
| Habit | Archive / pause, history kept | Later | P11 says pause without penalty; not needed in the first weeks |
| Habit | Export or share | Later | One device, one person |
| Habit | Limit to ~3 active habits | Later | P4 is weak evidence; the owner has 3–4 |
| Log | Log today in one tap | MVP | R4, S1 |
| Log | Undo / change today's log | MVP | A mis-tap must not become a "slip"; a slip is the moment that matters most |
| Log | Log or change yesterday | MVP | The evening log done the next morning, and the 04:00 cutoff edge. *(assumed: pack's rabbit hole limits editing "beyond the last few" days; one day back is the smallest)* |
| Log | Edit older days | No | Rabbit hole (pack) |
| Log | Slip size | MVP | R5, P14; research says size predicts relapse |
| Log | Urge, with "ride it out" | MVP (pause is cut first) | R5, P14 |
| Comeback | Message on the open after a missed day | MVP | R7 |
| Comeback | Mark on the next kept day | MVP | R8 |
| Intro | Play once, skip, replay | MVP | R1 |
| Board | Empty state (no habits yet) | MVP | First thing seen after the intro; must lead to creating one |
| Board | Full state (5+ habits, long wording) | MVP (layout only) | Long commitments must not break the big cards |
| Board | Working / error states | No | No network, no loading |
| Data | Nothing lost on reload or app resume | MVP | Guardrail "correct data"; S4 |
| Data | Storage full or cleared | Later | One device; note in backlog |

## Requirements

From the kickoff pack; checks in [`evals.md`](evals.md).

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
| R9 *(assumed, from drill-down)* | Today's and yesterday's log can be changed; a habit's wording can be edited; a habit can be deleted after a confirm | Change a log, reload: changed; edit wording: history kept; delete asks first |
| R10 *(assumed, from day rules)* | Day logic follows the day rules above, without a reload | S4 in the test plan |

**No-gos:** accounts, a backend, notifications, points or badges, a streak that resets to zero.
Also from "Things to avoid": guilt copy, red crosses, failure language, XP, lots of motion (one small
moment on keeping a habit, nothing per tap), "21 days" or "1% better = 37x", a checkbox list of rows
with tick boxes, trophies, coins, crowns, streak banners.

**Rabbit holes:** a custom animation engine (use CSS or one small library); flexible schedules
beyond daily; editing past days beyond the last few.

## Unit tests

The 0–3 pieces of logic that would hurt most if silently wrong, and the edges to check (from the pack).

1. **Which day a log belongs to:** a log at 00:30 for bedtime counts for the evening before; 03:59
   vs 04:00; month end (1 Nov 00:30 → 31 Oct); the 25 Oct clock change.
2. **Rolling rate and clean-day count:** a normal week, a slip in the middle, empty history, a habit
   younger than 7 days, an unlogged day, a slip after a clean tap on the same day.
3. **Comeback detection:** a kept day right after a missed day; two misses in a row (one comeback,
   on the first kept day); first day ever (no comeback).

## Success check (at wrap-up)

Checked 25 Oct, the day Wont shipped. The outcome is about four weeks of real use, so the honest
answer today is **not yet known**; the graders' results stand in until then.

| Signal | Target | What happened |
| --- | --- | --- |
| Logs every day | 14 of 14 days | Not measured yet: real use starts 26 Oct. Check on 8 Nov from the app's history |
| Comes back after a slip | every slip gets a comeback day | In the simulated week: every slip and miss was followed by a comeback, and the message named the right day (after two fixes: F2, N1). Real data from 26 Oct |
| Wakes on time | ≥ 5 of 7 days a week | Not measured yet; the owner was on day 5 of 7am wake-ups at kickoff |
| Guardrail: never feels punished | never; zero guilt words | Simulated: 0 guilt words on app screens, "Did that feel like punishment? No." Owner's own check after the first real slip |
| User-test bars | S1–S4, jobs ≥ 4 | Pass (S1 1 tap / ~3 s, S3 2 taps / ~6 s; jobs 4, 5, 5) |
| Design critic | ≥ 9/10 | **Fail, 6/10** in every round: it scored against requirements it never saw (rolling number, anchors, week strip) |
| Guardrails | contrast, data, phone | Pass (4.92:1 worst; 12/12 and 25/25; 44 px) |

**Did it solve the problem?** The riskiest moment (the morning after a slip) works in simulation:
two taps, the clean days stay, one next step, a winking comeback wonton. Whether it keeps the owner
at 7am and off pouches is the four-week check on **21 Nov** (in `docs/todo.md`).
