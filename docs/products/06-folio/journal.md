# Journey

What happened, what was decided and why. Newest last.

## 15 Oct: discovery and framing

- **The request:** an app to track books read, save books to read and recommend what's next; later
  a reading community, quick word definitions (the owner is a non-native English speaker), and
  notes and ideas while reading, all in one app. Goodreads feels clunky and old; the owner wants
  something modern and minimal, like Letterboxd.
- **Coaching: five jobs, not one product.** Claude split the idea into jobs by moment and
  frequency: remember what I read, decide what's next (both every few weeks), discuss with others
  (occasional), and understand words and take notes while reading (every session). Pushback:
  "holistic, all in one" is positioning, not a problem; a nicer UI alone is a weak reason to leave
  Goodreads (Moesta's switching forces), since StoryGraph, Literal and others are already modern.
  The differentiated edge looked like the while-reading moment. Community goes to the backlog:
  it needs other people (cold start) and a backend, so it can't be tested in a day.
- **Owner's answers:** reads **paper books** (so the word-lookup gap is real: no built-in
  dictionary), opens it most **in bed, mid-chapter**, and the biggest annoyances are dated UI,
  missed recommendations, nothing while reading, and **reviews too long to scan**: wants a
  one-sentence review on the overview with an optional paragraph behind a click.
- **Decision (owner): start after reading,** with search, shelves, half-star ratings, short reviews
  and recommendations, *because the owner wants to learn to build a recommendation system and
  evals*. A legitimate viability choice (Cagan's "does it work for me?"), logged as a known
  tension: the daily moment (in bed, mid-chapter) arrives in v2.
- **Name: Folio. Ratings: half stars.**
- **Teaching: recommendation fundamentals.** The owner asked to learn the field, not just get a
  build: popularity, content-based and collaborative filtering; the multi-stage shape companies
  run (retrieval, ranking, re-ranking; YouTube 2016); how Spotify's Discover Weekly blends them;
  where LLMs fit (embeddings, re-ranking, explanation, judging); offline metrics (hit rate@k,
  NDCG), beyond-accuracy (diversity, novelty, coverage), online A/B tests, and "always beat a
  baseline". Correction: a Goodreads export doesn't *train* Claude; it's the taste profile and,
  more valuable, the ground truth for offline evals. goodbooks-10k supplies the other readers
  that collaborative filtering needs.
- **Re-cut, said out loud:** this is no longer a one-day product. **Owner chose a multi-day
  ladder** (about four days): day 1 the app and import, then baseline and eval harness,
  content-based, collaborative filtering, hybrid with an LLM, each scored on the same eval.
- **Owner: experiments in Python notebooks** (the industry standard, a job skill) and **commit the
  Goodreads export** to the public repo for a reproducible eval. Recorded in decision 0012.
- **Setup snag:** PR 33 (Mallow wrap-up, code habits, Vitest in the starter) wouldn't merge
  because of a conflict in `docs/todo.md`: main had job items copied back in by the Job Coach
  sync; the PR points to Focus instead. Kept the Focus link (AGENTS.md: Focus is the single
  source), pushed, and cut Folio on top of the PR branch so it includes Vitest.

## 15 Oct: the Goodreads export

- **Owner exported their library** (macOS wouldn't let Claude read Downloads, so the owner moved it
  to `apps/06-folio/lab/data/`). Checked before committing to the public repo: no private notes,
  reviews or spoilers, so it's safe.
- **What's in it:** 352 books, 65 read and 287 want to read. Ratings only 3–5 stars. 46 read books
  have a date read, the last in 2024.
- **Eval redesigned:** a date-read split would test on 3 books, so the harness uses leave-one-out
  on 4–5-star books and a split on date added, which includes want-to-reads. Coaching point:
  want-to-read is *implicit feedback* (an action that shows intent) versus *explicit feedback*
  (a rating); most real recommenders run mostly on implicit signals.
- **Rating skew:** with no 1–2 stars, 3 stars is the "didn't love it" signal; treat 4–5 as liked.
- **Correction (owner, with screenshots):** Claude first read "no date read after 2024" as "the
  history stopped in 2024". Wrong: the owner's 2025–26 reads (*Four Thousand Weeks*, *When Breath
  Becomes Air*, *On Connection*, *Mindset*…) are all in the export, just without a date read;
  Goodreads only fills it when set by hand. Lesson: check a conclusion about the data with the
  person who made it before building on it. *Date added* is the fallback date (except for the
  bulk-added rows of 2018 and 2021).
- **Quirks found:** *Fellowship of the Ring* on both shelves (two editions); *Mindset* read but
  unrated, while a 3.5 sits on a want-to-read edition, likely the rating meant for the read book.
