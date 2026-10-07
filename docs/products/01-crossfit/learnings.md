# Learnings

What building CrossFit Log taught me. Newest first.

## Product
- Frame the moment of use before building. The first MVP logged workouts well, but the real job
  was recalling a PB mid-class. A needs brainstorm turned that around in an hour.
- Showing three different design approaches side by side made the choice quick and confident, and
  the mix (A's board + B's review) was better than any single option.
- An app that only stores data feels like homework. Give something back: percentages, a PB
  celebration, and (next) visible progress.

## Engineering
- Test browser dictation on a real phone on day one. Chrome on Android re-sends earlier speech
  results, which desktop testing never showed.
- Check configuration up front (here, which kind of Supabase key is set), so a wrong setting fails
  loudly at load instead of half-working.
- Keep error messages for users general and put the technical reason in the server logs.
- A retry button needs visible feedback. When the retry fails instantly, it looks broken.

## Process and tools
- A Claude subscription can't power a deployed app; an API key can. Protect a public AI feature
  with an access code and a spend cap.
- Vercel in a monorepo: give the Vercel GitHub app access to the repo, set the Root Directory, and
  redeploy after changing environment variables.
- Run a simulated user test before real users. It catches the obvious problems cheaply.
