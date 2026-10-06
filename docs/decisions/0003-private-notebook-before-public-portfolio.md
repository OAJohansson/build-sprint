# 0003 — Private notebook now, public portfolio later

- **Date:** 2026-10-06
- **Status:** accepted

## Context

I want one lean, phone-friendly place to track every product (user, problem, bet, links,
learnings), but keep it private until I'm ready to show it publicly.

## Decision

`pnpm notebook` builds `.notebook/index.html` from `docs/`, and it's published as a **private
claude.ai artifact** (same approach as the Inkling product notebook). The markdown in `docs/`
stays the master copy. The `apps/portfolio` Next.js site reads the same files and is deployed to
Vercel only when I decide to go public.

## Alternatives considered

- **Deploy the portfolio now behind a password.** Protecting a production deployment needs a paid
  Vercel plan.
- **An editable web form with a database.** Lets me edit from my phone, but needs auth and a
  backend. That's too much for a tracker.

## Consequences

- Free, private by default, readable on a phone.
- Updating it means asking Claude to rebuild and republish (written into AGENTS.md).
- Going public later means one Vercel import of `apps/portfolio`, with no content migration.
