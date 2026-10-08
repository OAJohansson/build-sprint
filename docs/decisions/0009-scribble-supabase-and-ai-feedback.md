# 0009 — Scribble saves pieces in Supabase and gets feedback from Claude, model chosen by an eval

- **Date:** 2026-10-08
- **Status:** accepted

## Context

Scribble (day 3) is a daily writing practice: a prompt, a few sentences, and constructive
feedback on request. The owner will write in it every day and doesn't want to risk losing a single
piece, so localStorage (decision 0002) isn't enough. Feedback on each piece is the cornerstone,
but cost should stay minimal.

## Decision

- **Storage:** Supabase, following decision 0005: tables prefixed `scribble_` in the existing
  Supabase project (the free plan allows two active projects, and the prefix keeps apps apart).
  Only the app's server routes talk to the database with the secret key; RLS on, no policies.
  An access code is the login. Drafts autosave; "Export all" downloads everything as a backup.
- **Feedback:** one Claude call in a server route, only when asked for, returning one strength
  and one thing to try that quote the piece. The system prompt is stable so it can be cached.
- **Model:** `claude-sonnet-5-5` on the owner's API key for the MVP. After the MVP, a small eval (~8 sample pieces, pass/fail checklist:
  quotes the writer's words, one concrete suggestion, no rewrite, not discouraging) runs Haiku 5.5,
  Sonnet 5.5 and Opus 5.5; the cheapest model that passes stays. At ~60 pieces a month that's
  between a few cents (Haiku) and about $1.30 (Opus).
- A monthly spend limit on the Anthropic workspace is the backstop.

## Alternatives considered

- **localStorage:** free and simple, but one cleared browser loses months of writing.
- **Free models via OpenRouter:** rate limits, uneven quality, and some providers may log or
  train on prompts; not worth it for private writing to save about a dollar a month.
- **The owner's Claude subscription:** a Pro/Max plan covers the Claude apps and Claude Code, not
  API calls from your own app. A "Discuss in Claude" copy-and-open button would be free but
  manual, with nothing saved in the app.
- **Picking a model by gut feel:** the eval makes "good enough" a measurement (sprint to-do #1).

## Consequences

- Needs `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `ANTHROPIC_API_KEY` and `ACCESS_CODE` in the
  Vercel project, and the schema run once.
- Free Supabase projects pause after a week without activity; daily use keeps it awake, and the
  export is the backup.
- Revisit the model when the prompt changes (re-run the eval), and if the app ever gets other users.
