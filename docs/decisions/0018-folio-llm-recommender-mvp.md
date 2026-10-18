# 0018 — Folio's MVP recommender is an LLM (Claude Opus 5.5), checked by code and by the exam

- **Date:** 2026-10-18
- **Status:** accepted (changes step 2 of the recommender plan in decisions 0012 and 0017)

## Context

Step 2 of the recommender ladder was a content model: TF-IDF on Goodreads shelf tags, then
embeddings. TF-IDF passed decision 0017's numbers (NDCG@10 0.023 vs bestsellers' 0.010 on 10,000
readers), but it found 0 of the owner's 48 liked books. It can only see goodbooks' 2017
catalogue, and 32 of those 48 books aren't in it. The sprint also needed Folio wrapped up, and
the owner wanted to learn AI evals.

## Decision

Owner, 18 Oct:

- **Folio's picks come from Claude Opus 5.5.** `/api/picks` sends the shelf (the latest 100 rated
  books with stars, the latest 40 want-to-reads) and asks for 15 books as JSON. Code then drops
  anything on the shelf, anything repeated, and anything Open Library doesn't know, and shows the
  rest with "Because you loved X". Results are cached per shelf for a week, so the picks change
  when a book is logged.
- **The same prompt took the exam in the lab** (`lab/folio_lab/llm.py`; keep the two in step).
  To keep the cost to about $1.20: Haiku 5.5 on 500 readers, and Opus and Haiku on the owner's 48.
- **TF-IDF and bestsellers stay as the baselines.** Embeddings, collaborative filtering and the
  hybrid go to the backlog.

## Results behind it

| | 500 readers, hide 1 | 500 readers, hide 5 | Owner's 48 found | Regret |
| --- | --- | --- | ---: | ---: |
| Bestsellers | 0.009 (0.003–0.016) | 0.019 (0.012–0.026) | 0 | 29% |
| TF-IDF tags | 0.025 (0.014–0.036) | 0.035 (0.027–0.044) | 0 | 22% |
| Haiku 5.5 | 0.025 (0.014–0.038) | 0.040 (0.032–0.050) | 3 | 23% |
| Opus 5.5 | not run (cost) | not run | **7** | 8% (owner's) |

Raw LLM errors (Haiku, readers): 7% of named books already on the shelf; about 10% not in the
catalogue, of which roughly 1 in 20 is made up.

**The bar (decision 0017), checked honestly:**

- **Item 1 is not proven on the 500-reader sample.** Haiku's hide-1 range overlaps bestsellers',
  though hide-5 is clearly above.
- **Items 2–4 pass:** regret 23%, coverage 15.8% with novelty 4.9, guardrails enforced in code.
- **Item 5 passes:** the owner would read *Klara and the Sun* from the live picks.

The model was chosen on the owner level, where only the LLM can see all 48 books. That level has
wide ranges (Opus NDCG 0.029–0.181) and possible data contamination.

## Alternatives considered

- **TF-IDF's picks as a static file:** about an hour and free to run, but blind to books after
  2017 and to most of the owner's taste.
- **Live TF-IDF in the app:** about half a day, with the same catalogue limit.
- **Haiku in the app:** about $0.05 a month against Opus's roughly $1.50, but it found 3 of the 48
  where Opus found 7. The owner chose Opus.

## Consequences

- A paid API key (`ANTHROPIC_API_KEY`) on the server; one call each time the shelf changes.
- Home can show fewer than 10 picks when too many are filtered out (8 on the first run; backlog).
- Opus's reader-level score is untested; run it (about $14 in batch) if the choice is questioned.
- Prompt changes need a rerun of the exam. Cached prompts make unchanged reruns free.
