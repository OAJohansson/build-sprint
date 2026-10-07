# Docs

**Read it as a notebook:** https://claude.ai/artifact/6WgAx5PMZYAzBqCg7zf25b (private).
It's built from these files by `pnpm notebook` and republished whenever they change. The markdown here stays the master copy.

| Where | What goes there |
| --- | --- |
| [`PLAYBOOK.md`](PLAYBOOK.md) | The daily loop: how a product goes from idea to deployed in one day. |
| [`ideas.md`](ideas.md) | Ideas for the next products. Pick from here each morning. |
| [`products/`](products/) | Per product: a lean card (`NN-slug.md`: user, problem, bet, links, learned; feeds the README table and portfolio) and a folder (`NN-slug/`) with the journal, feedback log, user testing, backlog and learnings. Each becomes a sub-page in the notebook. Created by `pnpm new`. |
| [`learnings.md`](learnings.md) | Summary of learnings across products: design principles, key learnings per product and the process changelog. A page in the notebook. Each product keeps the full detail in its folder. |
| [`decisions/`](decisions/) | Setup and architecture decisions with their reasoning. Use [`TEMPLATE.md`](decisions/TEMPLATE.md). |

## Product write-up frontmatter

```yaml
day: 1
title: CrossFit Log
user: CrossFitters training 3–5×/week
problem: Results on the whiteboard get lost, so I can't see progress
bet: A 10-second workout log with automatic PR tracking
status: building   # idea | building | shipped | parked
date: 2026-10-07
url: https://...vercel.app   # empty until deployed
tags: [nextjs, localstorage]
```

Below the frontmatter there is just a `## Learned` list (1–3 bullets). Keep it lean: one line per field.

After editing, run `pnpm sync` (README table) and `pnpm notebook` (the private notebook, then republish it). The portfolio site reads the same files at build time.
