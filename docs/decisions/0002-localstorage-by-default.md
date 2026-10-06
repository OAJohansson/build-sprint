# 0002 — localStorage by default, backend only when needed

- **Date:** 2026-10-06
- **Status:** accepted

## Context

Most one-day prototypes (e.g. a personal workout log) don't need accounts or a server. Setting up
a database, auth and env vars per product would eat a large share of each day.

## Decision

The starter persists state with `useLocalStorage` (`src/lib/use-local-storage.ts`). A product adds a
backend (Supabase, or Vercel Marketplace Postgres from the project's Storage tab) only when its core idea
requires shared or multi-device data, and its write-up says so.

## Consequences

- Zero setup and zero cost. Products work offline and on the free tier.
- Data is per browser, so a demo on a recruiter's machine starts empty. Consider seeding sample data.
