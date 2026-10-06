# 0004 — Voice notes parsed by Claude in a server route; the log stays in localStorage

- **Date:** 2026-10-06
- **Status:** accepted

## Context

Day 1 (CrossFit Log) has to turn a rambling spoken note ("snatch, worked up to 62, then clean and
jerk five doubles at 80") into structured lifts. Speech-to-text also mangles lift names.

## Decision

- Dictation uses the browser's Web Speech API (free, no key, works in Chrome and iOS Safari).
  Where it isn't available, the textarea still takes the phone keyboard's mic.
- Parsing is one Claude call (`claude-opus-5-5`, low effort, structured output via a Zod schema) in a
  Next.js route handler, `apps/01-crossfit/src/app/api/parse/route.ts`. It needs a server only to
  keep `ANTHROPIC_API_KEY` secret. No database, no auth.
- The user always reviews and edits the parsed rows before saving. Saved sessions live in localStorage.

## Alternatives considered

- Regex/grammar parser: free, but brittle with natural speech and misheard words.
- Whisper/audio upload: better transcription, but adds audio handling and a second API for a day-1 MVP.
- Calling the API from the browser: would leak the key.

## Consequences

- Needs `ANTHROPIC_API_KEY` set in the Vercel project. Without it the route returns 503 and the app
  falls back to manual entry.
- Per-device data. Export to JSON exists as a safety net; revisit sync if it's used daily.
