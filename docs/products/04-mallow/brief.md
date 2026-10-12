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

**Main moment:** a short check-in on the phone, once a day, when Sam remembers. The owner chose
not to design around a fixed time yet: reminders come later (backlog). So the check-in must work
whenever it's opened and can't rely on a ritual.
**Second moment:** the follow-up call, with the summary open on the phone or shared just before.

1. "When I'm in the follow-up, I want to show what has changed since last time, so the doctor
   adjusts my treatment on what really happened, not on how I feel today."
2. "When I check in, I want to log how today was in a few taps, even on a bad day, so the record
   keeps going without effort."
3. "When I wonder if it's working, I want to see my trend, so I can decide what to ask for (a
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
| Value | A one-screen "since last visit" summary makes the follow-up better for both sides (Sam feels heard; the clinician can decide faster) | **Riskiest** |
| Value | Sam keeps checking in without reminders long enough to build a trend (the registry shows heavy drop-off) | High (reminders parked) |
| Usability | A check-in takes about 30 seconds and works on a bad day | Medium |
| Feasibility | Charts and a summary from localStorage in a day | Low |
| Viability | Health data stays on the phone (no backend, no accounts); demo data only for testing; the name and copy make no health claims (cannabis is a prescription-only medicine in the UK) | Medium |

So the MVP must test **whether the summary answers "is it working?" at a glance**, which is why
it ships with a realistic demo history.

## Success: what good looks like

**Main outcome:** Sam walks into a follow-up with evidence instead of memories, and the call ends
with a decision based on it.

| Signal | How I'll measure it | Target |
| --- | --- | --- |
| Summary answers the question (main) | User test: from the summary alone, say whether pain and sleep got better, worse or stayed the same since last visit, and name one side effect | ≤ 60 s, correct |
| Check-in is effortless | User test: open → check-in saved | ≤ 30 s, ≤ 6 taps, no typing needed |
| Works on a bad day | User test: check in as Sam on a bad day (tired, one-handed) | Done without help |
| Guardrail: correct numbers | The summary's averages and changes match the logged data | Exact, every time |
| Guardrail: no claims | Copy never says the medicine works or promises relief | None |

## MVP and stop line

**Ships today:** open the app → check in (pain, sleep, mood, side effects, an optional note) →
see your days add up → a "since last visit" summary to show in the call. Data stays in
localStorage. A demo history fills the app for testing and showing.

**Decided (owner, 12 Oct):**
- **Patient side, plus a summary.** No clinic dashboard; the summary *is* what the clinic gets.
- **A few simple scales,** not validated questionnaires (long; EQ-5D-5L needs a licence).
- **No fixed moment yet;** reminders and notifications come later.
- **Name: Mallow,** a soothing plant. Palette from the flower: purple, green and white.

**Open (owner's call before building):** how the summary reaches the clinician (show the screen
in the call, or also copy/share as text), and what "last visit" is (a date Sam sets, or the last
30 days).

**Stop line:** anything not above goes to [backlog](#04-mallow.backlog): reminders, a clinic
dashboard, validated questionnaires, dose-by-dose logging, export to PDF, accounts and sync.

## Requirements

| # | Must | Check |
| --- | --- | --- |
| 1 | Opening the app goes straight to today's check-in (or shows it's done) | Open → first scale in view, no menus |
| 2 | Pain and sleep on 0–10, mood on a small scale, side effects as taps, a note that's optional | Check in with taps only, no keyboard |
| 3 | Saving takes one tap; checking in again the same day edits today rather than adding a second entry | Two check-ins → one day |
| 4 | Missed days are fine: gaps show as gaps, never as zeros or a broken streak | Skip 3 days → chart shows a gap, averages ignore it |
| 5 | A "since last visit" summary: average pain and sleep vs the period before, the direction of change, days logged, side effects counted, notes flagged | Numbers match the data by hand |
| 6 | The summary fits on one phone screen and reads without explanation | A stranger answers "is it working?" in ≤ 60 s |
| 7 | A demo history can be loaded and cleared, and never mixes with real entries | Load demo → full summary; clear → back to empty |
| 8 | Empty state: day one with nothing logged still makes sense | Fresh install → check-in, summary says "after a few days" |
| 9 | Data stays on the device; nothing is sent anywhere | No network calls with health data |

**No-gos:** accounts, a backend, a clinic view, reminders, AI, dose tracking per use, medical
advice or claims, validated questionnaires.

**Rabbit holes:**
- Chart polish: one clear trend per measure; use the `dataviz` skill and stop there.
- Statistics: "better, worse or about the same" from simple averages, no significance tests.
- Side-effect lists: a short fixed set of common ones (dry mouth, drowsy, dizzy, foggy, anxious,
  hungry) plus "other" in the note.

## Success check (at wrap-up)
