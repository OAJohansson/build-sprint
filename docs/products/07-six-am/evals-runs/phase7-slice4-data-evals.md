# Phase 7 slice 4, Mine / Original, plus the slice 3 polish re-check: data-evals, 27 Nov 2026

This run grades W10 and W13, and re-checks D7-17 (L294), W9 and W11. The code is 3203a4c, which
has the same app code as 6b0950f; 1e35439 adds docs only. I graded only and changed no product
code.

**Result.**
- **Pass:** W10, W13, the D7-17 fix (L294), the W9 spot check, W11.
- **Findings for the PM:** D7-19 to D7-21. The most visible is D7-20: with a Deck open on another
  song, the message still says "the Deck isn't open".

## Setup

- **Server:** a detached copy in my scratchpad, as a dev server on :3027 (sandbox, empty keys),
  with `sandbox-seed.mjs` (Mason, Lost, the worst-case map, 11 parts).
- **Browser:** my own Chrome 158 profile over CDP at 1440 × 900, with autoplay allowed and a
  network logger on every page, popup and worker.
- **Deck:** a real popup window running the SoundCloud widget (not headless), opened with the
  rebuild's own "Open the Deck" button.
- **Two in-page probes, numbers only:**
  - A BroadcastChannel logger on both the rebuild page and the Deck. It wraps `postMessage` and
    adds its own listener on `sixam-deck`.
  - My own position poller in the Deck: `SC.Widget(iframe).getPosition` plus `isPaused` every
    ~8 ms, about 120 samples per second.
- **Cleanup:** the profile and the grading copy were deleted afterwards. Nothing of the original
  was kept.

## W10: Mine / Original on a rebuild (bar: Deck position within 150 ms of the bar's start, 5/5; back to Mine at the same bar; clear message when the Deck is closed)

**My measure.** From my ~8 ms poll inside the Deck:
- **Start position:** the first position the widget reports once it is playing near the target.
- **Cross-check:** the median of (position − time) over 0.3–2.5 s of steady playback, which says
  whether the audio really ran from there.

**Run A: Studio paused on the bar line** (section head clicked, then Original). This is the eval's
case.

| Bar | Target (bar start) | My start position | Steady-play check | Product `errMs` (landing) | Product `errFirstPlayMs` | Back to Mine: Studio bar vs the Deck's bar |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | 30,574 | **+8 ms** | −21 ms | +15 | +144 | 18.317 vs 18.323 |
| 33 | 61,038 | **+10 ms** | +10 ms | +15 | +140 | 34.314 vs 34.337 |
| 41 | 76,270 | **+10 ms** | +9 ms | +16 | +166 | 42.377 vs 42.344 |
| 57 | 106,734 | **+12 ms** | +11 ms | +12 | +167 | 58.377 vs 58.348 |
| 73 | 137,198 | **+7 ms** | +9 ms | +13 | +154 | 74.311 vs 74.341 |

- **5/5 within 150 ms** of the bar's start: 7–12 ms on my measure, 12–16 ms on the product's
  landing report.
- **Back to Mine:** the Studio picks up within 0.03 bar (about 60 ms) of where the Deck was, and
  plays. 5/5.
- **Message:** "Playing the original from bar N, in the Deck" each time.

**Run B: Studio playing when switching.** The playhead was mid-bar, about 0.39 bar in, at bars 33,
41, 57, 73 and 1, plus the cold first switch at 17. The Deck started 0–6 ms from the playhead's
exact spot on 6/6. That is 770–794 ms after the bar's start: the product plays from the playhead,
not from the start of the bar (D7-19).

**Which measure is fair: `errMs`.**
- It is the position the widget gives the moment the seek lands. My independent 8 ms poll lands
  within about 5 ms of it on every switch.
- `errFirstPlayMs` is the first regular report after landing. Reports come every 100 ms and the
  original has been playing meanwhile, so it adds 140–222 ms of elapsed playback.
- That measures report timing, not where the original started. It would fail 4 of 6 of run B's
  switches and pass none of them by much, even though the start position is right to within
  about 10 ms.

**Cold first switch (D7-21).** On the session's first switch the widget reported the target at
once, but steady playback lines up about 1 s later (−989 ms). The position was right, but the
original began playing about a second after the click, while the player buffered. Later switches
had no delay.

**Deck closed.** Closing the Deck while on Original:
- after 1 s: nothing has changed yet;
- by 2.5 s: back to Mine, with the Studio paused (nothing plays by surprise). "Original" is
  disabled, titled "Open the Deck to hear the original", and the strip says "Original is off: the
  Deck isn't open. **Open the Deck** to hear the original from bar 83."
- Before any Deck was opened, the same message read "…from bar 1."
- This is clear: **pass.**

