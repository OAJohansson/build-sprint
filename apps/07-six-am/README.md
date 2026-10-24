# Six AM (product 07)

Make house and techno from loops (Studio), and hear what a SoundCloud track really is (Analyse,
Ears v1). Runs with `pnpm -F 07-six-am dev` on port 3007.

- `/` Studio: the timeline, the crate and saved tracks (access code, Supabase; decision 0020).
- `/analyse` Analyse: paste a SoundCloud track or playlist, enable listening (Chrome tab audio),
  analyse 4 × 30 s snippets per track. Results stay in this browser (localStorage); audio is never
  stored, uploaded or recorded. `/analyse?demo=1` shows sample rows without tab capture
  (`&listening=off` for the off state).

## Licences: read before any public release

- The genre model, Essentia's **Discogs-EffNet** (`discogs-effnet-bsdynamic-1`), is published under
  **CC BY-NC-SA 4.0**: non-commercial use only, attribution, share-alike. Essentia's models are
  licensed for non-commercial use; commercial use needs a licence from the MTG (UPF).
- It is fetched at runtime through the `/models/*` rewrite to essentia.upf.edu (not stored in this
  repo) and cached in the browser.
- No essentia.js (AGPLv3) is used: the features are plain TypeScript (decision L22).
- Fine for personal use. **Revisit before any public or commercial release.**
