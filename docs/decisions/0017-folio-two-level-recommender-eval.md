# 0017 — Folio's recommender eval: thousands of goodbooks readers, plus the owner's shelf as a check

- **Date:** 2026-10-18
- **Status:** accepted (replaces the eval paragraph of decision 0012)

## Context

Decision 0012 planned to score every recommender on the owner's history alone, with a time split
(train before 2024, test from 2024). That leaves about 3 test books (19 of 65 read books have no
date read, and only 3 dated reads are from 2024): one lucky guess swings the score by a third,
so it can't tell two models apart. Only 16 of the owner's 48 liked books are in goodbooks-10k.

## Decision

Designed with the owner, 17–18 Oct (journal):

- **Two levels.** (a) 10,000 goodbooks readers with at least 10 liked books (fixed seed), for
  numbers with tight confidence ranges; (b) the owner's 48 liked books, each hidden in turn with
  only the shelf from strictly before it visible, as a personal check, reported as "the 16 in
  goodbooks" (fair to the model) and "all 48" (the real experience).
- **Liked = 4–5★**; NDCG gain = stars − 3, so 5★ = 2 points, 4★ = 1.
- **Leave-last-out by file order** (goodbooks' ratings are in time order; verified): hide each
  reader's last liked book (headline) and, in a second run, the last 5. The reader's future is
  removed from training.
- **K = 10**, Folio's number of picks. Headline: **NDCG@10, hide last 1.** Also hit rate, MRR,
  recall, a 5★ slice, regret (of picks the reader went on to rate, the share rated 3★ or
  lower; hide-5 run only), coverage, novelty, top-100 share, author spread; 95% bootstrap ranges.
- **Guardrails** stop the exam: exactly 10 books, no duplicates, all in the catalog, none on the
  reader's shelf. No quality floor (owner: keep polarising books).
- One interface (`fit`, `recommend`), one `evaluate()`, and `results/results.md` gets a row
  per model and run.

## Alternatives considered

- **Owner's shelf only (0012):** most personal, too few test books to rank models.
- **Random hold-out for goodbooks readers:** needed if there were no order; slightly optimistic.
- **Sampled metrics** (rank the hidden book among 100 random ones, as many papers do): fast and
  flattering, but shown to mislead (Krichene & Rendle, 2020). We rank the whole catalog, so our
  numbers are lower than many papers' and comparable only with full-ranking results.
- **Amazon Reviews 2023:** fresher, but buyers aren't readers and the data is messier. Kept for later.

## Consequences

- Every model gets a comparable row; the bar after step 1 is bestsellers' NDCG@10 0.010
  (0.008–0.011), regret 31%, coverage 0.6%.
- Other readers' ratings after a reader's cut-off stay in training (standard, slightly optimistic;
  marked `shortcut:` in `splits.py`).
- The owner's check can catch a model that's bad for the owner, not rank close models; 32 of the
  48 books can't be found from goodbooks' catalog. Revisit when the catalog grows beyond goodbooks
  (content and AI steps) or when Folio's own usage gives an online eval.
