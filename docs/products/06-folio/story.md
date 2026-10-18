# Interview story: Folio

Written at wrap-up (playbook step 4), from the brief, feedback and retro. STAR, tellable in about 2 minutes.

**Headline:** I built a book tracker with a personal recommender. I designed the eval before any
model, set the bar in advance, and used it to pick an LLM over a classic method, for about $1.20
of test runs.

**Themes:** Metrics · Trade-offs · Working with AI · Technical · Prioritisation

## In 30 seconds

Folio replaces Goodreads for me: a calm shelf with one-line reviews, filled from my Goodreads
export, and 10 picks with a reason each. Before building any recommender I built an exam on
10,000 real readers and wrote down the bar a model must clear. A classic method (TF-IDF) beat a
bestseller list 2.3×. An LLM tied it on strangers, but found 7 of my own 48 liked books where the
classic models found none, so the LLM ships. Every number has a confidence range, and I said
plainly which part of the bar wasn't proven.

## The story

**Situation.** My reading history sits in Goodreads, which feels dated and recommends books that
miss my taste. I wanted a shelf I'd enjoy logging to, and recommendations I'd trust. I also wanted
to learn how recommenders and AI evals really work, on a 20-products-in-20-days sprint.

**Task.** Ship the app, then a recommender that beats a popularity baseline. I'd know it worked by
an offline exam, plus my own judgement of its top 10.

**Action.**
- **The exam first.** My own shelf was too small to score on: one lucky guess moved the result by
  a third. So I used 10,000 goodbooks readers. For each one I hid their latest liked book and
  checked whether a model's top 10 found it. My shelf stayed as a personal check.
- **The bar in advance.** I set it before seeing any result: NDCG@10 above bestsellers', regret no
  worse, at least 10× the catalogue coverage, guardrails, and "I'd save one of its picks".
- **TF-IDF on Goodreads tags.** It cleared the numbers, but 70% of its hits were sequels, and it
  couldn't see books after 2017. That ruled out 32 of my 48 liked books.
- **The cut.** On day 4 I stopped the planned ladder and made an LLM the MVP. The reason was the
  problem, not the technology: my books are newer than the dataset, and I wanted to learn evals.
- **The LLM's exam.** Claude names books; code matches them to a catalogue and drops owned,
  repeated and made-up ones. I measured the raw error rates separately. To keep the cost down, the
  cheap model took the full exam and the expensive one only my 48 books, at half price in batch:
  about $1.20 instead of $13.

**Result.**

| | Bestsellers | TF-IDF | Haiku | Opus |
| --- | ---: | ---: | ---: | ---: |
| NDCG@10, 500 readers | 0.009 | 0.025 | 0.025 | not run |
| My 48 liked books found | 0 | 0 | 3 | 7 |

- Opus put *Circe* first right after *The Song of Achilles*.
- About 0.5% of the books it named were invented.
- Live in Folio at about $1.50 a month.
- I'd read *Klara and the Sun* from its picks. That's below my own target of 3 new books out of
  10, and I said so.

**What I learned.** An LLM's list always reads well; only a fixed exam tells you whether it's
better, and the cost question belongs inside the eval.

## Assumptions: what I believed vs what was true

| I assumed | Turned out | How I found out |
| --- | --- | --- |
| 70% of my liked books are in goodbooks | 33% (16 of 48) | Matching the export to the dataset |
| I can score models on my own history | Too few test books (about 3 dated recent reads) | Counting the test set |
| A modern LLM beats a 1970s method easily | It tied on strangers; it won on me | The same exam for both |
| The hallucination check was right | It flagged real books with long subtitles | Reading its "made up" list by eye |
| More picks I'd like means a better recommender | The right book can be wrong for now ("a long commitment") | My own look at the live picks |

## Likely follow-ups

- **Why NDCG and not accuracy?** Order matters (the first pick gets most attention), and a 5★ hit
  is worth more than a 4★ one.
- **Isn't the LLM cheating, having read Goodreads?** Possibly: data contamination. That's one
  reason the owner level is only a check, and why "item 1 unproven" is reported.
- **Why not Opus on all readers?** About $14. The cheap model answered the question first; Opus is
  the next run if the choice is challenged.
- **What would you do next?** Online evaluation (what I save and finish), always 10 picks, length
  and mood as signals, and a hybrid with collaborative filtering.

## Theme prompts

One line per theme where this product has a real example; leave the rest empty.

- **Discovery:** *Where did the real problem turn out different from the request?* The most
  frequent moment is mid-chapter (a word, an idea), not between books; I chose to start after
  reading, to learn recommenders first.
- **Prioritisation:** *What did I decide not to build, and why?* Embeddings, collaborative
  filtering and the hybrid. An LLM shipped sooner and taught evals.
- **Metrics:** *How did I know it worked? Which number moved?* NDCG@10 0.010 → 0.023 (TF-IDF, 10k
  readers); my 48 books 0 → 7 found (Opus).
- **Failure:** *What did I get wrong, and what did I change because of it?* The four-day ladder was
  too big for the sprint; the hallucination checker gave false alarms; the deploy rule skipped my
  build.
- **Ambiguity:** *Which decision did I make with incomplete information, and how did I reduce the
  risk?* Choosing Opus on 48 cases with wide ranges: I reported the ranges and possible
  contamination, and named the next test.
- **Trade-offs:** *What did I give up to get something else?* $1.50 a month for Opus over $0.05 for
  Haiku, for 7 vs 3 of my books found; a static file vs live picks.
- **Craft:** *Which detail made it feel great to use?* "Because you loved *When Breath Becomes
  Air*": every pick says why.
- **Technical:** *What technical problem did I solve, and how would I explain it simply?* A fair
  exam for recommenders: hide each reader's latest favourite and see who finds it.
- **Working with AI:** *What did AI do well, and where did I have to correct or overrule it?*
  Claude built and coached. I pushed back on cost ("is this step necessary?"), which cut the bill
  10×, and on scope when the ladder ran long.
- **Speed:** *How did I ship fast without lowering the bar?* Cut to an MVP but kept the eval:
  smaller model list, same exam, honest bar check.

**Evidence:** `apps/06-folio/lab/results/` (results, LLM errors, hallucination check), decisions
0017 and 0018, journal 17–18 Oct.
