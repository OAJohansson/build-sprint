# 0012 — Folio's recommender lab: Python notebooks in the app folder, committed data, results as JSON

- **Date:** 2026-10-15
- **Status:** accepted

## Context

Folio's recommendations are a learning goal in themselves: the owner wants the fundamentals of
recommender systems and their evaluation, as a skill companies hire for. That means several
approaches (popularity, content-based, collaborative filtering, a hybrid with an LLM), each scored
on the same offline eval against the owner's real reading history. The repo so far is all
TypeScript, apps are self-contained, and data lives in localStorage.

## Decision

- **Python notebooks** for the experiments, in `apps/06-folio/lab/` (inside the app, so the app
  stays self-contained), with the Python environment managed by `uv`. pnpm stays the only
  JavaScript package manager.
- **The owner's Goodreads export is committed** at `apps/06-folio/lab/data/` (owner's call: their
  reviews are public on Goodreads anyway), so anyone can rerun the eval. Public datasets
  (goodbooks-10k) are downloaded by a script, not committed.
- **The lab exports recommendations as a JSON file** the app reads. The app only shows them; it
  doesn't compute them. Marked `// shortcut:` in the code: recs only refresh when the notebook is
  rerun, upgrade to a live API route once the ladder is done.
- **Every level is scored by one eval harness**, with a time split (train on books read before
  2024, test on 2024 onwards), hit rate@10, NDCG@10 and diversity, and compared with the
  popularity baseline.

## Alternatives considered

- **TypeScript in the app:** same stack and nothing new to set up, but rec teams work in Python
  (pandas, scikit-learn, `implicit`), and the owner wants the transferable skill.
- **One LLM prompt as the recommender:** fastest, but little to learn and almost nothing to
  measure.
- **Keep the export local (gitignored):** more private, but the eval can't be reproduced from the
  repo.

## Consequences

- Python is new to the repo: a `pyproject.toml` and `uv.lock` in the lab, and notebooks in git
  (clear outputs before committing, so diffs stay readable).
- Vercel ignores the lab, since it builds the Next app only.
- The recommendations are for one user (the owner). For anyone else they need the live route
  (backlog).
- Revisit when Folio needs live recommendations, or a second user.
