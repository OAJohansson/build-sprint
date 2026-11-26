# Existentialism pilot: content grade (25 Nov 2026)

Graded on the subscription only (L22). The graders were fresh agents that never saw the writing; their only evidence was the saved source text. Source copies live in the git-ignored `apps/11-meander/.corpus/existentialism/` (11 sources: 7 SEP, 3 IEP, OpenStax §12.3; Britannica blocked automated fetching).

| Round | Items | Claims | Supported | Drift | Unsupported | Wrong | Items failing |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 (two graders, 13 + 15 items) | 28 | 141 | 137 | 4 | 0 | 0 | 4 |
| 2 (fresh grader, the 10 changed items) | 10 | 51 | 51 | 0 | 0 | 0 | **0** |

- **Second grader (reliability check):** re-graded a random 8 items, which agreed on 7 of 8. Item overview.0 passed for the second grader and failed (drift) for the first, so the stricter verdict was kept and the item fixed. All quotes match word for word in both.
- **Hand spot-check (me):** 6 random passed claims checked against the source text, 6/6 hold.
- **Notes kept, not failing:**
  - "Sartre argued … the look": the SEP credits Sartre and Beauvoir together.
  - "Opened a whole field of research" is slightly stronger than the IEP's "legitimising a whole domain".
  - Heidegger "rejected the label": strictly, he repudiated Sartre's existentialism.

Files: `grade-batch-a.json`, `grade-batch-b.json`, `grade-sample-second.json`, `grade-round-2.json`, `changed-round-1.json`.

## Apply it to your life (26 Nov, L25)

There are three practices, about 550 words, built on 5 new sources: Sartre's lecture, Nietzsche's *Gay Science* §341, two Frankl institutes and the Vos 2015 abstract. Each "try this" is checked for **attribution** as well as facts: either the source itself proposes the step (*proposed*), or the text clearly labels the step as our application of the source's idea (*bridged-labelled*). A step that reads as if the source proposed it, when it doesn't, fails (*misattributed*).

| Round | Grader | Claims | Supported | Drift | Unsupported | Wrong | Misattributed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | A, all items (`grade-apply-a.json`) | 48 | 39 | 7 | 1 | 0 | 1 |
| 1 | Second grader, 3-item sample (`grade-apply-second.json`) | 27 | 22 | 4 | 1 | 0 | 0 |
| 2 | Fresh grader, 6 changed items (`grade-apply-round-2.json`) | 39 | 35 | 4 | 0 | 0 | 0 |
| 3 | Same grader, 3 edited items (`round3` in the same file) | 18 | 18 | 0 | 0 | 0 | 0 |

- The two round-1 graders found the same main problem independently: the Frankl step read as a logotherapy exercise, and the meta-analysis sat next to it as if it backed the exercise.
- Fixed: the step is labelled "one way to borrow that on your own". The evidence line now says it is "evidence for therapy, not for reflecting alone".
- Hand spot-check: 6 of 6 quotes found word for word in the saved sources, and the three questions map onto the institute's three avenues.
- Known soft point: the Frankl card cites a meta-analysis that pools "meaning therapies" and doesn't name logotherapy. The text doesn't claim it does.
- Dropped: the School of Life (its essays are behind a membership paywall, so there is nothing to cite) and a fourth practice (no readable source proposes one).
