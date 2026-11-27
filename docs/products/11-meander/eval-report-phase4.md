# Eval report: Meander phase 4 (Music, the second map)

27 Nov 2026, Founder mode (L44). Every result below comes from an agent that didn't build the thing it checked. Branch `claude/11-meander-phase4-plan`.

## The question this phase asked (L43)

**Does the Meander format work beyond philosophy?** Yes, on the evidence below. The same views (globe, card, first page, timeline, Your thread) carry 33 genres with no music-only screens. A simulated house fan followed every thread asked of them. The tester said: "Clearly the same app… music actually feels more natural because I can listen."

## Agent-checkable checks

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| M1 | Every genre visible on the music globe's first load; label checks across every view | **Pass.** Music: 34 views, 185 labels, 0 past the rim, 0 overlaps, 0 over fixed elements, 0 over dots. Philosophy: 28 views, 143 labels, all 0. Knot check ok for every genre and school. | Engineer's checker, re-run by the PM after each round |
| M2 | Every genre has a tagline, 3 listen-for lines, 5 hallmarks, 3–5 artists, 3 landmark recordings, neighbours and sources | **Pass, with 1 known gap.** Validator: 0 errors on all 33 genres. Afrobeat has 2 landmark recordings, because the corpus names no third (L54). | `content/music/full.json`, validator in the scratchpad |
| M3 | Each landmark record opens a search for that recording in one click | **Pass.** 1 click from the card; the link says "YouTube search"; records credited to another act search under that act. | User test M-S2 |
| M4 | Switching Philosophy ↔ Music keeps each field's view and progress apart; a reload keeps the field | **Pass.** Separate storage keys. Each field remembers its open genre. Unit tests cover it. | User test M-S4, `fields.test.ts` |
| M5 | Content accuracy: every claim graded against the saved sources | **Pass.** Round 1: 1,561 claims, 1 wrong, 144 drift, 31 unsupported. All were fixed. Round 2 re-graded 434 claims: 0 wrong, and the remaining 16 fixes are applied. 0 invented links: all 77 links come from the research's quoted list. | `eval-pilot/grade-music-*.json` |
| M6 | Philosophy unchanged | **Pass, with listed changes.** All tests pass and the label checks are clean. It changed on purpose in: the header switcher, quieter globe edges, the sphere moved 12px down, the hover reason line, timeline link words and labels, 3 neighbours plus "N more" on the phone, and "started" in Your thread (L56, L58). | `design/phase4/r4-laptop-philosophy-*.png` |
| M7 | Phone 390×844: open a genre, play a record, switch field | **Pass.** Neighbours fold to 3 with "N more" / "Fewer". The music list is grouped by family. Targets are 44px. | `r4-phone-*.png` |

**Build hygiene:** 34 tests (7 new for fields), lint and build all pass. No secrets in the diff.

## User test (simulated, persona Sam as a house fan)

- **M-S1:** where house comes from and what grew out of it. Bar: 3 of 3 runs under 2 minutes. **Met** (50–100 s, 3–4 clicks). The re-run from the timeline first also passed the wrong-belief check: ambient now reads "fused with it", not as a parent.
- **M-S2:** hear early house. **Met** (1 click).
- **M-S3:** blues forward to a club genre. **Met:** blues → R&B → funk → disco → house, about 2.5 minutes.
- **M-S4:** two maps, one app. **Met.**
- **Jobs:** whole shape 4/5 · connected and switch 5/5 · short summary 4/5.
- **Would pay for:** real playlists of a thread and sub-genres under house (backlog, L57).

Report: `user-testing/report-2026-11-27-music.md`.

## Design critic (one critic, fixed scorecard)

| Round | Score | Clutter | Hierarchy | Legibility | Feel | Copy |
| --- | --- | --- | --- | --- | --- | --- |
| 1 (sample content) | 6 | 1 | 1 | 1 | 2 | 1 |
| 2 (real content) | 7 | 1 | 2 | 1 | 2 | 1 |
| 3 | 8 | 1 | 2 | 1 | 2 | 2 |

After round 3 I fixed the small leftovers and stopped the rounds (L58). Four gaps are left for you, because they change the globe and card design you chose and signed off:
1. Even-angle neighbour rings instead of real globe positions.
2. A new label rule for the overview.
3. Removing the "step inside" under the globe title.
4. A quieter "Study with Claude" button.

Critic notes: `design/phase4/critic.md`.

## Guardrails

| Guardrail | Result |
| --- | --- |
| No copyrighted audio hosted or embedded | Pass: links to a search only |
| No lyrics quoted | Pass: one slur-containing lyric in the trap article was deliberately left out |
| 0 model API calls | Pass: everything ran on subscription agents |
| Weekly usage guard (stop at 70%) | 51% at the last check |
| Readable text | Inactive field name 5.8:1 (was 4.3:1). The dimmest labels are deliberate de-emphasis on hover. |

## What I skipped or couldn't check

- **A preview deploy.** Vercel's free daily limit (100 deployments across all products) was used up. Review locally at http://localhost:3011, or I deploy a preview tomorrow.
- **Four 2026 deaths stated by the sources,** which postdate what I know: Dolly Parton (Aug 2026), Willie Colón (Feb 2026), Afrika Bambaataa (Apr 2026), Juan Atkins (Oct 2026). Each is stated in its Wikipedia article. Worth a glance.
- **Three dates the sources disagree on, kept as the genre article gives them:** "Strings of Life" (1987/88), Music for Airports (1978/79), "Children" (1995/96).
- **Smaller known gaps:**
  - Skrillex's EP shows as "album".
  - Three records are songs the artist wrote, not a named recording of theirs (Seeger, Dorsey, Vinicius).
  - No woman on the house, electro, trance or EDM cards, because the corpus names none.
- **Not tested:** the phone at widths other than 390, and real playback quality (whether the YouTube search finds the right recording).
- **The sources are weaker than SEP:** Wikipedia, because Grove is paywalled and Britannica refused automated reading (L46).
