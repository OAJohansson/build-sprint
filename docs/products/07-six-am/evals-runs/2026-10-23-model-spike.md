# Model spike runs, 23 Oct (owner's Chrome 154, tab capture, 60 s)

Raw results pasted by the owner; graded later by data-evals, not by the builder.

| # | Track | Top 5 Discogs styles | BPM | Key | Energy | Brightness | Times |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Pupa Nas T x FOVOS – Work (Edit) | Donk 28.4, Hard House 27.7, Makina 21.3, Trance 15.0, Hard Trance 13.9 | 101.3 (conf 15.1) | G# major (0.64) | -8.1 dBFS | 1660 Hz | model 76.7 s first load; features 93 ms, inference 622 ms (59 patches) |
| 2 | Gag On It – Kim Petras (LUKE LA BEAT Remix) | Techno 24.8, Tech House 22.4, House 21.6, Bassline 16.7, Minimal Techno 12.3 | 128.1 (conf 17.5) | E major (0.38) | -12.4 dBFS | 1572 Hz | features 88 ms, inference 579 ms (59 patches). Owner: the 60 s window was all intro, the main section was never heard |

## Queue run, 4 × 30 s snippets (owner's Chrome 154, 23 Oct ~15:39–15:46 UTC)

Three tracks queued and analysed unattended, 120 s each, model from cache (0.1 s).

| Track | Top styles (combined) | Per-snippet top style | BPM (alt) | Key (runner-up) |
| --- | --- | --- | --- | --- |
| Pupa Nas T x FOVOS – Work (Edit) | Hard House 15.8, Trance 12.6, Makina 12.4, Donk 12.1, Hard Trance 11.7 | Hard House, Hands Up, Donk, Makina | 151.8 (76.0, 1:2) — every snippet 151.8–151.9 | G# major (G# minor) |
| KI/KI – What's a Girl to Do (KI/KI Remix) | Trance 33.0, Hard Trance 18.5, Euro House 16.2, Hands Up 13.6, Tech Trance 10.1 | Trance ×4 | 145.8 (97.4, 2:3) — snippets 145.7–145.9 | F minor (G# major) |
| Cărbune Adrian – Lost in The Loop | House 38.6, Deep House 30.0, Tech House 20.2, Tropical House 19.6, Bassline 8.7 | House, House, House, Tech House | 123.0 (61.5, 1:2) — every snippet 123.0 | G major (G minor) |

FOVOS was 101.3 BPM in the first spike run (2:3 error); the rebuilt estimator reads 151.8.
