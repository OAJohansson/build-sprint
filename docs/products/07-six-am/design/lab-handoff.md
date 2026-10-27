# Lab design handoff (approved, L176; option B L177; first Play L178)

The owner's pick (L162): Listen = full map with the Mentor's questions on the timeline; Make =
focused room. Prototype `apps/07-six-am/src/app/dev/lab-combined/` (`?mode=listen|make`,
`?state=first|loading|catching|empty|menu|onlybass|muted|hover`, `?data=worst`). Screens
`lab-combined/final-*.png`; all earlier screens (`signoff-r1-*`, `define-*`, `lab-combined-*`) are
superseded. All copy is draft copy for the owner.

## Shared header (both modes)

1. App bar: logo, Studio / Analyse nav, settings.
2. Head: "← All tracks"; track title (serif, one line, ellipsis, full on hover); facts line
   "{artist} · {BPM} BPM · key {key}" (the artist truncates first; BPM and key always show).
3. Transport: play/pause (drives the Deck; the first press opens it, see below); the hearing chip
   right after Play, only while you're not hearing everything ("Only Bass ×", "Only Bass, Drums ×",
   "Bass muted ×"; × = hear everything again); position
   "3:06 · in Drop 1" with a smaller "bar 97" beside it (tabular numerals; a repeated section name
   gets its number: Drop 1, Drop 2); status (aria-live) "catching up…" / "Getting ready… N%"; loop
   chip "Looping Drop 1 · 2:04–4:08 ×", shown only while a loop is on (× stops it).
4. Listen/Make switch (keeps `?mode=` in sync). It is also the way back from Make.
5. Deck status: dot + "Deck on" / "Deck opening…" / "Deck off". It's the only sign of the Deck.
6. Getting ready: a 2 px gold line under the head.
7. First Play (no banner): the first press of Play opens the Deck window and Chrome's tab-sharing
   dialog in one go, with one line under the head: "To split the parts, Six AM plays the song again
   from SoundCloud in a small window. It never keeps the audio." Then the getting-ready line; after
   that Play just plays. The map is dimmed until the Deck is on.
8. What you hear, the focus part, playhead, loop and the Mentor chat survive the mode switch.

## Listen

1. Hearing parts (option B, L177; no Hear bar, no S/M): hovering a lane's name (or keyboard focus
   inside its gutter) shows two 24 px icons after the name: headphones = hear only this part,
   speaker = mute this part. Nothing shows until hover/focus, except a lit icon, which stays:
   - Only: headphones lit gold; the other lanes dim; chip "Only Bass ×". Headphones on a second part
     = hear both ("Only Bass, Drums ×"). The lit headphones again removes that part.
   - Mute: crossed speaker lit gold and the lane dims; chip "Bass muted ×" (more parts add).
   - Only and mute are exclusive: pressing one replaces the other. × on the chip = everything.
   - Focus part (T87) = the last part heard "only" (bass to start): it carries the Mentor dots,
     "+ Ask", and Make works on it.
2. Ruler (46 px) = seek slider: click to seek, ←/→ ±4 bars; section buttons loop on click (short
   codes when narrow, full name in title and aria-label); bar ticks every 32 bars (64 above 300);
   loop band; playhead with head marker.
3. Chord lane (26 px), "Chords est.": a cell per 8 bars with a tooltip; names when cells ≥ 24 px,
   otherwise only the chord at each section start.
4. Four part lanes filling the height (≥ 60 px each). Gutter 200 px: left name (+ the hover icons)
   and "N layers est."; right one sub-layer name per row, 11 px. Lane: one row per estimated sub-layer,
   or the part's clips if none (no label). Dimming follows what you hear: parts you hear in their
   colour, the rest in one neutral at one alpha. Focus lane has a faint lift. Loop shade; click to
   seek.
