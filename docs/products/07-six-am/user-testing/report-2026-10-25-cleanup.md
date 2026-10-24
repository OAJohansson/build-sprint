# User test: Six AM cleanup re-check (25 Oct)

Simulated (`user-tester`), persona 1 (the owner), Playwright/Chromium at 1440 × 900 and 1280 × 800,
on the **test sandbox** (dev server on port 3017, in-memory store, its own access code; nothing
written to the owner's Supabase). 3 Mentor questions, ~6.5–6.8 s each. No console errors.

| # | Scenario | Score | Main issue |
| --- | --- | --- | --- |
| A | Access code on first visit | 5 | 0 `/api` requests before the code (N14 pass); a saved track opens at bar 37 (D1) |
| B | Analyse at a glance, filters, List menu, empty state | 4 | Cancel cut off in the listening row with the Mentor open (B1) |
| C | Mentor genre call and accept | 3 | "This track" answered about the earlier track, not the newly selected row (C1) |
| D | Mentor → Studio and the leave warnings | 4 | Draft at bar 1, header fits at both widths, all three ways out warn, none after Save (N9, N10, N13 pass) |

Passed: listening state reads in one place (row 9 "Listening 2/4 · 38 s" with its line; "Listening ·
1 queued" top right); BPM and genre filters with one Clear; Export and Clear list in "List ▾"; the
two-line empty state; each suggestion leads with the pick (N12); only the newest suggestion can be
accepted (N11).

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| D1 | major | Every saved track opens with the playhead at bar 37 (a deliberate "demo opens mid-song" choice that applies to all tracks) | backlog (outside this slice) |
| C1 | major | With a new row selected, "this track" follows the conversation's track (L86/T35 by design); the accept button doesn't name the track | backlog, owner's call |
| B1 | minor | Listening row's Cancel cut off when the Mentor is open | fixed (text truncates, Cancel stays) |
| C2 | minor | After a reload the accept button shows again (demo rows reset on reload) | demo only, not fixed |
| D2 | minor | Studio "Saved" at 3.06:1 contrast | fixed (4.8:1) |
| B2 | polish | Filters jump when Clear appears | fixed (space reserved) |
| B3 | polish | "5 not analysed" next to "Analyse all 4"; "30s" badge explained only on hover | not fixed |
| R1 | question | `?demo=1` writes demo rows to the store | already guarded: dev only, and the server refuses on Supabase (L74) |
