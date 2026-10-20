# Brief

A one-page PRD, written before any code (playbook step 1). Short answers; the success check is filled in at wrap-up.

*Drafted by Claude from the owner's idea and answers, decisions by the owner, 12 Oct.*

## Problem

People prescribed medical cannabis for long-term pain have a follow-up every month or so, often a
15-minute video call. The clinician asks "how has it been?", and the patient rebuilds weeks from
memory, coloured by how they feel today. The clinician adjusts the dose or product on rough
impressions, and the patient can't tell either whether the treatment is changing anything.

## Who

Sam, 44, fibromyalgia for six years, eight months on a medical cannabis prescription from a UK
online clinic, monthly video follow-ups. Uses a phone for everything, has bad days when even
small tasks are too much, and is tired of explaining their pain. Imagined persona (owner, 12 Oct);
full version in [User testing](#04-mallow.testing).

## Moment of use and jobs to be done

**Main moments:** right after taking a dose (log it in a tap or two), and the next time Sam opens
the app (one tap: how did it help?), plus a short daily symptom check-in whenever Sam remembers.
No fixed time and no notifications yet (owner): reminders come later, so every moment must work
whenever the app is opened and can't rely on a ritual.
**Second moment:** the day of the appointment: open the summary and show it in the call.

1. "When I'm in the follow-up, I want to show what has changed since last time, so the doctor
   adjusts my treatment on what really happened, not on how I feel today."
2. "When I take my medicine, I want to note it and later say how much it helped, so we can see
   what the medicine itself is doing, not just how my week went."
3. "When I check in, I want to log my main symptoms in a few taps, even on a bad day, so the
   record keeps going without effort."
4. "When I wonder if it's working, I want to see my trend, so I can decide what to ask for (a
   different strain, dose, or to stop)."

## Today's alternatives