5. Playhead: one white line through ruler, chords and lanes; dashed while catching up.
6. Mentor on the map (focus lane only):
   - Each question is a 9 px dot above the clips at its bar (no numbers); questions within 3% of the
     track share one 13 px dot. Hover shows the question(s); the open dot is gold.
   - "+ Ask" plain outlined button left of the playhead at the lane's foot ("+ Ask about the bass
     here" when there are none), hidden while a card is open.
   - The open dot hangs a 420 px card (role="dialog") below the focus lane, joined by a gold leader;
     right of the dot unless that crosses the playhead or runs out of room, then left; beside the
     dot only if the focus lane is the last. Content: "Mentor, at bar 97" · ×; a short chat thread
     (max 150 px, scrolls, fades; every exchange at that dot): question right-aligned in a light
     bubble with a "bar 97" tag under it (click = jump the playhead there), answer left as plain text
     (3 lines + Read all), facts as one mono line; the composer; "Make a bass like this →".
   - "+ Ask" opens the same card as "Ask about the bass at bar 97" with the composer and "The Mentor
     knows: … Not tone." Asking adds a question at the playhead bar and opens it.

## Composer (every Mentor input: Listen card, new question, Make's rail)

A textarea that grows to 4 lines; Enter sends, Shift+Enter is a new line; a round Send arrow (↑)
inside on the right, dimmed and disabled until there's text; aria-label "Send".

## Make

1. Synth column takes the width; Mentor rail 340 px. No back link (the switch is the way back).
2. Caption: "Bass alone, Drop 1, 2:04–4:08, looping".
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
9. Mentor rail = plain chat, no numbers: "Mentor, on the bass at bar 97"; every exchange in order
   (question bubble right with its "bar N" tag, answer left, 6 lines + Read all, facts); opens
   scrolled to the newest; empty line "No questions yet. Ask about the bass: the answer is also
   pinned at bar 97 on the map."; fixed composer at the bottom; 40 px end padding and a 56 px fade.

## Copy (draft)

| Where | Text |
| --- | --- |
| Head | ← All tracks · Lost in The Loop · Mason Flint · 124 BPM · key A minor |
| Transport | 3:06 · in Drop 1 · bar 97 · Looping Drop 1 · 2:04–4:08 × · catching up… · Getting ready… 42% · first time only, about 18 s |
| Switch | Listen · Make |
| Hearing | (icon labels) Hear only Bass · Mute Bass · chip: Only Bass × · Only Bass, Drums × · Bass muted × |
| Deck | Deck on · Deck opening… · Deck off |
| Gutter | Drums · 3 layers est. · kick · hats · clap · Bass · 2 layers est. · sub · pluck … |
| Map | Chords est. · section names/codes · + Ask · + Ask about the bass here |
| Card | Mentor, at bar 97 · × · What's this bass doing? · bar 97 · (answer) · Read all / Show less · A1 · 55 Hz · notes ≈ 1/8 · off the kick · −11 LUFS · Reply about bar 97… · Make a bass like this → |
| New question | Ask about the bass at bar 97 · What's the bass doing here? · The Mentor knows: Bass alone, Drop 1, bar 97; pitch, timing and loudness. Not tone. |
| Make | Bass alone, Drop 1, 2:04–4:08, looping · chords est. · bars · sub est. · pluck est. · Round sub ▾ · Tone dark · Length 1/4 · Pitch drop slow · Drive clean · Wobble off · Width mono · Mentor: Length down to 1/8, Pitch drop up. That's the bounce. · Gold ticks mark those. · Suggest settings · A · Original bass · B · Mine · same loudness |
| Preset menu | Round sub (sub · clean) · Rubber pluck (short · bouncy) · Reese (wide · dark) · Acid line (squelchy · resonant) · Describe a bass in words… |
| Save | Name · Rubbery bass, from Lost in The Loop · bass · A minor · 124 BPM · Lost in The Loop · Save to library |
| Mentor rail | Mentor, on the bass at bar 97 · No questions yet. Ask about the bass: the answer is also pinned at bar 97 on the map. · Ask about the bass… · Send |

## First Play, copy

To split the parts, Six AM plays the song again from SoundCloud in a small window. It never keeps
the audio.
