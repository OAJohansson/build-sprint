# Research brief: where more and better starting sounds come from (Phase 7, 27 Nov)

The question: Make has 4 synth presets per drum row and for bass, and the knobs change little
(owner, L265). Where can many more good sounds come from, legally, inside a live web app that may
one day be shared or charged for? Three routes: **A** a richer synth with more presets, **B** a
free sample kit shipped in the app, **C** the owner's own sample packs, kept in the browser.

Researched with web search and the licence pages themselves (27 Nov; nothing downloaded). Evidence
strength: **strong** = the licence text or official docs say it; **moderate** = a reputable
secondary source; **weak** = a forum, a blog or our inference. Not legal advice.

## Findings, strongest first

| # | Finding | Strength | Source |
| --- | --- | --- | --- |
| 1 | "Royalty-free" packs (Splice, 99Sounds, MusicRadar, BandLab, Ableton, Soundtrap) let *you* use the sounds in your own tracks, but forbid handing the raw files to others. A sample set served from our site to every visitor is handing them out. So no bought or "free royalty-free" pack can go into route B | strong | Splice licensing FAQ; 99Sounds licence page; BandLab Sounds help; Ableton help 209768885 |
| 2 | CC0 sounds may be shipped in an app with no conditions, commercial use included; CC BY too, with a credit line (a credits page is enough). CC BY-NC breaks the day Six AM is charged for | strong | Creative Commons deeds; Freesound FAQ |
| 3 | Freesound can be filtered to CC0 only; "909 kick" alone gives 89 CC0 sounds. Quality varies, so hits need picking by ear. The Studio's two kits already come from Freesound CC0 (L120, `public/kits/LICENSES.md`) | strong | freesound.org search with the licence filter |
| 4 | Other clean sources: Sonic Pi's bundled samples (each traced to a CC0 Freesound page, small set); tonejs-instruments (CC BY 3.0, includes electric bass and contrabass multisamples); some Karoryfer titles (CC0, e.g. an electric bass) | strong (Sonic Pi, tonejs) / moderate (Karoryfer) | Debian copyright file for sonic-pi; github.com/nbrosowsky/tonejs-instruments |
| 5 | Avoid the popular "909/808 sample" banks other web apps use (Strudel's default drum machines, Tidal's Dirt-Samples, the Fischer 808 set): no licence or unknown provenance | strong (the maintainers say so) | Tidal forum; tidal-drum-machines repo has no licence |
| 6 | A recording of a single drum hit is protected by whoever recorded it (EU, Pelham 2019; the US is split). So a "909 sample" is only as clean as its licence; Roland doesn't own a fresh recording, the recorder does. A CC0 upload by the person who recorded it is clean | strong (EU ruling) / weak (the drum-machine application) | CJEU C-476/17; VMG Salsoul v. Ciccone |
| 7 | Loading your own packs in the browser works in desktop Chrome (folder picker, up to ~60 % of the disk, decoding WAV and MP3). The pack's licence covers you making music with it, and the app never receives the files | strong (browser docs) / weak (licence reading) | MDN showDirectoryPicker, storage quotas, decodeAudioData |
| 8 | Synthesis gets closer with layers: a click, a pitch-dropping sine body, a noise burst, drive; claps as 3–4 quick noise bursts. Hats and claps rarely match samples. Tone.js's own drum synth has no click, noise or drive; iO-808 (MIT, Web Audio) is an open reference | moderate | Sound On Sound "Synth Secrets"; Tone.js docs; github.com/vincentriemer/io-808 |

Not verified: the Loopmasters, Goldbaby and Samples From Mars licence texts; how many of the CC0
sounds are good enough for house (none auditioned yet).

## The routes side by side

| | A: richer synth, more presets | B: CC0 / CC BY sample kit in the app | C: your own packs, in the browser |
| --- | --- | --- | --- |
| Gets drums closer to records | some (kicks yes, hats and claps less) | a lot: real recorded hits | most, if you own good packs |
| Licence risk if ever shared or sold | none | low, with CC0 / CC BY only and a credits page | low; must never upload or share the files |
| Build effort | medium (sound design, listening) | low to medium (pick, trim, host, credits) | medium to high (picker, storage, map files to rows, empty state) |
| Works for a beginner with nothing | yes | yes | only once you have a pack |
| Knobs still matter | yes, fully | yes, if the knobs work on samples (pitch, length, tone, drive) | same as B |

## Recommendation

**B for drums plus A for bass now; C later.** A hand-picked CC0 kit (Freesound, Sonic Pi) gives
every drum row, including the new open hat, shaker and ride, about 12 real sounds, the biggest
step towards "recognisably the same" at the least risk; it extends what the Studio's kits already
do. Bass stays mostly synth (a bass's notes must follow the track exactly), with a richer engine
and more presets, plus a few CC BY sampled basses with a credit line. Loading your own packs is
worth it once you own packs and the kit runs out; it goes to the backlog.