- **Mindset (owner):** the 3.5 is the rating for the edition they read. Fixed without touching
  the export: `apps/06-folio/lab/data/corrections.json` lists owner-confirmed merges (Mindset,
  Fellowship), which the lab applies on load. The app's import gets a general rule instead: rows
  that resolve to the same Open Library work merge, read wins, and a rating on either row is kept.
  Practice: keep raw data exactly as it came, and apply fixes in a separate, explained step.

## 16 Oct: prototype round 1, the shelf

- **`/prototype` on the shelf screen** (the main screen for jobs 2 and 4), three directions on
  the owner's real shelves (24 most recent read, 18 want to read), behind a picker at
  `/prototypes/shelf`. The one-liners and two long reviews are **sample text** written for the
  prototype; the export has no reviews.
  - **Wall** (axis: covers first): Letterboxd's 3-column grid with half stars; the one-liner and
    the full review open in a bottom sheet. Wins on looks and density; costs a tap per opinion,
    so "say what I thought of three books" isn't possible without tapping.
  - **Diary** (axis: time-ordered text): month headers, small cover, title, stars, the
    one-liner cut to one line; tap a row to open the full review in place. Scans fastest; looks
    the least like a book app.
  - **Lines** (axis: the opinion as the hero): each one-liner set large in a serif, the book as
    its caption; books without a line fall into a small cover grid at the end. The most personal;
    only works if one-liners get written, and a fresh import has none.
- **Found while building:** Open Library has covers by ISBN for only about half the books (9 of
  18 on want to read), and many slowly (each redirects to archive.org, about 1.6 s). Some are
  library scans. So the import's title-search fallback is required, not optional, and the
  typographic fallback cover is part of the design.

## 16 Oct: a design-session skill (side quest)

- **Owner's request:** turn Anshu Chimala's article "How to turn your AI into a world-class
  designer" (Lenny's Newsletter) into a skill we use together; owner's first skill, so Claude
  walked through how skills work (a `SKILL.md` with a name and description; project vs personal;
  automatic vs called; a skill runs here, a subagent gets a fresh context).
- **Built:** `/design-session` (Discover, Define, Deliver with owner checkpoints), the
  `design-critic` subagent on Fable, a seed script and our own AI-tells list. Defaults taken
  while the owner didn't pick: full process, no image or video generation, critic on Fable,
  only when called. Decision 0013. Renamed from `design` because another installed skill already
  had that name.
- **Smoke test on the Diary prototype:** 6/10. Top gaps: stars next to the title cut titles
  short; one-liners clamped to one line, so no opinion is readable; missing covers read as
  broken; all-caps month headers feel templated; an unexplained "+"; gold stars are the loudest
  thing on screen. Useful input for the shelf pick.

## 16 Oct: prototype round 2, the owner's picks combined

- **Owner's picks:** **Diary** for Read, with clearer month headings to separate sections;
  **Wall** for Want to read, but smaller covers with readable titles, so it *feels like looking
  at a bookshelf*.
- **Scope widened (named, per the playbook):** the owner asked for recommendations in the
  prototype, two tabs (**Home** and **Shelf**), and a Home of three rows: **New releases**,
  **Popular this month**, **Folio's picks**, plus a **mascot**, a cute library animal with
  glasses (inspired by Duolingo), next to the name. The recommendations screen moved up from
  day 2 as UI only, with sample picks. New releases is new scope, but cheap: Open Library
  lists exist.
- **Built at `/prototypes/folio`** (round 1's `/prototypes/shelf` deleted):
  - **Read:** month headings now large sentence case with the year muted, a count and a
    hairline. Two of the critic's notes applied: titles wrap instead of being cut by the stars
    (stars moved to the author line), one-liners show two lines, the "+" mark is gone.
  - **Want to read:** four covers per row, titles under each, every row standing on a hairline
    "ledge". The shelf feel is evoked by rhythm and baseline, not drawn wood. Tap opens a sheet.
  - **Home:** three horizontal rows. *Popular this month* is Open Library's real trending list;
    *New releases* is real 2026 English releases by reading-log count; *Folio's picks* are hand
    picked samples with a "Because you loved…" reason.
  - **Mascot:** Folio, a small static owl with round glasses holding a green book, next to the
    name.
- **Teaching moments:**
  - **Popular and new are popularity recommenders,** the same for everyone. They're
    mostly romance and self-help, not the owner's taste, which is exactly why the personal row
    must beat them on the eval.
  - **Half of Claude's first-guess picks were already on the want-to-read shelf** (*Shuggie
    Bain*, *Inspired*, *Range*, *The Song of Achilles*, *Continuous Discovery Habits*, *On Earth
    We're Briefly Gorgeous*): a good sign for taste, and proof that the "not already on my shelf"
    filter is needed.
  - **Cover quality varies:** one library scan shows a "Withdrawn from collection" sticker.
- **Open questions for the owner:** where adding a book (search) lives with only two tabs; Home
  order (personal picks first or last); star colour (the critic found gold too loud).
