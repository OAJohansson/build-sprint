# Docs

| Where | What goes there |
| --- | --- |
| [`PLAYBOOK.md`](PLAYBOOK.md) | The daily loop: how a product goes from idea to deployed in one day. |
| [`ideas.md`](ideas.md) | Backlog of product ideas. Pick from here each morning. |
| [`products/`](products/) | One write-up per product (`NN-slug.md`). The frontmatter feeds the README table and the portfolio site. Created by `pnpm new`. |
| [`learnings.md`](learnings.md) | Lessons that apply across products. Raw material for interviews. |
| [`decisions/`](decisions/) | Setup and architecture decisions with their reasoning. Use [`TEMPLATE.md`](decisions/TEMPLATE.md). |

## Product write-up frontmatter

```yaml
day: 1
title: CrossFit Log
tagline: One line a recruiter can read in 3 seconds
status: building   # idea | building | shipped | parked
date: 2026-10-07
url: https://...vercel.app   # empty until deployed
tags: [nextjs, localstorage]
```

After editing frontmatter, run `pnpm sync` to refresh the README table. The portfolio site reads these files at build time.
