# X1 section references, 25 Oct 2026 (data-evals)

Reference section boundaries for eval X1 ("map sections within 4 bars of the reference
sections"), sourced and written down **before any arrangement-map result exists** (L104, like L35
did for BPM). Nothing here was taken from listening to, downloading or analysing audio; only public
text and annotation data were used. The scoring rule at the bottom is frozen as of this file's
commit and is not changed after results are seen.

## Summary

- **Validation set (kickoff-source Appendix B, 10 tracks): 0 of 10 sourced.** No public section
  annotation exists for any of them (details below). All 10 are marked **no source**: their maps
  are reported, not counted.
- **Backup set: 5 tracks, all sourced** from the Raveform dataset (expert EDM structure
  annotations, TISMIR 2026), each checked to have a full-length, streamable SoundCloud upload
  whose length matches the annotated version (within 1.5 s).
- So X1 will in practice be judged on the backup set (n = 5), and the report must say so.

## Validation set: search and result

What was searched for each track: the SoundCloud page (description, tags, length; timed comments
counted only), Beatport / Traxsource / Tunebat listings, YouTube (official uploads, chapters,
timestamped descriptions), DJ and producer breakdown articles, and the public structure datasets
(Harmonix Set, Raveform, EDM-98). Lengths are from the SoundCloud pages (`full_duration`); BPMs
are the L35 locked references, or Ears' reading (from `2026-10-23-validation-export.json`, BPM
only) where L35 had none.

