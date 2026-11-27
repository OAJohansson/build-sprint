# Writer brief: Meander music genres

You write learner content for genres in Meander's new Music field (a calm map you wander through;
the philosophy field is the model: docs/products/11-meander/content/full.json in the worktree
/Users/ante/Workplace/build-sprint/.claude/worktrees/11-meander shows the tone). The reader is a
curious newcomer who loves listening (house especially) but doesn't know where genres come from.

## Sources: the saved corpus only
Folder: this file's folder (scratchpad/music/). `index.json` maps each Wikipedia URL to its file
in `corpus/` (one line per paragraph: `[Section] text`; `[Infobox] field: value` lines use section
"Infobox"; the lead is "intro") and its section list. `genres.json` has each genre's chosen
artists, origin years/place and 3 landmark recordings, all sourced. `links.json` has the only
allowed links between genres. Do not use anything outside the corpus, not even what you know.
Every item carries `sources: [{url, section}]` naming the exact section(s) that support it.

## Rules
- Paraphrase in plain, warm English; gloss jargon where used ("four-on-the-floor: a kick drum on
  every beat"). No quotations longer than a few words, and never lyrics.
- Hedge where the source hedges ("is often credited", "probably"). Don't make "first"/"invented"
  claims the cited section doesn't make. Credit the communities the sources credit (e.g. Black,
  Latino and gay scenes) accurately; no rankings, no "best".
- Living genres don't end: date_range like "early 1980s – today".
- Artists: 3–5 per genre, chosen from genres.json's list for that genre (4 is ideal; include a
  woman where the corpus supports one). Use their own articles for summary, contributions and
  their one recording (one the artist article names as notable/hit/influential).
- Recordings: use the genre's landmark recordings from genres.json as given (2 if only 2 exist);
  year may be null where the corpus gives none.
- Links: write one link object for every links.json link where this genre is `from` or `to`;
  copy `from`, `to` and `kind`; neighbour = the other genre; direction "out" if this genre is
  `from`, else "in"; label 2–4 words that read right from either end ("grew out of disco");
  reason one sentence; sources (keep links.json's, add more if useful). Never add a link.
- reacted_against: a {text, sources} line only if a reacted_against link touches this genre as
  `to`; else null.
- study_prompt: a ready-to-paste prompt asking Claude for a short listening module on the artist,
  drawing only on the card's own facts; cite the sections it draws on.

## Shape (one object per genre; write a JSON array to the file you were given)
id (from genres.json), name, family (from genres.json), tagline: {text (one plain sentence, ≤ 90
characters), sources}, date_range, place: {text, sources}, description (2–3 sentences),
debatable (one line on a contested label, boundary or origin story, or null),
listen_for: [3 × {text: what you'll hear, one sentence, sources}],
hallmarks: [5 × {title (2–4 words), text (2–3 sentences), artists: [names from this genre's
artists], sources}],
reacted_against, links: [...as above, with from, to, kind, neighbour, neighbour_name, direction,
label, reason, sources],
artists: [{name, dates, summary (1–2 sentences), sources, contributions: [2 × {text, sources}],
recording: {title, year, kind: "song"|"album", sources}, study_prompt: {text, sources}}],
recordings: [{artist, title, year, kind, sources}],
further_reading: [{url, title}] (the genre's article first, then up to 2 companion or artist articles),
sources: [{url, section}] (genre level)

## Before you finish
Run `python3 -I tools/validate_full.py <your file>` and fix until 0 errors. Report the counts,
anything thin or uncertain, and the validator output. Don't paste the file.
