# Review feedback

Status: `open` · `fixing` · `fixed` · `parked` · `won't do`

| # | Type | Feedback | Status |
| --- | --- | --- | --- |
| 1 | Owner, first real import | "15 not found on Open Library" read as if 15 books weren't imported, and they weren't named. All 352 rows were in fact on the shelves (349 books; 3 duplicate editions merged); the 15 just had no cover or genre (translations, a boxed set, a Goodreads typo, new books). | fixed: the message now says every book is on the shelves, explains the merges, and lists the unrecognised books by name |
| 2 | Owner | Book counts on import must be tested: as soon as other people use Folio, nobody may lose a book they import. | fixing: guardrail in the brief, trust check in the test plan; automated test in the backlog |
| 3 | Claude, while fixing 1 | A looser Open Library search would "find" most of the 15, but as the wrong books (*A Corruption of Blood* → *Imitation of Christ*); a wrong match could merge two different books into one. | won't do: keep strict matching; let me fix a match by hand instead (backlog) |
| 4 | Owner | Test that the CSV's data shows correctly in the app (title, reviews and so on). | fixed: unit tests check every field arrives unchanged; field check added to the test plan |
| 5 | Claude, while writing 4 | The import ignored Goodreads' "My Review", so anyone with reviews would lose them (the owner's export has none). | fixed: reviews import into the longer review, as plain text with line breaks kept |
| 6 | Claude, while writing 4 | Rows on other Goodreads shelves (currently-reading, or custom ones like did-not-finish) were skipped silently. | fixed: currently-reading goes to Want to read until v2's Reading now shelf (owner); custom shelves are named on screen as not imported |
