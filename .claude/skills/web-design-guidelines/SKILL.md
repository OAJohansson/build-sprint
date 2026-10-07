---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
metadata:
  author: vercel
  version: "1.0.0"
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Web Interface Guidelines.

Local change: upstream fetches the rules from a live URL on every run. This copy reads a pinned,
reviewed snapshot instead, so the rules can't change underneath us. Refresh it by hand (see
`../README.md`).

## How It Works

1. Read the rules in [GUIDELINES.md](GUIDELINES.md)
2. Read the specified files (or prompt user for files/pattern)
3. Check against all rules in the guidelines
4. Output findings in the terse `file:line` format

If no files specified, ask the user which files to review.
