# Evals: Magpie

How the owner will judge the delivery (decision 0026). Written at kickoff, before any code, in
two parts that never live together:

- **Agent-checkable checks** (this file, `docs/products/NN-slug/evals.md`): the squad reads them,
  runs them and reports each with evidence in the eval report.
- **Owner-only checks** (the second half of this template): copied **outside the repo** (e.g. a
  private note), never committed, never pasted into a session. The squad must never read them.
  They catch a delivery that passes its own checks but misses the point.

Whoever builds something never grades it: the checks below are run by `user-tester`,
`design-critic` and `data-evals`, not by the agent that built the thing.

---

## Part 1: agent-checkable checks

### Requirements (one pass/fail check per requirement in the kickoff pack)

| # | Requirement | Check (how to tell, on a fresh install) | Run by | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| R1 | Maggie intro once, access code once per device | Fresh install shows A and B; reload skips both | user-tester | pass | Fresh install: welcome then access; reload and new tab skip both (report-2026-10-26, r1-01, r1-02) |
| R2 | Capture by camera, library or no photo | Each path reaches details (E) | user-tester | pass | Shutter, library and Skip each reach E and save (s1-04, r2-01) |
| R3 | All details saved | Typed values shown word for word on the item page; date set | user-tester | pass | 9/9 fields word for word, incl. accents and dashes; date set (r3-05) |
| R4 | Save never waits for AI; photo kept | Close during drawing: item on shelf with photo, sticker arrives; photo toggle works | user-tester | pass | Saved in 1.6–2.3 s; drawing closed; on the shelf at once; sticker ~10 s later without reload; photo toggle shows the original (r4-02, r4-03) |
| R5 | Share into Magpie | Share a photo from Android Photos: lands in E with it | user-tester | pass (simulated) | Multipart POST through the service worker → E with the photo → saved (s4-03); real Android share sheet not tested |
| R6 | Saved moment after every save | G shown with sticker and chips | user-tester | pass | G after camera, shared, no-photo and library saves (s1-06, s4-04) |
| R7 | Smart shelves match data; empty rows hidden | Seeded data: rows correct; a row with no items absent | user-tester | pass | Rows match seeded data; rows with no items absent; up to three 'Your top' rows after F6 |
| R8 | Search name, restaurant, note | Restaurant word and note word each find the item | user-tester | pass | 'noble' → Barolo by restaurant; 'roses', 'crystals' by note (r8-01) |
| R9 | Filters narrow, chips widen | Each filter alone and combined; remove a chip | user-tester | pass | 12 filter cases matched; removing chips widened 1 → 2 → 4 → 8 (r9-03, r9-04) |
| R10 | Edit and remove with a way back | Edit persists; remove asks or undoes | user-tester | pass | Edit persisted after reload; Remove → Undo toast → back (r10-02 to r10-05) |
| R11 | One library on phone and laptop | Save on phone viewport, reload laptop viewport: present | user-tester | pass | Saved at 390 × 844, present at 1280 × 800 with the filter panel open (r11-02) |
| R12 | Empty shelf state | Fresh library shows C | user-tester | pass | Empty library shows C on phone and laptop (r12-01, r12-02) |

### User test (from `user-testing/plan.md`)

| Scenario | Bar: time | Bar: taps | Bar: outcome | Result |
| --- | --- | --- | --- | --- |
| S1 Capture a drink at the table (camera, name, Cocktail, spot, hearts) | ≤ 30 s | ≤ 10 | Saved, on Latest | pass: 8 taps, ~21 s |
| S2 Find "that wine" by name or restaurant | ≤ 10 s | ≤ 3 | Item page open | pass: 3 taps, ~6 s |
| S3 Show wines I loved (4+) in London | ≤ 15 s | ≤ 5 | Correct results | struggle (6 taps) → pass on re-check: 5 taps, ~9 s |
| S4 Add a yum from a photo shared out of the camera roll | ≤ 40 s | ≤ 10 | Saved with that photo | pass (simulated share): 6 taps, ~14 s |

Every top job scored ≥ 4/5 by `user-tester`, and no blocker or major finding left open.

### Design

- `design-critic` scorecard (clutter, hierarchy, legibility, feel, copy; 0–2 each) **≥ 9/10**
  on each main screen (H, E, G, K, L), from screenshots only, against the final-flow screens on
  the canvas and the feel sentence. A target, not a blocker (decision 0028).
- No item from the kickoff pack's "Things to avoid" visible on any screen.

### AI and data (only if the product has them; run by `data-evals`)

Only bars the method can reach without the owner's taste data. Anything that needs it (e.g.
"in my words") goes in part 2 or the final review (decision 0028).

| Eval | Dataset | Metric | Bar | Result |
| --- | --- | --- | --- | --- |
| Sticker recognisable | 12 real food and drink photos | judge: is it the same dish/drink? | ≥ 10 of 12 | v3: 12/12 (+3/3 edge cases) |
| Sticker style consistent | same 12 | judge vs 3 reference stickers: flat, thick outline, one palette | ≥ 10 of 12 | v3: 12/12 (10/12 strict); outer edge 15/15 |
| Sticker time | same 12 | seconds from save to sticker | median ≤ 20 s | v3: 14.2 s (dev server) |
| Sticker cost | same 12 | $ per sticker | ≤ $0.05 | ≤ $0.037 (v2, clean reading); v3 same single call, ≤ $0.046 bound |
| Original photo kept | same 12 | photo still on the item | 12 of 12 | 12/12 |

### Guardrails (must not get worse; measured with a number)

| Guardrail | How measured | Bar | Result |
| --- | --- | --- | --- |
| Readable text | contrast ratio, worst state | ≥ 4.5:1 | 5.19:1 worst active; disabled 8.93:1 after F8 |
| Correct data | saved vs typed, word for word | 100% | 100% (9/9, 3/3 edits) |
| Phone | works at 390 × 844, targets ≥ 44 px | yes | yes (two small targets fixed, F7) |
| Grader data | tests use the sandbox access code (0028 #10) | never the owner's library | sandbox only, every run |

### Build hygiene

- `pnpm -F NN-slug build` and `pnpm -F NN-slug lint` pass; `pnpm -F NN-slug test` passes if the
  kickoff pack named unit tests.
- No secrets in the diff; every new key is in `.env.example`.

Owner-only checks: Part 2 of `docs/operating-modes/evals-TEMPLATE.md`, kept outside the repo.
