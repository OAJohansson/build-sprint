# Lab design handoff (final, after critic 9/10)

The owner's pick (L162): Listen = full map with Mentor notes pinned on the timeline; Make = focused
room. Prototype `apps/07-six-am/src/app/dev/lab-combined/` (`?mode=listen|make`,
`?state=first|loading|catching|empty|menu`, `?data=worst`). Screens `lab-combined/define-final-*.png`.
All copy is draft copy for the owner.

## Shared header (both modes)

1. App bar: logo, Studio / Analyse nav, settings.
2. Head: "← Songs"; track title (serif, one line, ellipsis, full on hover); artist · BPM · key.
3. Transport: play/pause (drives the Deck; disabled until the Deck is on); clock and bar
   (tabular numerals); status (aria-live) "catching up…" / "Getting ready… N%"; loop
   "⟲ {section} {from}–{to}" with × to stop.
4. Listen/Make switch (keeps `?mode=` in sync).
5. Deck status: dot + "Deck on" / "Deck off".
6. Getting ready: a 2 px gold line under the head.
7. First-visit banner: one instruction at a time, one button (Open the Deck → I've shared it /
   Cancel).
8. Solo/mute, playhead, loop, notes and the open note survive the mode switch.

## Listen

1. Ruler (46 px) = seek slider: click to seek, ←/→ ±4 bars; section buttons loop on click (short
   codes when narrow, full name in title and aria-label); bar ticks every 32 bars (64 above 300);
   loop band; playhead with head marker.
2. Chord lane (26 px), "Chords est.": a cell per 8 bars with a tooltip; names when cells ≥ 24 px,
   otherwise only the chord at each section start.
3. Four part lanes filling the height (≥ 60 px each). Gutter 200 px: left name (click to solo), S,
   M, "N layers est."; right one sub-layer name per row, 11 px. Lane: one row per estimated
   sub-layer, or the part's clips if none (no label). Soloed part in its colour; every non-soloed
   or muted lane in the same neutral at the same alpha. Loop shade; click to seek.
4. Playhead: one white line through ruler, chords and lanes; dashed while catching up.
5. Notes (soloed lane only; S2): pins in a 20 px strip above the clips, 4 px right of their bar;
   notes within 3% of the track merge into a cluster pin ("4–6"); open pin gold. "+ Ask" plain
   outlined button left of the playhead at the lane's foot ("+ Ask about the bass here" when
   empty), hidden while a card is open. Note card 420 px, role="dialog", below the soloed lane with
   a gold leader to its pin; right of the pin unless that crosses the playhead or runs out of room,
   then left; beside the pin only if the soloed lane is the last. Content: "Note N, bar B", cluster
   tabs, ×; "You: question"; answer (4 lines + Read all; expanded scrolls at 220 px with a fade);
   facts as one mono line; one reply input (Enter sends); "Make a bass like this →" (switches to
   Make). New-note card: question input + "The Mentor knows: … Not tone." Asking pins at the
   playhead bar and opens it.

## Make

1. Synth column takes the width; Mentor rail 340 px.
2. Top: "← Whole song" · "Bass alone, Drop, bars 65–128, looping".
3. Loop strip: chords, bar numbers every 8 bars, one clip row per sub-layer, playhead; grows from
   118 to 280 px with spare height.
4. Preset "Round sub ▾" (serif) opens a menu: radio items with tags as plain text, current checked,
   a rule, "Describe a {part} in words…" (Stable Audio, text and measurements only).
5. Six knobs, 96 px, spread across the column: 2 px track at 25% white; value arc in the part's
   colour, a 2 px dot at zero; gold tick where the Mentor or Suggest settings named a target; name
   and value word under each; role="slider".
6. Mentor line (12 px mono, two lines): "Mentor: Length down to 1/8, Pitch drop up. That's the
   bounce." / dimmer "Gold ticks mark those." + "Suggest settings" (local patch matching; updates
   the ticks only, never moves a knob, T85).
7. Check row above a hairline: A/B switch "A · Original {part} / B · Mine" · "same loudness".
8. Save bar at the foot: "Name" label, input "{sound word}, from {short title}", tags as one mono
   line, "Save to library" (the only gold button).
9. Mentor rail: "Mentor, on the {part} at bar B"; numbered questions with "bar N", open ones show
   the answer (6 lines + Read all) and facts; empty line "No notes yet. Ask about the bass: the
   answer is pinned at bar 97 on the map."; fixed Ask bar; 40 px end padding and a 56 px fade.

## First visit, copy

1. **Open the Deck to listen.** It plays this track from SoundCloud in a small window, and you
   hear the parts here. · [Open the Deck]
2. **In Chrome's dialog, pick the "Six AM Deck" tab and press Share.** Its sound moves here;
   nothing is recorded. · [I've shared it] · Cancel
