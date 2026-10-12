# Test plan: Mallow

## How to run the app for testing

- Start: `pnpm -F 04-mallow dev` (no env vars, no backend).
- Viewport: 390 × 844 (phone).
- Seed data: "first run" = cleared localStorage. "Returning user" = load the demo history (about
  six weeks, with a last visit set), then clear it afterwards.
- Simulated parts: the follow-up call itself (the tester plays Sam, then the clinician).

## Scenarios

Written as the persona's real moments. Each has a success bar.

### S1 · First check-in
- **Moment:** evening on the sofa, first time opening the app.
- **Task:** "Log how today was."
- **Success:** check-in saved in ≤ 30 s and ≤ 6 taps, no typing, without help.

### S2 · Bad-day check-in
- **Moment:** a flare day, tired, one hand free, low patience.
- **Task:** "Just get today down, quickly."
- **Success:** done without help; nothing makes them feel judged (no streak warnings, no red).

### S3 · The follow-up (main)
- **Moment:** two minutes before the video call, demo history loaded.
- **Task:** as Sam, find what to tell the doctor. Then, as the clinician seeing the screen: is it
  working?
- **Success:** in ≤ 60 s from the summary alone, says correctly whether pain and sleep got better,
  worse or stayed the same, and names the most common side effect.

### S4 · Coming back after a gap
- **Moment:** after four days without checking in.
- **Task:** "Pick it back up."
- **Success:** the app treats the gap calmly; the chart shows a gap, not zeros; check-in works.

## Value questions

- Would Sam check in without a reminder? What would make them come back tomorrow?
- Does the summary make Sam feel taken seriously, or like a patient being graded?
- What would a clinician want that's missing (dose changes, product names)?

## Out of scope

Reminders, sharing to the clinic, accounts and sync, medical accuracy of the scales.