| # | Track | Length | BPM (source) | Section source | Boundaries |
| --- | --- | --- | --- | --- | --- |
| 1 | [Hard Reset – Redemption (Extended Mix)](https://soundcloud.com/hardreset90087/redemption-extended-mix) | 7:09.3 | 122 (Beatport, L35) | **no source**: 0 SoundCloud comments, empty description; Beatport has no structure; not in any dataset | – |
| 2 | [Knober, Jaime Soeiro – Realize](https://soundcloud.com/jaimesoeiro/knober-jaime-soeiro-realize) | 5:35.7 | 128 (Beatport, L35) | **no source**: 1 comment, empty description; no YouTube chapters or breakdown found | – |
| 3 | [Kolter – Symphony No. 5](https://soundcloud.com/koltercologne/symphony-no-5) | 5:04.3 | 127.1 (Ears only) | **no source**: description is booking contacts only; web search finds nothing for this track | – |
| 4 | [Retrouve – Music Is The Answer (Edit)](https://soundcloud.com/retrouve/music-is-the-answer) | 6:01.0 | 128.1 (Ears only) | **no source**: empty description; sources cover the 1998 Tenaglia original and other edits, not this edit | – |
| 5 | [Cărbune Adrian – Lost in The Loop](https://soundcloud.com/carbune/lost-in-the-loop-o-deibys) | 3:18.8 | 123 (Tunebat, L35) | **no source**: empty description; no annotation found | – |
| 6 | [Pupa Nas T x FOVOS – Work (Edit)](https://soundcloud.com/fovosmusic/fovos-work-edit-extended) | 4:19.1 | 152 (Beatport, L35) | **no source**: description is release links only; no YouTube chapters or breakdown found | – |
| 7 | [KI/KI – What's a Girl to Do (KI/KI Remix)](https://soundcloud.com/djlekkerman/kiki-whats-a-girl-to-do-kiki-remix) | 3:33.4 | 146 proxy (L35, other version) | **no source**: an unreleased version; press (Beatportal, DJ Mag) covers the released 2025 version, without times | – |
| 8 | [Dubspinna – What's A Girl To Do (Festival Remix)](https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha) | 7:33.2 | 125 (Ears only) | **no source**: unreleased remix; description has no structure; nothing on the web | – |
| 9 | [Mason Flint – It Just Won't Do (Remix)](https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix) | 3:25.7 | 126 (DJ pools, L35) | **no source**: description is an artist bio; DJ pools list BPM and key only | – |
| 10 | [MikeQ – Alien Superstar (MikeQ x DJ Fade Remix)](https://soundcloud.com/djmikeq/beyonce-alien-superstar-mikeq-x-dj-fade-remix-dirty) | 2:48.6 | 128.1 (Ears only) | **no source**: description is one promo line; MikeQ's Bandcamp lists the title only | – |

**Considered and rejected as sources (decided now, before results):**

- **SoundCloud timed comments** (tracks 3–10 have 28–3,547 comments). They are fan reactions
  ("this drop!"), placed by ear and sparse, not annotated boundaries; reading them would also need
  SoundCloud's private API. Not used.
- **Harmonix Set** (Nieto et al., ISMIR 2019, MIT licence; github.com/urinieto/harmonixset). Has
  expert segment and downbeat files for dance tracks (Daft Punk, Darude, Basement Jaxx…), but the
  annotated audio is short game edits (e.g. *Sandstorm* annotated at 2:18 against a 7:24 original),
  so the times don't carry over to any version Ears can stream. Not used.
- **Genre convention** ("16-bar intro, drop at bar 33"): not a source, by the task's rule.

## Backup set (sourced)

**Source:** Raveform, "A Dataset of Metrical and Functional Structure Annotations for EDM Tracks
in DJ Mixes" (Kim et al., TISMIR 9(1), 2026, doi:10.5334/tismir.288; site
https://mir-aidj.github.io/raveform/; data https://huggingface.co/datasets/taejunkim/raveform,
file `raveform/structures/segments.json` plus `structures/beats/<key>.beat.csv` for downbeats).
Annotators were manual, with an EDM vocabulary: intro, buildup, drop, breakdown, cooldown, outro,
end. Each annotated track is identified by a YouTube video id; the times below are on that audio.
Only the annotation text files were read (by HTTP range requests); no audio.

**How the five were picked:** a single constant tempo in the annotation; covering the owner's
genres (tech house, techno, melodic house & techno, trance); and an official, full-length,
streamable (`policy: ALLOW`) SoundCloud upload whose length matches the annotated length.
Rejected for length or preview-only uploads: Patrick Topping *Forget* and Dusky *Yoohoo* (no
official upload), Pryda *F.A.T.* (4:16 upload vs 6:17 annotated), Hot Since 82 *Play The Room*
(5:34 vs 7:54), Shadow Child *Piano Weapon* and Kölsch *Goldfisch* (preview-only or blocked).

**Columns:** time = annotated section start (m:ss.s); bar (0:00 grid) = round(t × BPM / 240) + 1,
4 beats per bar, bar 1 = 0:00, as the task asks; bar (downbeats) = which annotated downbeat
starts the section, shown where it differs (a lead-in). Kind: **required** = the label changes
(scored); **optional** = the annotator split two sections with the same label (not scored, and
not an extra if the map has one there); the `end` row is the end of the music and not scored.
Labels are Raveform's; `buildup` = build, `cooldown` has no exact match in the map's vocabulary
(labels are reported, not scored).

### B1. CamelPhat & Elderbrook – Cola (Defected)

Tech house · 122 BPM · annotated length 6:55.6 · SoundCloud
[defectedrecords/camelphat-elderbrook-cola-2](https://soundcloud.com/defectedrecords/camelphat-elderbrook-cola-2)
6:55.7 · Raveform key `0274.qke-jOUqSXU` (YouTube qke-jOUqSXU). 11 required boundaries.

| Time | Bar (0:00 grid) | From → to | Kind |
| --- | --- | --- | --- |
| 0:31.5 | 17 | intro → buildup | required |
| 1:03.0 | 33 | buildup → breakdown | required |
| 1:50.2 | 57 | breakdown → buildup | required |
| 2:37.4 | 81 | buildup → breakdown | required |
| 2:53.2 | 89 | breakdown → drop | required |
| 3:08.9 | 97 | drop → breakdown | required |
| 3:24.7 | 105 | breakdown → drop | required |
| 4:11.9 | 129 | drop → breakdown | required |
| 4:43.4 | 145 | breakdown → drop | required |
| 5:14.8 | 161 | drop → cooldown | required |
| 6:17.8 | 193 | cooldown → outro | required |
| 6:49.3 | 209 | outro → end | not scored |

### B2. Charlotte de Witte – Remember (Drumcode DC195)

Techno · 130 BPM · annotated 6:41.9 · SoundCloud
[drumcode/charlotte-de-witte-remember-drumcode-dc195](https://soundcloud.com/drumcode/charlotte-de-witte-remember-drumcode-dc195)
6:42.0 · key `1447.tRxtlMoFABE`. 6 required boundaries.

| Time | Bar (0:00 grid) | From → to | Kind |
| --- | --- | --- | --- |
| 0:44.4 | 25 | intro → buildup | required |
| 1:28.7 | 49 | buildup → drop | required |
| 2:27.8 | 81 | drop → drop | optional |
| 3:12.1 | 105 | drop → breakdown | required |
| 3:41.6 | 121 | breakdown → drop | required |
| 3:56.4 | 129 | drop → drop | optional |
| 4:55.4 | 161 | drop → cooldown | required |
| 6:09.3 | 201 | cooldown → outro | required |
| 6:38.8 | 217 | outro → end | not scored |

### B3. Tale Of Us – Another Earth (Minus)

Techno (melodic) · 123 BPM · annotated 5:45.4 · SoundCloud
[taleofus/tale-of-us-another-earth](https://soundcloud.com/taleofus/tale-of-us-another-earth)
5:45.9 (not `taleofus/another-earth`, which is preview-only) · key `0094.IzxOHMbye_g`.
7 required boundaries.

| Time | Bar (0:00 grid) | From → to | Kind |
| --- | --- | --- | --- |
| 0:31.3 | 17 | intro → buildup | required |
| 1:02.5 | 33 | buildup → drop | required |
| 2:05.0 | 65 | drop → drop | optional |
| 3:07.4 | 97 | drop → breakdown | required |
| 3:54.2 | 121 | breakdown → buildup | required |
| 4:09.9 | 129 | buildup → drop | required |
| 4:48.9 | 149 | drop → drop | optional |
| 5:06.4 | 158 | drop → cooldown | required |
| 5:27.9 | 169 | cooldown → outro | required |
| 5:43.5 | 177 | outro → end | not scored |

### B4. Moonwalk – Orbital (Diynamic)

Melodic house & techno · 123 BPM · annotated 6:34.3 · SoundCloud
[diynamic-music/moonwalk-orbital-1](https://soundcloud.com/diynamic-music/moonwalk-orbital-1)
6:34.4 (not `moonwalk-orbital`, a snippet) · key `0406.4fpJXbb92IA`. 8 required boundaries.
**Lead-in:** the first annotated downbeat is at 0:01.65, so the downbeat bar is one lower than the
0:00-grid bar on every row.

| Time | Bar (0:00 grid) | Bar (downbeats) | From → to | Kind |
| --- | --- | --- | --- | --- |
| 0:46.5 | 25 | 24 | intro → breakdown | required |
| 1:02.1 | 33 | 32 | breakdown → buildup | required |
| 1:33.4 | 49 | 48 | buildup → buildup | optional |
| 2:04.6 | 65 | 64 | buildup → drop | required |
| 2:35.8 | 81 | 80 | drop → cooldown | required |
| 2:59.2 | 93 | 92 | cooldown → breakdown | required |
| 4:25.1 | 137 | 136 | breakdown → drop | required |
| 5:27.5 | 169 | 168 | drop → cooldown | required |
| 5:58.7 | 185 | 184 | cooldown → outro | required |
| 6:29.9 | 201 | 200 | outro → end | not scored |

### B5. Simon Patterson & Magnus – Evoke (Who's Afraid Of 138?!)

Trance · 140 BPM · annotated 6:38.0 · SoundCloud
[simonpatterson/evoke](https://soundcloud.com/simonpatterson/evoke) 6:39.5 · key
`0029.P_FU6Ue_-nc`. 7 required boundaries. **Caveat:** the upload is 1.5 s longer than the
annotated audio and where that 1.5 s sits is unknown, so up to 1.5 s of the 6.9 s tolerance may be
used by the offset. Counted, with this noted.

| Time | Bar (0:00 grid) | From → to | Kind |
| --- | --- | --- | --- |
| 0:27.5 | 17 | intro → buildup | required |
| 0:54.9 | 33 | buildup → buildup | optional |
| 1:22.3 | 49 | buildup → drop | required |
| 1:49.7 | 65 | drop → drop | optional |
| 2:17.6 | 81 | drop → drop | optional |
| 2:37.7 | 93 | drop → breakdown | required |
| 4:00.0 | 141 | breakdown → drop | required |
| 4:54.9 | 173 | drop → breakdown | required |
| 5:08.6 | 181 | breakdown → cooldown | required |
| 5:36.0 | 197 | cooldown → cooldown | optional |
| 6:03.5 | 213 | cooldown → outro | required |
| 6:30.9 | 229 | outro → end | not scored |

## Scoring rule for X1 (frozen 25 Oct 2026, before any result)

The task's rule, with these clarifications added now:

1. **Boundaries scored.** Reference: the **required** rows above (label changes). Not scored: the
   track start, the `end` row, and **optional** rows (same-label splits). Map: every section
   start except the first (0:00) and the track end.
2. **Tolerance in time, not bars.** A map boundary matches a reference boundary if
   |t_map − t_ref| ≤ 4 bars = **960 / BPM seconds** (inclusive), with the reference BPM: the
   annotation's BPM for the backup set (122 → 7.87 s, 123 → 7.80 s, 130 → 7.38 s, 140 → 6.86 s).
   Measuring in seconds means a map whose bar grid is offset by a lead-in isn't penalised twice;
   the map's own bar numbers are reported next to the times.
3. **One-to-one.** Each map boundary can match at most one reference boundary and the other way
   round; pairs are chosen closest-first.
4. **Extras.** A map boundary that matches no required boundary and lies within tolerance of no
   optional boundary is an extra.
5. **A track passes** if matched / required ≥ **75%** and extras ≤ **2**.
6. **Labels aren't scored** for X1 (intro/build/drop/breakdown/outro vs the reference label is
   reported per boundary, for information only).
7. **Version check.** A track counts only if the audio Ears analysed has the same length as the
   annotated version within ±2 s (the SoundCloud links above; all pass). Otherwise it is
   "not counted (version)".
8. **X1 passes** if at least **70%** of counted tracks pass, i.e. at least ⌈0.7 × n⌉ tracks. With
   the expected n = 5 (backup set only, because the validation set has no sources), that is
   **4 of 5**. If fewer than 5 tracks can be counted (e.g. an upload disappears), X1 is reported
   as "not enough data" with the per-track numbers, not as a pass or fail.
9. **The 10 validation tracks** are still mapped and their boundaries listed in the report, marked
   "no reference, not counted". Evals.md's "≥ 7 of 10" reads as "≥ 70% of sourced tracks", as L35
   did for BPM; the report says that the bar was judged on the backup set.
10. **Fixed.** No reference time, track or threshold above changes after a map result has been
    seen. A later correction (e.g. a wrong link) is added as a dated note, with the old value kept.

## Not checked

- No audio was listened to, so the Raveform boundaries are taken on trust (they are expert
  annotations, one annotator per track, from a peer-reviewed dataset).
- The SoundCloud uploads were matched by length only (≤ 1.5 s apart), not by audio fingerprint.
- Raveform's data licence isn't stated on its Hugging Face card; only times and labels are cited
  here, for evaluation, and nothing goes into the app.
