---
day: 5
title: Inkling
status: shipped
date: 2026-10-12
user: "Maya, 19, first-year law student who isn't sure the path is hers, writing at 10.30 pm in bed"
problem: "Young adults go round in circles about direction; ChatGPT agrees and forgets, and Inkling's real strength (naming the idea at work) was invisible inside a chat window"
bet: "One evening journey, question → write → meet an idea → takeaway, built on real data with a public demo, shows the journal-that-teaches in two minutes"
url: "https://inkling-journal.vercel.app"
repo: "https://github.com/OAJohansson/kids-app"
notebook: "https://claude.ai/artifact/SZWbpHSzw5F2MP2D3zuqm5"
tags: ["claude-api", "supabase", "redesign", "demo", "evals"]
---

## Learned

- A redesign's job was to make the existing strength visible: the AI already named ideas, but a chat bubble hid them. Giving the idea its own screen was the wow.
- One data shape, two sources (real API or a scripted demo) gave a safe public demo and real-data features without building screens twice.
- Simulated users found the trust bug (saved entries cut short) and the honesty gap (an unlabelled scripted demo) that no audit would; evals caught two prompt rules a new model broke.