**Deck on another song (D7-20).** With Lost's Deck open (its window says "Lost in The Loop"),
Mason's rebuild ignores its reports, which is correct. But it says the same "Original is off: the
Deck isn't open", although a Deck is open. "Open the Deck" would re-point that window to this song,
so the way out works; the wording doesn't say why Original is off. The eval's bar names only "Deck
closed", so this doesn't fail W10, but the brief's "or on another song" isn't met.

**Verdict: Pass** on the eval's bar: 5/5 within 150 ms (7–12 ms), back to Mine at the same bar,
and a clear message when the Deck is closed.

## W13: only commands and numbers cross to the Deck; nothing of the original stored

**BroadcastChannel `sixam-deck`**, logged on both ends over 11 switches. Every message was
plain JSON; none was binary, and none had an array.

| From | Message | Fields | Count | Largest |
| --- | --- | --- | --- | --- |
| Rebuild page | `seek` | `{kind, cmd, ms}` | 6 | 39 B |
| Rebuild page | `pause` | `{kind, cmd}` | 6 | 28 B |
| Deck | `state` | `{kind, url, title, pos, playing, durationMs}` | 398–414 | 261 B |
| Deck | `state` with `landed` | the same plus `landed` | 6 | 276 B |

**Network:** 570 requests, 31 with a body, **0 binary**.
- `PUT /api/tracks` ≤ 2.2 KB. The rebuild now stores `grid: {bpm, originSec}` (L296) beside
  `mapId`, `sections{name, start, bars, has}` and `left`.
- `PUT /api/maps` ≤ 7.1 KB (longest array 101, per-bar levels).
- SoundCloud widget telemetry; WebSockets only Next's dev HMR.

**Storage:** localStorage holds the code, the last track id and drum edit keys (233–247 B, steps
only). IndexedDB and OPFS are empty; Cache Storage holds only the separation model.

**Code read** (a8f4d39 → HEAD): the only new `postMessage` is the Deck's landing report (numbers).
No new fetch or storage calls.

**Verdict: Pass (0).**

## Slice 3 polish re-check

**D7-17 / L294: edited rows come back exactly; untouched rows follow the new reading. Pass.**
- **Setup:** on Lost 77–84 and 21–28 I edited Kick (−1, +1) and Shaker / percussion (+4), and left
  Claps and Closed hat untouched. Then a full reload, a new Deck capture and a re-read.
- **Edited rows:** Kick and Shaker / percussion came back **identical on both loops.**
- **Untouched rows:** Claps happened to read the same. Closed hat followed the new reading: 61 → 60
  hits on loop 77, 34 → 36 on loop 21.
- **Store:** `{edits, played}` for the edited rows only.

**W9 spot check. Pass.**
- **Dimmed empty cells:** the 14 measured lanes the original lacks are dimmed (a darker fill, no
  dashed outline) and show **no text in the cell**. Their tooltip says "The original has no kick
  here. Add a part", and so does the aria-label.
- **Other cells:** 26 "has …" slots are gold and dashed; 40 unmeasured slots are blank with "+"
  on hover.
- **Count wording:** section heads read "N to fill". At zero, a wide head reads "nothing left to
  fill"; the 8-bar Breakdown head showed "none left", shortened on purpose (code comment, L295).
  The strip reads "N to fill · N filled · …".

**W11. Pass.**
- `pnpm -F 07-six-am test`: **652/652** (63 files).
- My 88 old-sound renders are **88/88 identical** to the Phase 6 base.
- `parseDoc` on my 2,000 random non-rebuild docs is **2,000/2,000 identical** to the base.

## Findings

| # | Eval | Finding |
| --- | --- | --- |
| D7-19 | W10 | Original plays from the Studio's exact playhead, not the start of the bar, while the message says "from bar N". Switching while Mine plays lands 0.4 bar (about 780 ms) into the bar. Either snap to the bar (as the eval and message say) or word the bar as "the spot you're at". PM call |
| D7-20 | W10 (brief) | A Deck open on another song gets the same "the Deck isn't open" message. It should say the Deck is playing another song, and offer to switch it to this one |
| D7-21 | W10 | The cold first switch starts at the right spot, but the audio begins about 1 s after the click (widget buffering). Later switches were immediate. Worth a "loading…" state, or pre-seeking when the Deck opens |
| – | measure | `errMs` (the landing report) is the fair W10 measure; my 8 ms poll agrees within about 5 ms. `errFirstPlayMs` adds 140–222 ms of report interval and playback |

## Not checked

- The Deck window is audible on the Mac; I couldn't check "same bar" by ear.
- Other browsers.
- A rebuild made before slice 4 (no stored grid, so it fetches the map).

## Cost and time

- No paid API calls.
- Browser session about 40 min, with 11 switches.
- Unit suite 30 s; cross-version checks under 10 s each.
