# Journey

What happened, what was decided and why. Newest last.

## 18 Oct: discovery while Folio wraps up

- **Parallel work, kept safe.** Folio (06) is still being wrapped up in another session, so 07
  started in its own worktree on branch `07-discovery`, cut from `folio-ship-notes` (not `main`)
  so it carries the main-only Vercel config (decision 0016). Rules until Folio is merged: no
  `pnpm sync`, no notebook rebuild or republish; write only inside 07's own files; shared pages
  wait (list below); `pnpm new`'s README change was undone and gets regenerated after Folio; 07
  merges only after Folio. That also means the playbook's "ship the empty starter in the first
  hour" waits until Folio is merged.
- **First idea, parked.** Started with a self-discovery app (research-based questionnaires as a
  "character sheet", core values and needs applied to areas like work and love, reflection after
  each lens, retest framed as "still becoming"). Got as far as the MVP lenses, then the owner
  chose a change of theme: the last few products were all close to self-understanding. Saved with
  its decisions on the Problems page.
- **Pivot to music.** A tool to make house and techno as a beginner, on a laptop. Owner's lines:
  sleek and simple, made only for dance music, the producer is me (no AI-made music or
  AI-generated samples); the only AI allowed is turning a hummed melody into notes.
- **Shape.** Lanes (a jam grid like Ableton's Session View) instead of a timeline; every loop in
  one tempo and key so a beginner can't sound bad; recording the jam is the arrangement; the club
  moves (filter sweep, drop, pump) as single controls. Design inspiration: crate digging in a
  record shop, Berlin warehouse and Chicago house. Energy-curve drawing parked.
- **Library.** Most sample-pack licences forbid redistributing raw sounds in an app, so the MVP
  uses a curated crate of CC0 sounds; Freesound search (needs a small server route to hide the
  API key) comes later.
- **Humming → v2** (owner confirmed, brief signed off): mic access, Spotify's Basic Pitch model
  and snapping notes to key and tempo would double day one.
- **Name: Six AM**, the moment the warehouse lights come on. Picked from a brainstorm in the
  Bending Spoons spirit (inside reference, absurd out of context); can change later.

### To carry over after Folio

- `docs/knowledge-bank.md`: Barnum effect (Forer, 1949); Johari window (Luft & Ingham, 1955);
  Wheel of Life (Paul J. Meyer); sample licensing (use in tracks vs redistribute in an app);
  audio-clock scheduling ("A Tale of Two Clocks", Chris Wilson). Each with 1–3 quiz questions.
- `docs/ideas.md`: already updated on this branch (self-discovery row, music row).
- `README.md`: run `pnpm sync` after Folio merges.
- Notebook: `pnpm sync && pnpm notebook`, then republish.
