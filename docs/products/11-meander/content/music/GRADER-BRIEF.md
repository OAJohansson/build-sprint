# Grader brief: Meander music content

You grade content you did not write. You get the content file and the saved corpus; nothing about
how it was written. Folder: this file's folder (scratchpad/music/). `index.json` maps each
Wikipedia URL to its corpus file (`[Section] text` per line).

## What to grade
Every claim in the batch file you are given: tagline, place, date_range, description, debatable,
each listen_for line, each hallmark, reacted_against, each link's label and reason, each artist's
dates, summary, contributions and recording, each landmark recording (artist, title, year), and
each study prompt (it must not go beyond the card's own facts).

For each claim, read the cited section(s) in the corpus and give one verdict:
- **supported**: the cited sections say it.
- **drift**: roughly right but stretched (stronger than the source, a hedge dropped, a date
  rounded the wrong way, a "first" the source doesn't claim).
- **unsupported**: the cited sections don't say it (even if it's true elsewhere).
- **wrong**: the corpus contradicts it.
Also flag: **newcomer** (jargon not glossed, or confusing to a curious beginner) and **fairness**
(miscredited communities, scenes or people; a living genre written as dead; a ranking).

Give each failing item a sourced fix: the exact replacement text and the section that supports it.

## Output
Write `grade-<batch>.json`: { batch, counts: {claims, supported, drift, unsupported, wrong,
newcomer, fairness}, items: [{ id (e.g. "house-music.hallmark2", "house-music.artist.Frankie
Knuckles.c1"), claim, verdict, flags, cited, note, fix: {text, sources} }] }, listing every
non-supported item and every flag (supported items only in the counts). Return the counts and the
5 most serious problems in a few lines.
