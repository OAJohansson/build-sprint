# Kickoff addendum: v1.1, sync between phone and laptop

Founder-mode phase opened 26 Oct by the owner's call (L27). Builds on `kickoff.md`; everything
there still holds except the "one device, no backend" no-go, which this phase lifts.

## Problem

I've been logging Wont on the laptop since 24 Oct. On the phone the app is empty, and there is no
way to get my history there: everything lives in one browser's localStorage. My morning tap
happens on the phone, my evening review often on the laptop, so one device means two half-records.

## MVP

- The same habits and logs on phone and laptop, through the shared Supabase project (decision
  0021 pattern), unlocked by an access code typed once per device.
- Local-first: every tap saves to the device at once and syncs in the background; offline taps
  sync when the network is back.
- First connect uploads the device's existing history; nothing local is ever wiped by an empty or
  older server.
- One quiet way in: a footer link to a "Sync" screen in the existing form style. No other UI
  changes; design, copy and day logic stay as shipped.

## Stop line

No accounts, no sharing, no real-time push between devices (sync on open, focus, after a tap and
every minute is enough), no sync history or conflict UI. Two devices editing the same habit-day
offline: the later tap wins (L28).

## Riskiest assumption

**No data is lost on first sync.** The laptop holds the only copy of the real history; a merge bug
that lets an empty phone or empty server win would erase it. Tested first, with unit tests on the
merge and a two-device user test (laptop with history + empty phone).

## Requirements and checks

| # | Requirement | Check (agent) |
| --- | --- | --- |
| S1 | Connecting a device with history to an empty server keeps all of it and uploads it | Unit test (merge with empty) + user test: laptop seeded, connect, history unchanged, server row holds it |
| S2 | A second, empty device that connects shows the same habits and history | User test: phone context connects, board and 14-day history match the laptop |
| S3 | A tap shows at once and never waits for the network | User test: tap with the network off shows kept at once; no spinner |
| S4 | Offline taps sync once back online | User test: tap offline on phone, go online, laptop shows it after focus/refresh |
| S5 | Conflicts merge per habit and day: the later change wins; undo and delete carry over (no resurrection) | Unit tests: later wins, tombstones win over older, equal-time ties keep data |
| S6 | Only server routes hold the Supabase secret; the browser never sees it; wrong code is refused | Code read + `curl` with a wrong code → 401 |
| S7 | Graders use a sandbox code and data, never the owner's | Rows keyed by space (`owner` / `sandbox`); tests only with `SANDBOX_ACCESS_CODE` |
| S8 | Shipped day logic, copy and design unchanged; existing tests still pass | `pnpm -F 09-wont test`, `build`, `lint`; visual diff of the board |

## Owner-only (final review)

Connect the real laptop first, then the phone, and see the history on both.
