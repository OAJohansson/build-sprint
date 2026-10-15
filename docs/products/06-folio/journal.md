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
