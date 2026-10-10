# Docs

**Read it as a notebook:** https://claude.ai/artifact/6WgAx5PMZYAzBqCg7zf25b (private).
It's built from these files by `pnpm notebook` and republished whenever they change. The markdown here stays the master copy.

| Where | What goes there |
| --- | --- |
| [`PLAYBOOK.md`](PLAYBOOK.md) | The daily loop: how a product goes from idea to deployed in one day. |
| [`ideas.md`](ideas.md) | Problems to solve: problem-first ideas for the next products. Pick from here each morning. A page in the notebook. |
| [`products/`](products/) | Per product: a lean card (`NN-slug.md`: user, problem, bet, links, learned; feeds the README table and portfolio) and a folder (`NN-slug/`) with the journal, feedback log, user testing, backlog and learnings. Each becomes a sub-page in the notebook. Created by `pnpm new`. |
| [`product-craft.md`](product-craft.md) | The product-management voices behind the playbook (Cagan, Perri, Torres…), their key ideas and where each shows up. A page in the notebook. |
| [`interview-stories.md`](interview-stories.md) | The story bank: how to tell a product as an interview story, and a table of every product's story and the interview themes it covers. A page in the notebook. |
| [`knowledge-bank.md`](knowledge-bank.md) | General knowledge learned along the way (product craft, design, git and shipping, web tech, building with AI), with quiz questions that feed the notebook's Quiz page (active recall, spaced repetition). |
| [`todo.md`](todo.md) | Sprint-wide to-do: process, tools and skills to come back to (not product features). A page in the notebook. |
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
