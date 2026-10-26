# User test: follow-up PR (Play all, bar 1, proper case, one-request load, Studio), 2026-10-26

Simulated (user-tester), same persona, test sandbox, branch `claude/07-six-am-followup-3746ad` @
7644753, Chrome at 1440/1280/1024, $0 AI, no capture. Screenshots in `shots-2026-10-26-followup/`.

**Scores:** Studio "make a track" 4/5 · Play all 4/5.

Pass: Play N with a filter (skips preview-only and says so, row click jumps, hand-off to the next
track, Stop); saved tracks open at bar 1; proper-case sections; one request on a returning load
(first visit also creates "My first track"); a short track from crate + drawer, saved and reloaded;
no overflow at 1280/1024; keyboard (tab order, blocks ←/→/Shift/Delete, crate Enter, knob arrows,
Space). PR 86 items on screen: lit S 5.38:1, selected silenced block 11.11:1, Add as a new sound
says where it landed.

**Major M1:** on a Rhodes block, picking Pad changes every block of that sound, so "Add as a new
sound" afterwards leaves two Pads and the Rhodes is gone.

Minors: Play-all strip truncated at 1440; no "Finished" at the end of the list; blank widget while
a track loads; first visit sends two requests; a blank track shows no key; Pad's default pattern
is "Rhodes Nines"; keyboard block moves not explained, knob lacks a spoken value; crate names wrap
at 1024; Studio ruler numbers 2.40:1.
