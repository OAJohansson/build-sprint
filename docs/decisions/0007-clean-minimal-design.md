# 0007 — Clean and minimal design, for every product

- **Date:** 2026-10-07
- **Status:** accepted

## Context

On CrossFit Log, the Home "This week" card had three ticked dots *and* a subtitle saying
"1 of 3 days · 2 more days to start a streak". The owner noticed the text only repeated what the
dots already showed, and pulled focus from them. There was also a real gap: before a first streak,
nothing hinted that a streak existed at all.

## Decision

- **CrossFit Log:** drop the subtitle. The card is "This week", the dots and a streak badge. The badge
  is always shown: muted "0 weeks" until a streak starts, orange after (the pattern streak apps
  like Duolingo use). "weeks" stays next to the number so a bare "0" isn't ambiguous.
- **All products:** a design principle in the playbook. Every element has to earn its place. Don't
  repeat in words what the visual already shows; make a feature discoverable with one quiet cue
  rather than a sentence explaining it.

## Alternatives considered

- Keep the subtitle as a nudge ("1 more day keeps your streak going"). Motivating, but it's a
  second message competing with the dots.
- Hide the badge until the first streak. Cleaner at the start, but people wouldn't know the
  streak exists.
- A bare flame and number ("🔥 0"). Most minimal, but "0" could mean days or sessions.

## Consequences

Screens get calmer and the main visual carries the meaning. Watch for the opposite failure: if a
visual isn't obvious on its own (a real user hesitates), add the smallest label that fixes it,
not a sentence.
