# 0030 — Publish the notebook as a small page plus data files

- **Date:** 2026-11-12
- **Status:** accepted

## Context

`pnpm notebook` built one self-contained page: about 13 KB of page and a 1.5 MB inline JSON with
every doc (Six AM alone 445 KB). Claude must read a file in full before publishing it, and 1.5 MB
can't be read at once, so on 12 Nov (11 Meander) the notebook could no longer be republished and
fell behind `main`. It would only grow: every product adds 50–400 KB of notes.

## Decision

- The build writes `.notebook/index.html` (the page, the menu and each file's hash, about 60 KB)
  and `.notebook/data/`: one text file per product sub-page (`data/products/<slug>/<page>.txt`),
  one per sprint page (`data/pages/<id>.txt`), `data/ideas.txt` and `data/quiz.json`. The page
  fetches a file when its view opens, by relative path with `?v=<hash>` so updates aren't cached.
- The artifact keeps files a publish leaves out, so a republish sends the page plus only the
  changed files. What changed is worked out against the **live** page: read the artifact, then
  `pnpm notebook --since <saved page>` compares hashes and lists changed and removed files (also
  in `.notebook/publish.json`). Steps in AGENTS.md, Documentation.
- Data files are plain markdown text (quiz: one card per line), so they read well before
  publishing and no file is bigger than its biggest doc (about 115 KB today).
- Decision 0024 still holds: build for publishing only from the latest `main`; the unmerged-notes
  warning stays. `--preview` writes `.notebook/preview.html` with everything inline (opens from
  disk) and the real split in `.notebook/preview/`.

## Alternatives considered

- **Committed hash manifest in git:** publishing happens from a detached `main`, so updating it
  would need another branch and merge after every publish, and it drifts if a publish fails. The
  live page already holds the hashes and must be read before a publish anyway.
- **One JSON per product:** Six AM would still be one 445 KB file, re-sent whenever its journal
  changes. Per sub-page is finer and still under the 255-files-per-publish limit (111 files now).
- **Trim the notebook (drop journals or old products):** loses the documentation the owner wants.

## Consequences

- A usual republish is the 60 KB page plus a few KB to a few hundred KB of changed notes.
- A full publish (first time, or a lost artifact) is about 1.5 MB in batches of files.
- Opening a sub-page makes one small request, so it shows "Loading…" for a moment.
- Revisit if the file count nears 255 per publish (about 20 products), by publishing in two calls
  to the same URL.
