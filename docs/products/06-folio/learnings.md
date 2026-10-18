# Learnings

What building this product taught me.

- **Build the exam before the model.** Every recommender sounds convincing; a fixed exam with a
  bar set in advance turned "better" into a row in a table.
- **Measure, don't assume.** I guessed 70% of my liked books were in goodbooks; it was 33%. That
  number moved the exam from my shelf to 10,000 readers, and later made the LLM the obvious MVP.
- **An LLM's list always reads well.** Only the exam showed Haiku merely ties TF-IDF on strangers,
  while Opus finds 7 of my 48 books where the classic models found 0.
- **The model isn't the system.** Code around the LLM drops owned, repeated and made-up books, and
  the first hallucination check flagged real books because of subtitles: the checker needed
  checking too.
- **Cost is a product decision.** About $1.20 of batch runs replaced a $13 plan; the cheap model
  ran everywhere and the expensive one only where it mattered.
- **The right book can be the wrong pick for now.** *A Little Life* is my taste but "a long
  commitment": length and mood are signals the recommender can't see yet.
- **Nobody may lose a book on import.** A merge is destructive, so strict matching (precision)
  beat a looser search that "found" the wrong books.

## Retro

**Numbers:**
- **Time:** planned about four days (a ladder of four recommenders); actual four days, 15–18 Oct.
  The app took days 1–2; the recommender took days 3–4 and stopped after two classic models plus an
  LLM, cut at an MVP checkpoint.
- **PRs:** #33 and #34 for the app; the recommender was committed locally and merged straight to
  main.
- **Bugs and who found them:**
  - Owner: the import message read as 15 lost books; Remove was the only way off a shelf.
  - Claude, while writing tests: reviews and custom shelves were silently dropped on import.
  - Unit test: bestsellers could run out of books.
  - Claude: the hallucination checker missed real books, and the deploy rule skipped Folio's build.
- **Cost:** about $1.20 of Claude API for the exam; about $1.50 a month for live picks.
- **Unit-test pick:** the import's field tests and the eval's metric tests (worked by hand) both
  caught real bugs.

**Keep**
- An eval before any model, with a bar written down before the results.
- Asking "is this step necessary?" before spending money, and getting a cheaper plan out of it.
- Cheap model first, batch calls and a disk cache for evals.

**Change**
- The four-day ladder was too big for a 20-in-20 sprint. Cut to an MVP that ships first, and put
  the ladder in the backlog from day one.
- The simulated user test never ran. Run it on the app before the recommender work starts.

**Try next time**
- When a product has a learning goal (here: recommenders), name the smallest version that
  teaches it in a day (here: an LLM plus one baseline on one exam).

**What surprised me**
- A 1970s method (TF-IDF) tied a modern LLM on strangers' reading histories.
- The LLM corrected itself *inside* a book title ("Homo Faber... no: The Silent Patient").
- Vercel's "skip unchanged apps" rule looked only at the last commit.

**Growth**
- **A (product):** a recommender is judged on the user's real next choice. "Would I read it?"
  includes *now*, not just taste.
- **B (product craft):** pre-registering the bar, then reporting honestly that item 1 wasn't
  proven, made the decision easier to defend, not harder.
- **C (technical):** TF-IDF, NDCG, leave-last-out splits, bootstrap ranges, the Batch API,
  structured outputs, and hallucination checks.

**Process changes carried forward** (logged in `docs/learnings.md`)
1. Ship keys to Vercel as Sensitive (`ship.mjs`), and skip a build only if the app is unchanged
   since its last deploy (`vercel.json`, decision 0016 update).
2. Playbook: when a product has a learning ladder, set the MVP cut before starting it. The first
   rung must ship on its own; the rest of the ladder starts in the backlog.