| Alternative | Good | Annoying |
| --- | --- | --- |
| Memory | Free, no effort | Recall bias: today's pain colours the month; details lost in 15 minutes |
| Notes app or a paper diary | Flexible, private | No structure, nothing adds up into a trend, hard to show quickly |
| Clinic questionnaires (registry PROMs at 1, 3, 6, 12 months) | Validated, what clinicians trust | Long, rare, a snapshot; patients drop off (about 2,300 at 1 month, about 200 at 12 in the UK registry) |
| Calyx (Grow Pharma's free tracker), Bearable | Symptom and medication tracking, doctor chat | General-purpose or supplier-tied; built for logging, not for the 15-minute conversation |
| Montu UK today (Alternaleaf) | Cheap follow-ups (£29, or £5 a month), reorder reminders | No symptom tracking on the public site, only a side-effects PDF |

**Why would Sam switch?** Nothing turns a few taps a day into the thing Sam actually needs: one
screen that answers "is it working?" in the follow-up.

## Riskiest assumptions

| Risk | Assumption | How risky |
| --- | --- | --- |
| Value | A "since last appointment" summary makes the follow-up better for both sides (Sam feels heard; the clinician can decide faster) | **Riskiest** |
| Value | Sam keeps logging without reminders long enough to build a trend (the registry shows heavy drop-off); knowing "your doctor will see this" and a countdown to the appointment is enough pull | High (reminders parked) |
| Value | Dose-linked relief ratings tell Sam and the clinician something a daily trend can't: whether the medicine helps | High |
| Usability | Logging a dose takes 2 taps, relief 1 tap, a symptom check-in about 30 seconds, all on a bad day | Medium |
| Feasibility | Charts and a summary from localStorage in a day | Low |
| Viability | Health data stays on the phone (no backend, no accounts); demo data only for testing; the name and copy make no health claims (cannabis is a prescription-only medicine in the UK) | Medium |

So the MVP must test **whether the summary answers "is it working?" at a glance**, which is why
it ships with a realistic demo history.

**The business side (owner, 12 Oct):** Montu UK wants evidence of how its treatment helps people
manage long-term conditions. In the MVP that evidence is one patient's summary; a clinic view
across patients is a second product (backlog).

## Success: what good looks like

**Main outcome:** Sam walks into a follow-up with evidence instead of memories, and the call ends
with a decision based on it.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Summary answers the question (main) | User test: from the summary alone, say whether pain and sleep got better, worse or stayed the same since last visit, and name one side effect | ≤ 60 s, correct |
| Logging is effortless | User test: log a dose; rate relief; do a symptom check-in | Dose ≤ 2 taps, relief 1 tap, check-in ≤ 30 s; no typing needed |
| Relief is captured | User test: log a dose, reopen later → asked how it helped | Asked without searching for it; answered in 1 tap |
| Works on a bad day | User test: check in as Sam on a bad day (tired, one-handed) | Done without help |
| Guardrail: correct numbers | The summary's averages and changes match the logged data | Exact, every time |
| Guardrail: no claims | Copy never says the medicine works or promises relief | None |

## MVP and stop line

**Ships today:** a short setup (Sam's product, usual amount, 2–4 symptoms to track, last and next
appointment) → log a dose in a tap → next open, one tap on how it helped → a daily check-in of
Sam's symptoms in plain-word grades, sleep and side effects → a summary since the last appointment,
with a countdown to the next one, shown on screen in the call. Data stays in localStorage. A demo
history fills the app for testing and showing.

**Decided (owner, 12 Oct):**
- **Patient side, plus a summary.** No clinic dashboard; the summary *is* what the clinic gets.
- **A few simple scales,** not validated questionnaires (long; EQ-5D-5L needs a licence).
  Symptoms graded in plain words (Vinehealth's pattern), on Sam's own short list.
- **Dose logging plus relief** (owner): when, what form, how much. Relief is one tap, asked the next
  time Sam opens the app ("How did your 8pm dose help?": no help, a little, quite a bit, a lot),
  like PGIC, which the UK registry collects. No before-and-after scores per dose.
- **Stickiness through purpose** (owner): the app says plainly that logging helps the doctor give
  better care, and counts down to the next appointment.
- **Sam sets the last and next appointment dates** (owner). The summary covers last → today.
- **A real PDF made on the phone** (owner), nothing uploaded. *Later cut from the MVP (owner,
  12 Oct): the summary on screen is enough for now; the PDF is next in the backlog.*
- **No fixed moment yet;** reminders and notifications come later.
- **Name: Mallow,** a soothing plant. Palette from the flower: purple, green and white.

**Design (owner, 12 Oct, after two prototype rounds):** three tabs, Today, Journey (patients'
own word) and Care. Today is a mallow that quietly grows a leaf per logged day and flowers on
appointment day, never explained; the purpose is said plainly instead ("9 days until you see
Dr Patel"). Journey is a calendar shaded by one symptom's grade. Care holds medicines (more than
one allowed), what's tracked and the appointments.

**Design references (owner, 12 Oct):** Vinehealth, the cancer companion app the owner worked on:
plain-word grades, "last time you mentioned…", choosing your own symptoms, a report for the
appointment, accessibility for low vision and brain fog. Inspiration only; Mallow should be its
own, calmer thing. Not: many tabs and articles, a colour per screen, emoji faces, red/green
judging days.

**Stop line:** anything not above goes to [backlog](#04-mallow.backlog): reminders, a clinic
dashboard, validated questionnaires, before/after scores per dose, medication schedules,
articles, accounts and sync.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| 1 | First open: a short setup (product and form, usual amount, 2–4 symptoms, last and next appointment), skippable with sensible defaults | Fresh install → home in ≤ 60 s |
| 2 | Logging a dose: one tap with the usual product and amount, time = now; amount and time editable | Dose logged in ≤ 2 taps |
| 3 | The next time the app opens after a dose (an hour or more later), it asks how that dose helped; one tap answers, it can be skipped | Log dose, reopen later → question shown → 1 tap |
| 4 | Daily check-in: Sam's symptoms graded in plain words, sleep, side effects as taps, an optional note; checking in again the same day edits today | Taps only; two check-ins → one day |
| 5 | Missed days are fine: gaps show as gaps, never as zeros or a broken streak | Skip 3 days → gap; averages ignore it |
| 6 | Home shows the countdown to the next appointment, days logged, and why logging matters ("your doctor will see this") | Visible on home without scrolling |
| 7 | Summary since the last appointment: each symptom's average and direction vs the period before, doses and how they helped, side effects counted, notes flagged | Numbers match the data by hand |
| 8 | The summary opens from Journey in one tap, fits the phone screen and can be shown in the call (PDF moved to the backlog, owner 12 Oct) | Open → readable in 60 s, same numbers as the data |
| 9 | A demo history can be loaded and cleared, and never mixes with real entries | Load demo → full summary; clear → empty |
| 10 | Data stays on the device; nothing is sent anywhere | No network calls with health data |

**No-gos:** accounts, a backend, a clinic view, reminders and notifications, AI, before/after
scores per dose, medication schedules, articles, medical advice or claims, validated
questionnaires.

**Rabbit holes:**
- Chart polish: one clear trend per measure; use the `dataviz` skill and stop there.
- Statistics: "better, worse or about the same" from simple averages, no significance tests.
- Product catalogue: Sam types their product name once (free text) plus a form (oil, flower,
  vape, capsule); no strain database.
- Side-effect lists: a short fixed set of common ones (dry mouth, drowsy, dizzy, foggy, anxious,
  hungry) plus "other" in the note.

## Success check (at wrap-up)

*12 Oct, drafted from the simulated user test (report-2026-10-12) and the checks. The owner's own
phone review and a real patient are still to come (to-do).*

| Signal | Target | What happened |
| --- | --- | --- |
| Summary answers the question (main) | ≤ 60 s, correct | **Met (simulated):** ~30–40 s; pain, sleep and side effects named correctly. Not yet tried by a real patient or clinician. |
| Logging is effortless | dose ≤ 2 taps, relief 1 tap, check-in ≤ 30 s | **Met:** dose 2 taps / ~4 s, relief 1 tap / ~3 s, check-in 5–6 taps / ~20–25 s, no typing |
| Relief is captured | asked unprompted, 1 tap | **Met after a fix:** the question only appeared after a reload; now re-checked whenever the app is reopened |
| Works on a bad day | done without help | **Met:** 6 taps, nothing red, no streaks; Save now says "2 to go" instead of silently greying out |
| Guardrail: correct numbers | exact | **Met:** 17 of 17 summary values matched a hand count; ties now said honestly ("mild to moderate") |
| Guardrail: no claims | none | **Met:** 0 claims across ~60 strings; nothing leaves the phone (0 network requests) |
| Setup (requirement 1) | ≤ 60 s | **Missed:** ~80 s (medicine name and dates); acceptable once, logged |

**Did it solve the problem?** In simulation, yes for the appointment itself: a few taps a day
become one screen that tells a clinician in under a minute whether pain and sleep moved, how often
the doses helped, and what was taken. What isn't known is whether a real patient keeps logging
without reminders (the second-riskiest assumption) and whether a clinician trusts plain-word
averages. Both need real people: the owner's phone review first, then one patient (to-do).

---

# v2: is it working, and what am I taking?

*Owner's rebuild brief, 20 Oct, written up by Claude before any code (playbook step 1). Everything
in v1 above still holds unless this section says otherwise.*

**v2 deliberately lifts two v1 no-gos:** medication schedules and educational content. Both are
there to serve "is it working?", not to become a medicine shop or a content app.

## Problem (v2)

v1 answers "is it working?" for one 15-minute call, built around pain and per-dose relief. Three
gaps remain:
- **Patients don't understand their options.** The CQC found Alternaleaf patients were
  "encouraged to pick from a wide range of cannabis-based products with no guidance". The
  clinician decides product and dose; the patient needs enough plain information to take part.
- **Nothing says what to take and when.** Montu's tools (pre-screen, portal for repeats and
  bookings, a store, live chat, PDF guides) don't track doses or symptoms or show change.
- **Memory-based relief is weak evidence.** "Did it help?" is recalled; a daily grade captures
  today. Change over time, shown next to what was being taken, is stronger evidence for patient,
  prescriber and the business (Montu can't advertise, so retention is how it grows).

## Who (v2)

- **Sam** (v1): 44, fibromyalgia six years, eight months on medical cannabis, oil daily and
  flower for flare ups, monthly 15-minute video follow up.
- **Priya** (new): 31, anxiety and poor sleep, three months on a balanced oil at night, a vape
  added halfway for anxious moments, monthly video follow up.

Main patient groups behind the condition list: chronic pain, mental health (anxiety, depression,
PTSD, ADHD), neurological (MS, migraine), women's health (endometriosis).

## Goals and jobs to be done

1. **Understand the medicine I've been prescribed, and know what to ask my doctor** (reworded
   from "understand my options", owner 20 Oct: the guardrails rule out helping choose) — "When I'm prescribed a form I haven't used, I want to know how
   to take it and what to expect, so I take part in decisions with my doctor."
2. **Know what to take, when and how, and log it** — "When it's time for a dose, I want the app
   to show what's due and let me tick it, so the record keeps itself."
3. **Track my symptoms** — "When I check in, I want the symptoms that matter for my condition, not
   only pain."
4. **See change while on treatment** — "When I wonder if things are changing, I want to see my
   sleep, pain or anxiety over time next to what I was taking, so my doctor and I can judge."

**Principle for goal 4:** the evidence is the daily symptom log over time, not asking whether the
medicine helped. The app shows change alongside the medicines taken and never says the medicine
caused it. The doctor interprets.

## Riskiest assumptions (v2)

| Risk | Assumption | How risky |
| --- | --- | --- |
| Value | A trend per symptom with the medicine strip underneath answers "is it changing?" faster and more honestly than per-dose relief | **Riskiest** |
| Value | A schedule (tick what's due) keeps logging going better than v1's "log a dose" button | High |
| Viability | Education can be useful while never naming products, doses or claims (advertising law, CQC) | High: copy is checked string by string |
| Usability | Setup with conditions, baseline and a full prescription still fits in 90 s | Medium |
| Feasibility | Graphs, a medicine history and migration of v1 data in two days | Medium: the biggest scope risk |

## Success (v2)

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Change is readable (main) | From the graph alone, say whether sleep (Priya) or pain (Sam) changed since starting, and what was taken when | ≤ 60 s, correct, no causal words used by the app |
| Setup fits | Fresh install → home, including condition and baseline | ≤ 90 s, skippable |
| Logging stays effortless | Tick a scheduled dose; log an as-needed dose; check in | 1 tap; ≤ 2 taps; ≤ 30 s |
| Missed doses are kind | Skip a scheduled dose | Shown as not taken; no red, streaks or guilt copy |
| Guardrail: correct numbers | Summary and graph values vs a hand count | Exact |
| Guardrail: no advice, no claims | Every new string checked against the guardrails | 0 breaches; near misses listed |

## MVP and stop line (v2)

Two days, requirements 1–6 in this order. **Day 1:** 1 and 2 (conditions, symptoms, baseline),
then 3 and 4 (My plan, medicine history, Today schedule); ship. **Day 2:** 6 (graphs and summary),
then 5 (Know your medicine); new demo data; ship.

**Stop line, cut in this order if day 2 runs over:** (a) "Other forms" cards (own forms only);
(b) the 3-month range (keep 4 weeks and since starting); (c) amount-change markers on the strip
(keep start/stop bars). The graph, the strip's bars, the summary and the guardrails are not cut.

**Constraints:** everything stays on the device (localStorage); no accounts, backend or network
calls with health data; demo data only, never mixed with real data. Keep v1's calm design, plain
words, three tabs (Today, Journey, Care) and the plant. Logging stays two taps or fewer.

**Decided (owner, 20 Oct):**
- **Midnight:** a bedtime dose ticked after midnight counts toward the previous night's plan (the
  schedule day ends around 04:00); the dose keeps its real date and time.
- **Relief:** shown as one quiet line per medicine in the summary, only when medicines overlap
  and there are ratings.
- **Setup:** asks one medicine's essentials (name, form, amount, times); how to take it, the
  as-needed rule and more medicines are added in Care, to keep setup within 90 s.

- **What the graph must make obvious** (owner, 20 Oct, for the 10 seconds of a video call): how
  each symptom has been changing, and what type of medication the patient was on at the time.
  Symptom change leads, the medicines sit beneath on the same time axis; nothing else competes.

## Requirements (v2)

| # | Must | Check |
| --- | --- | --- |
| 1 | **Setup that fits my condition.** Pick a condition → 2–4 suggested symptoms, editable. Catalogue adds Appetite, Muscle spasm, Concentration, Period or pelvic pain (question + four plain-word grades with meanings, lower is easier) | Fresh install → home ≤ 90 s, skippable with defaults |
| 2 | **Before treatment.** Optional baseline grade per tracked symptom in setup, editable in Care; stored once; first comparison in graphs and summary | Skippable; shows as a band and in the summary |
| 3 | **My plan.** Per medicine: product name (free text), form, amount, times of day, how to take it, as-needed rule; several medicines; "as your doctor prescribed". History: startDate, optional stopDate, amount changes {date, amount}, written automatically; v1 data migrates (start = first appointment or first dose) | Add, change, stop → history correct; v1 store loads |
| 4 | **Today follows my plan.** Shows what's due now; tick = 1 tap; as-needed ≤ 2 taps; amount and time editable; missed = "not taken", never a failure. Relief optional (tap on the dose row or an easy-to-skip prompt), used only to separate medicines taken in the same weeks | Tap counts; no red, streaks or guilt |
| 5 | **Know your medicine.** One card per form (oil, flower, vape, capsule): what it is, how to take it, onset and duration (typical ranges + "varies from person to person"), common side effects, storage, driving and travel; own forms first, others under "Other forms"; from Care and each medicine. Dose and frequency only from My plan, as "Your plan". Ends with 3–4 "Questions you could ask your doctor" | No general dosing advice; guardrail check |
| 6 | **Is it working?** v1 check-in kept (≤ 30 s, gaps stay gaps). One graph per tracked symptom (pick which, first by default; 4 weeks / 3 months / since starting); y axis in grade words; daily dots + 7-day average, gaps not joined; medicine strip (bar per medicine, amount-change markers, appointments as lines); before-treatment band; one plain-words line, never "working", "effective", "because of". Works at 320 px, readable in a video call. Summary: per symptom, trend word and change vs period before and vs before treatment, medicines in use (with amount changes) | Numbers match a hand count |

## Guardrails (must hold everywhere)

- Never suggest a product, cultivar, strength or dose for a condition; never name products other
  than the patient's own.
- Never tell someone to start, stop or change a dose; any decision points to "your doctor or
  pharmacist".
- No claims: describe, don't promise. No "best for", "proven", "effective", "works".
- Education is factual and balanced, about forms in general, and says effects vary.
- No health data leaves the phone; demo data never mixes with real entries.
- Accessibility as v1: 44 px targets, text contrast ≥ 4.5:1, non-text ≥ 3:1, one-handed on a bad
  day, no red or green judging colours.

## Out of scope (v2, to backlog)

Questions for my appointment (next up), PDF of the summary, supply and reorder estimate with a link
to Repeats, reminders and notifications, clinic view across patients, monthly validated
questionnaires (GAD-7, a sleep scale; EQ-5D-5L needs a licence), seizure diary, accounts and sync.

## Done when

Vitest for the schedule (due now, across midnight), medicine history (start, stop, amount changes,
v1 migration), 7-day average with gaps, period and baseline comparisons. Every requirement walked
on a fresh install. A "time passes" test (resume without reload, midnight, an appointment date,
a medicine added halfway). web-design-guidelines and break-ui on Today, graphs and cards. Every
new string checked against the guardrails, near misses listed. Success check, learnings and
backlog updated.

## Success check (v2, at wrap-up)

*20 Oct, from Claude's checks in the browser, the unit tests and the hand counts. No user test
(simulated or real) of v2 yet; that's the main gap.*

| Signal | Target | What happened |
| --- | --- | --- |
| Change is readable (main) | ≤ 60 s, correct, no causal words | **Not yet tested with a user.** On screen: the takeaway sentence, the graph and every medicine fit in one phone screen when Journey opens; the design critic scored 5/10 twice (owner made the calls after round 2). |
| Setup fits | ≤ 90 s, skippable | **Likely met:** about 14 taps plus typing a name on a fresh install; every step skippable. Not timed with a person. |
| Logging stays effortless | tick 1 tap; as-needed ≤ 2; check-in ≤ 30 s | **Met:** tick 1 tap; as-needed 2 taps (Took a dose → the medicine); v1 check-in unchanged. |
| Missed doses are kind | no red, streaks or guilt | **Met:** "Not taken" in the same grey as "Later"; no counts or streaks. |
| Guardrail: correct numbers | exact | **Met:** summary values on Sam's demo matched a hand count (pain 1.5 vs 1.57, mood 1.35 → 1.67, baseline comparisons, 13 doses on 7 days); 30 unit tests for schedule, history, migration, averages and comparisons. |
| Guardrail: no advice, no claims | 0 breaches | **Met after fixes:** one breach caught ("How quickly it works" heading), four near misses changed (see journal); nothing leaves the phone (only the app's own files are requested). |

**Did v2 solve the problem?** It now answers "what am I taking, and is anything changing?" from the
daily log rather than from memory, and v1 users keep their data. Whether a patient or a clinician
reads the graph correctly in a call is not known yet: run the simulated user test as Priya, then a
real one.
