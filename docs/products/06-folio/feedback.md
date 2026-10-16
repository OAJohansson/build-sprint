# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Owner, first real import | "15 not found on Open Library" read as if 15 books weren't imported, and they weren't named. All 352 rows were in fact on the shelves (349 books; 3 duplicate editions merged); the 15 just had no cover or genre (translations, a boxed set, a Goodreads typo, new books). | fixed: the message now says every book is on the shelves, explains the merges, and lists the unrecognised books by name |
| 2 | Owner | Book counts on import must be tested: as soon as other people use Folio, nobody may lose a book they import. | fixing: guardrail in the brief, trust check in the test plan; automated test in the backlog |
| 3 | Claude, while fixing 1 | A looser Open Library search would "find" most of the 15, but as the wrong books (*A Corruption of Blood* → *Imitation of Christ*); a wrong match could merge two different books into one. | won't do: keep strict matching; let me fix a match by hand instead (backlog) |
