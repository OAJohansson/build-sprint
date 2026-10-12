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
**Second moment:** the day of the appointment: download the summary as a PDF and send it to the
clinic, or show it in the call.

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
with a countdown to the next one → download it as a PDF for the doctor. Data stays in localStorage;
the PDF is made on the phone. A demo history fills the app for testing and showing.

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
- **A real PDF made on the phone** (owner), nothing uploaded.
- **No fixed moment yet;** reminders and notifications come later.
- **Name: Mallow,** a soothing plant. Palette from the flower: purple, green and white.

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
| 8 | "Download for my doctor" makes a PDF of the summary on the phone | File opens, same numbers, readable in 60 s |
| 9 | A demo history can be loaded and cleared, and never mixes with real entries | Load demo → full summary; clear → empty |
| 10 | Data stays on the device; nothing is sent anywhere | No network calls with health data |

**No-gos:** accounts, a backend, a clinic view, reminders and notifications, AI, before/after
scores per dose, medication schedules, articles, medical advice or claims, validated
questionnaires.

**Rabbit holes:**
- Chart polish: one clear trend per measure; use the `dataviz` skill and stop there.
- Statistics: "better, worse or about the same" from simple averages, no significance tests.
- PDF layout: one page, plain and readable; reuse the summary's numbers, don't redesign it.
- Product catalogue: Sam types their product name once (free text) plus a form (oil, flower,
  vape, capsule); no strain database.
- Side-effect lists: a short fixed set of common ones (dry mouth, drowsy, dizzy, foggy, anxious,
  hungry) plus "other" in the note.

## Success check (at wrap-up)
