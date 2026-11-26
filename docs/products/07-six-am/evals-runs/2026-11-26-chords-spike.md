# Chords spike: real-track grade of the chord-name readers, 26 Nov 2026 (data-evals)

This grades the Phase 6 spike (L254, L255, T145–T147) against H1–H5 and H16 in `evals.md`. I only
graded and changed no product code. The build is 1240fad on `claude/07-six-am-chords-cdf1b0`.

**Verdict: neither reader passes the spike gate.** Reader A (DSP chroma) passes H2 (chord times:
99.4 % found, 10.6 % extra) and the root half of H1 (84.1 %), but names the chord *type* right on only
36.8 % of labelled bars (bar 70 %). Reader B (Basic Pitch, fixed) fails both H1 (42.1 % / root
69.3 %) and H2 (70.5 % found, 23.9 % extra). A is the better reader on every gate number except
root+family, where B is 5 points higher and both are far under the bar. By L252 the build stops here
and the PM takes these numbers to the owner.

## Setup

- My own sandbox on :3017 (`SUPABASE_URL= SUPABASE_SECRET_KEY= ACCESS_CODE=test-code`, in-memory
  store; started with `ANTHROPIC_API_KEY` and `STABILITY_API_KEY` empty, so no paid call was
  possible), seeded with `evals/sandbox-seed.mjs` (Mason Flint, Lost in the Loop).
- **Maps for the new tracks** made in the sandbox with Listen and map (a second Chrome with its own
  profile, CDP :9518, auto-select "Six AM Map", `?url=…&auto=1`): Kiki remix 147.69 BPM F minor,
  origin 0.12 s, 131 bars; Retrouvé 128 BPM A# major, origin 0.151 s, 192 bars; Dubspinna 125 BPM
  G# major, origin 1.091 s, 235 bars; Knober "Realize" 128 BPM A# minor, origin 0.105 s, 179 bars.
  None was checked by ear; labels are relative to each map's bar grid, as the readers are.
- **Lab:** my own Chrome 158 (own profile, CDP :9517, `--auto-select-tab-capture-source-by-title="Six
  AM Deck"`, `?quiet=1`). Play was a CDP mouse click; every loop was separated live in the browser.
  For each loop: `__sixamLab.setLoop(start, end)`, wait for `state().loop.state === "memory"`, then
  `chordsRead("dsp")`, `chordsRead("basic-pitch")` once or twice, `chordsRead("dsp")` again, all in
  one page.
- **C2.** An injected grader tap wrapped `Worker.prototype.postMessage`; at the first "chords-read" of
  each loop it kept numbers only from that copy of the looped "other" part: a semitone spectrogram
  (MIDI 36–96, dB, 8192 window, 11.6 ms hop) and 6 band envelopes (dB, 1.45 ms hop). No PCM, nothing
  sent. Every read of a loop used the same in-memory loop, so labels and reads share one copy (no
  ~30 ms copy shift inside a loop). The working numbers were deleted after grading; only the labels
  below are kept.
- **Blind labels.** The driver hid chord names until the labels were written.

### Tracks and loops

| Track | Loops read | Used | Why |
| --- | --- | --- | --- |
| Lost in the Loop | 69–76, 77–84, 49–56 | all 3 | 69–76 G7 stabs; 77–84 G/B♭ dyad calls; 49–56 a Cm–D7–Gm pad-and-stab bar set |
| Retrouvé, Music Is the Answer | 33–40, 57–64, 89–96, 113–120 | 57–64, 89–96, 113–120 | 33–40 has flat chroma (noise and bleed, no chord); 89–96 names ambiguous, onsets used for H2 only |
| Kiki remix | 49–56, 65–72, 89–96 | **swapped out** | the separated "other" is a dense arpeggio/riff: 0–7 strong onsets per 8 bars, no stable chord per bar and no single top line, so neither chords nor a lead could be labelled honestly |
| Dubspinna remix (swap for Kiki) | 57–64, 73–80, 105–112, 141–148 | all 4 | the Fatima Yamaha loop (D♭ – E♭ – B♭m) as plucks, and its lead line (105–112, 73–80) |
| Knober, Realize (fallback) | 41–48, 89–96, 137–144 | **not used** | the "other" part is a bass-like A♯2/C♯3 riff (89–96, 137–144) or a noisy drop with every pitch class present (41–48): no chord to label |
| Mason Flint | 17–24, 41–48 | 17–24 (lead only) | 41–48 is octave-ambiguous (G4/G5 swap frame to frame), so not labelled |

**Held out:** Dubspinna 73–80 (chords and onsets), never used to check the method or scoring.

## Labels (method)

The Phase 5 method (`2026-11-12-melody-slice.md`), on this run's copy:
- **Onsets:** peaks of the 400–3000 Hz rise (dB over the previous 20 ms), timed at the steepest rise.
  A labelled chord onset rises ≥ 9 dB and peaks within 10 dB of the loop's top; weaker rises (≥ 4 dB)
  are ambiguous (not required, not counted as extra). This counts every strong hit of the part,
  including single-note hits of a riff inside the "other" part (Retrouvé's G5 hits, Dubspinna's lead).
- **Pitches:** semitone peaks within 10 dB of the strongest, 30–120 ms after the onset, harmonics
  (+12, +19, +24, +28) of a stronger peak dropped; plus a half-bar sustained profile.
- **Names:** by hand per bar (or half bar when the halves differ), root + type, from the stab pitches
  first and the sustained profile second. A bar is ambiguous when two readings fit equally (for
  example E♭sus2 vs B♭sus4 vs B♭/D) or a lead covers the chord. "B♭?" = root sure, type not (counted
  for root only). Lost 77–84's G–B♭ dyads are labelled Gm (lowest note G, minor third, no fifth);
  that loop is the least sure.
- **Held:** a chord that sounds ≥ 1.5 beats (the 100–1200 Hz band within 12 dB of its start) with no
  labelled onset inside.
- **Lead:** a frame pitch track (strongest semitone, harmonics of a lower strong peak dropped) cut at
  onsets, reviewed by hand. Dubspinna's lead is doubled in 3 octaves, so any octave of the labelled
  pitch class counts there (marked `*`); Mason's needs the exact MIDI.

```
{"loop":"lost-69-76","track":"https://soundcloud.com/carbune/lost-in-the-loop-o-deibys","bpm":123.02,"originS":1.407,"loopStartMs":134068.4,"loopEndMs":149675.6}
  cells: 1:G7 2:G7 3:G7 4:G7 5:G7 6:G7 7:G7 8:amb
  onsets: [2.9,487.6,947.7,1455.6,1940.3,2427.9,2903.9,3404.6,3893.7,4378.4,4863.1,5360.9,5829.7,6327.4,6819.4,7296.9,7790.3,8282.3,8769.9,9257.5,9745.1,10234.2,10721.8,11208,11697.1,12183.2,12670.8,13158.5]
  ambiguous: [844.6,1274.2,2529.5,3812.4,4243.4,4761.5,6051.7,9153,9608.7,11091.9,11850.9,12347.2,12398,13691.1,13868.1,14338.3,14499.4,14618.4,14847.7,15106,15331]
{"loop":"lost-77-84","track":"https://soundcloud.com/carbune/lost-in-the-loop-o-deibys","bpm":123.02,"originS":1.407,"loopStartMs":149675.6,"loopEndMs":165282.8}
  cells: 1:Gm 2:amb 3:Gm 4:amb 5:Gm 6:amb 7:Gm 8:Gm
  onsets: [943.3,1918.5,2888,3870.5,4850.1,6799.1,7770,8746.7,9724.8,10701.5,11672.4,12653.4,14619.9]
  ambiguous: [204.6,464.4,683.5,806.9,1153.7,1400.5,1478.8,1573.2,1654.4,1738.6,2133.3,2449.7,2538.2,2635.5,2713.8,3108.6,3430.7,3538.1,3604.9,3735.5,4027.2,4076.6,4260.9,4372.6,4584.5,4732.5,5064.9,5333.3,5465.4,5549.6,5723.7,5800.6,5900.8,5980.6,6050.2,6536.4,7024,7254.8,7397,7513.1,7574.1,7999.3,8169.1,8225.7,8282.3,8414.3,8488.3,8597.2,8968.7,9215.4,9386.7,9457.8,9933.8,10152.9,10240,10438.8,10552,10925,11228.3,11327,11411.2,11505.5,11824.8,11898.8,12074.4,12177.4,12387.8,12525.7,12874,13141,13260,13361.6,13551.7,13635.9,13853.6,14004.5,14341.2,14418.1,14956.6,15468.8]
{"loop":"ret-57-64","track":"https://soundcloud.com/retrouve/music-is-the-answer","bpm":128,"originS":0.151,"loopStartMs":105151,"loopEndMs":120151}
  cells: 1:amb 2:amb 3:amb 4:Fm 5:Fm 6:Fm 7:Fm 8:amb
  onsets: [191.6,640,3938.7,4406,5812.2,6516.1,7690.2,8154.6,9562.3,10266.1,11086.1,11440.2,11904.6]
  ambiguous: [8.7,465.9,841.7,1111.7,1474.5,1772,1938.9,2065.1,2127.5,2275.6,2398.9,2488.9,2558.5,2641.3,2695,2796.6,3076.6,3147.8,3343.7,3475.7,3587.5,3831.3,4213,4638.2,5095.3,5494.4,6164.9,6896.3,6989.2,7218.5,7346.2,8037,8389.7,8781.5,9090.6,9218.3,9933.8,10462,10591.2,10736.3,10961.3,11788.5,12146.9,12618.6,12882.7,12968.3,13184.6,13370.3,13453.1,13573.5,14509.6,14730.2,14907.2]
{"loop":"ret-89-96","track":"https://soundcloud.com/retrouve/music-is-the-answer","bpm":128,"originS":0.151,"loopStartMs":165151,"loopEndMs":180151}
  cells: 1:amb 2:amb 3:amb 4:amb 5:amb 6:amb 7:amb 8:amb
  onsets: [79.8,537,654.5,1954.8,2761.7,3828.4,4288.4,4406,4645.4,5706.3,6510.3,7578.4,7816.4,8037,8156,8385.3,9454.9,10260.3,11331.3,11904.6,13206.3,14014.7]
  ambiguous: [316.4,885.3,1246.6,1718.3,2227.7,2413.4,2552.7,3121.6,3361.1,3446.7,3586,3961.9,4059.1,4996.6,5104,5230.3,5466.8,5940,6164.9,6416,6871.7,7053.1,7166.3,7363.6,7713.4,8619,8740.9,8852.6,9219.8,9690,9913.5,10524.4,10621.7,10747.9,11086.1,11460.5,11566.4,11787,12135.3,12393.7,12496.7,12602.6,12698.4,12807.3,12863.9,12969.8,13360.2,13440,13663.5,14371.7,14598.1,14807.1,14894.1]
{"loop":"ret-113-120","track":"https://soundcloud.com/retrouve/music-is-the-answer","bpm":128,"originS":0.151,"loopStartMs":210151,"loopEndMs":225151}
  cells: 1:amb 2:amb 3:amb 4:amb 5:Bb? 6:Bb? 7:Bb? 8:Bb?
  onsets: [653.1,1934.5,3829.8,4403.1,4995.2,5468.3,6162,7577,8035.6,8154.6,9218.3,9453.4,10274.8,11100.6,11903.1,12136.8,12968.3]
  ambiguous: [76.9,200.3,529.7,880.9,936.1,936.1,1134.9,1232.1,1584.8,1719.7,2089.8,2188.5,2410.5,2773.3,3060.7,3587.5,3661.5,4063.5,4287,4635.3,5702,5839.8,5937.1,6418.9,6526.3,6773,6870.2,7170.6,7341.9,7698.9,7812.1,8401.3,8663.9,9009.3,9572.4,9688.5,9912,10041.2,10508.5,10925,11327,11448.9,11563.5,11787,12493.8,12866.8,13138.1,13207.8,13321,13627.2,13781,14207.7,14358.6,14493.6,14850.6]
{"loop":"mason-17-24","track":"https://soundcloud.com/masonflint/tim-deluxe-feat-sam-obernik-it-just-wont-do-mason-flint-remix","bpm":126.05,"originS":0.11,"loopStartMs":30574.1,"loopEndMs":45806.2}
  lead [tMs, midi or pitch class*]: [[210.4,67],[1313.4,65],[1899.7,67],[3210.2,65],[3838.5,67],[5122.9,65],[5709.2,67],[7019.7,65],[7611.8,67],[8931,65],[9517.3,67],[10829.2,65],[11432.9,67],[12740.5,65],[13335.5,67],[14458.8,68],[14939.1,68],[15093,68]]
  leadAmbiguous: [162.5,1491.9,3448,3561.4,7245,7752.6,8311.3,9149,10618.8,11016.4,11969.9,13255.7,14130.8,14618.4]
{"loop":"lost-49-56","track":"https://soundcloud.com/carbune/lost-in-the-loop-o-deibys","bpm":123.02,"originS":1.407,"loopStartMs":95050.3,"loopEndMs":110657.5}
  cells: 1:Cm 2:D7 3a:D7 3b:Gm 4:amb 5:amb 6:amb 7:amb 8a:Gm 8b:amb
  onsets: [2.9,3366.9,3857.4,14103.2]
  ambiguous: [161.1,435.4,827.2,953.5,1072.5,1149.4,1277.1,1445.4,1565.9,1639.9,1880.8,1998.4,2129,2388.8,2503.4,2690.6,2774.8,3191.3,3684.7,4166.5,4329.1,5032.9,5156.3,5543.8,5815.1,6289.7,6500.1,6754.1,6983.4,7240.3,7494.2,7732.2,7983.3,8240.2,8337.4,8469.5,8547.8,8724.9,8958.5,9073.2,9467.9,9864.1,10187.8,10420,10541.9,10777,10839.4,10907.6,11160.1,11376.3,11538.9,11821.9,11881.4,12144,12279,12373.3,12615.7,12855.1,13345.7,13516.9,13765.1,13830.4,13947.9,14431.2,14570.5,14823,15066.8,15169.9,15288.9,15538.5]
{"loop":"dub-57-64","track":"https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha","bpm":125,"originS":1.091,"loopStartMs":108611,"loopEndMs":123971}
  cells: 1:Db 2:amb 3:Bbm 4:Bbm 5:Db 6:amb 7:Bbm 8:amb
  onsets: [429.6,676.3,2348.1,4033,4271,4506.1,4987.9,5703.4,8109.6,10026.7,11951,12187.6,12667.9,14210.6,14839]
  ambiguous: [185.8,795.3,863.5,918.6,1387.4,1648.6,1766.2,1870.7,1996.9,2107.2,2520.8,2828.5,2951.8,3181.1,3294.3,3435.1,3648.4,3792.1,4680.3,5236.1,5395.7,5598.9,5918.2,5976.2,6072,6249.1,6249.1,6340.5,6505.9,6671.4,6884.7,7143,7205.4,7391.2,7487,7632.1,7865.8,8227.1,8354.8,8591.4,8823.6,8923.7,9054.3,9219.8,9308.3,9422.9,9544.9,9784.3,10276.3,10370.6,10472.2,10866.9,10991.7,11103.5,11328.4,11470.7,11713,12911.7,13064.1,13164.3,13276,13386.3,13647.5,13926.2,14609.7,15088.6,15174.2,15341.1]
{"loop":"dub-141-148","track":"https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha","bpm":125,"originS":1.091,"loopStartMs":269891,"loopEndMs":285251}
  cells: 1a:Db 1b:Eb 2a:amb 2b:Bb? 3:Bbm 4a:amb 4b:Db 5a:Db 5b:Eb 6a:amb 6b:Bb? 7:Bbm 8a:amb 8b:Db
  onsets: [94.3,420.9,666.1,904.1,1756,2020.1,2348.1,2587.6,2827,3676,3932.9,4266.7,4504.7,4987.9,5225.9,5596,6426.1,6665.6,7516,7775.8,8100.9,8344.7,8584.1,9436,9700.1,10026.7,10267.6,10507,11353.1,11610,11946.7,12186.1,12667.9,12905.9,13274.6,14103.2,15196]
  ambiguous: [1378.7,1632.7,2702.2,3310.3,3555.6,5871.7,6092.3,6182.3,6304.2,7147.4,7389.8,7862.9,9070.3,9312.7,10991.7,11710.1,13387.8,13551.7,13868.1,14347,14827.4,15065.4,15306.3]
{"loop":"dub-105-112","track":"https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha","bpm":125,"originS":1.091,"loopStartMs":200771,"loopEndMs":216131}
  cells: 1:amb 2:amb 3:Bbm 4a:Bbm 4b:amb 5:amb 6:amb 7:Bbm 8a:Bbm 8b:amb
  onsets: [423.8,801.1,1380.1,1619.6,1863.4,2342.3,3301.6,4022.9,4501.8,4745.6,4982.1,6421.8,6561.1,7143,8103.8,8481.1,9060.1,9299.6,9543.4,10022.3,10981.6,12181.8,12425.6,12669.4,14101.8,15066.8,15194.6]
  ambiguous: [2.9,185.8,274.3,3070.8,3546.8,4362.4,5079.4,5472.7,5710.7,5937.1,7392.7,7632.1,7865.8,7954.3,10749.4,11226.8,11701.4,12987.2,13151.2,13389.2,13538.7,13630.1,14236.7,14364.4,14586.5,14850.6]
  lead [tMs, midi or pitch class*]: [[801.1,"7*"],[1380.1,"10*"],[1619.6,"0*"],[1863.4,"8*"],[2342.3,"7*"],[3070.8,"3*"],[3301.6,"5*"],[6561.1,"7*"],[7143,"10*"],[8481.1,"7*"],[9060.1,"10*"],[9299.6,"0*"],[9543.4,"8*"],[10022.3,"7*"],[10749.4,"3*"],[10981.6,"5*"]]
  leadAmbiguous: [7392.7,14586.5,15066.8,15194.6]
{"loop":"dub-73-80","track":"https://soundcloud.com/dubspinna/whats-a-girl-to-do-dubspinna-festival-remix-fatima-yamaha","bpm":125,"originS":1.091,"loopStartMs":139331,"loopEndMs":154691,"heldOut":true}
  cells: 1:amb 2:amb 3:Bbm 4a:Bbm 4b:amb 5:amb 6:amb 7:Bbm 8a:Bbm 8b:amb
  onsets: [820,1638.5,1882.3,2368.4,4522.1,4764.4,5008.3,6442.1,6581.4,8501.4,9079,9318.5,9562.3,10045.5,12200.6,12688.3,14120.6,14261.4]
  ambiguous: [204.6,442.6,686.4,1399,3089.7,3320.5,3565.7,4040.3,4407.4,5278.2,5491.5,5725.2,5877.6,5971.9,7163.4,7411.5,7669.8,7884.6,8122.6,8366.4,10769.7,11000.5,11245.7,11720.3,12074.4,12444.4,12924.8,13171.5,13416.8,13634.5,13881.2,14611.2,14843.4,15093,15217.8]
```

## Results

Scoring (`scratchpad` scorer, rules as in `evals.md`):
- **H1** per labelled cell; a reader cell overlapping it counts by its share of the cell. Families:
  major (maj, maj7), minor (m, m7), dominant 7, sus (sus2, sus4), dim.
- **H2** one-to-one match within 30 ms; extra = read events matching no labelled or ambiguous onset;
  best global shift per loop searched over ±40 ms.
- **H5** root + family of the label among the guess and its first 3 alternatives.
- **H16** wall time of `chordsRead` from the call, with the loop already in memory; the worker's own
  `ms` in brackets.

Every repeat read gave identical cells and events (A 2/2 per loop, B 2/2 where read twice), and
**every one of the 29 B reads logged `(basic-pitch)`** (BP-1 fixed, T145), in 8 page loads.

### Per loop

| Loop | Reader | H1 root + family | H1 root | H5 | H2 found / extra (best shift) | H16 wall (worker) ms |
| --- | --- | --- | --- | --- | --- | --- |
| Lost 69–76 | A | 0 % (0/7) | 100 % | 100 % | 96.4 / 3.3 % (0 ms; 28 onsets, 30 events) | 687 (448), 430 |
| | B | 0 % | 100 % | 0 % | 100 / 9.4 % (0 ms) | **8,871** (first B read of the session), 748 |
| Lost 77–84 | A | 80 % (4/5) | 80 % | 100 % | 100 / 8.0 % (0 ms; 13, 25) | 645, 424 |
| | B | 80 % | 80 % | 80 % | 100 / 14.3 % (0 ms) | 769, 739 |
| Lost 49–56 | A | 60 % (3/5) | 80 % | 80 % | 100 / 7.1 % (0 ms; 4, 14) | 631, 398 |
| | B | 80 % | 80 % | 80 % | 100 / 43.5 % (0 ms) | 1,023, 937 |
| Retrouvé 57–64 | A | 25 % (1/4) | 25 % | 50 % | 100 / 23.7 % (0 ms; 13, 38) | 694, 455 |
| | B | 0 % | 0 % | 0 % | 7.7 / 50 % (2 events) | 702 |
| Retrouvé 89–96 | A | – (names ambiguous) | – | – | 100 / 11.1 % (0 ms; 22, 72) | 716, 517 |
| | B | – | – | – | 27.3 / 0 % (−16 ms; 8 events) | 728 |
| Retrouvé 113–120 | A | – (root only) | 100 % (4/4) | – | 100 / 18.6 % (0 ms; 17, 70) | 759, 616 |
| | B | – | 37.5 % | – | 41.2 / 12.5 % (−12 ms) | 736 |
| Dubspinna 57–64 | A | 60 % (3/5) | 80 % | 100 % | 100 / 7.5 % (0 ms; 15, 53) | 668, 425 |
| | B | 60 % | 100 % | 100 % | 86.7 / 9.7 % (−14 ms) | 1,508, 992 |
| Dubspinna 141–148 | A | 25 % (2/8) | 100 % (10/10) | 100 % | 100 / 0 % (0 ms; 37, 52) | 833, 607 |
| | B | 62.5 % | 60 % | 62.5 % | 78.4 / 31.7 % (0 ms) | 749, 889 |
| Dubspinna 105–112 | A | 25 % (1/4) | 75 % | 75 % | 100 / 9.1 % (0 ms; 27, 44) | 745, 543 |
| | B | 0 % | 75 % | 75 % | 85.2 / 32.7 % (0 ms) | 749 |
| **Dubspinna 73–80 (held out)** | A | **0 % (0/4)** | **50 %** | 50 % | **100 / 8.3 %** (0 ms; 18, 48) | 767, 537 |
| | B | 25 % | 50 % | 50 % | 94.4 / 37.9 % (0 ms) | 1,039, 878 |

### Pooled (9 loops, 3 tracks; held-out loop separate)

| Eval | Bar | Reader A (DSP) | Reader B (Basic Pitch) | Held out, A / B |
| --- | --- | --- | --- | --- |
| **H1** root + family | ≥ 70 % | **36.8 %** (14/38 bars) | **42.1 %** (16/38) | 0 % / 25 % (4 bars) |
| **H1** root alone | ≥ 80 % | **84.1 %** (37/44) | 69.3 % (30.5/44) | 50 % / 50 % |
| **H2** onsets within 30 ms | ≥ 90 %, ≤ 15 % extra | **99.4 % found, 10.6 % extra** (175/176; 42/398), best shift 0 ms on every loop | **70.5 % found, 23.9 % extra** (124/176; 60/251); best shifts 0 to −16 ms; at 0 ms 67.0 / 27.1 % | 100 / 8.3 % ; 94.4 / 37.9 % |
| H3 held chords stay held | ≥ 80 % | not gradable: 1 held chord labelled (see below) | same | – |
| H4 lead (reported) | target ≥ 70 % found, ≤ 20 % wrong, 2 riffs | 41.2 % found (14/34), 69.1 % wrong (47/68) | 79.4 % found (27/34), 62.8 % wrong (59/94) | – |
| H5 one tap away | ≥ 90 % | 89.5 % (34/38) | 55.3 % (21/38) | 50 % / 50 % |
| H16 read time, loop in memory | ≤ 3 s | **0.37–1.43 s** (38/38 reads on all 19 loops read; 0.40–0.85 s on the graded ones) | 0.60–2.22 s on 28/29 reads; **8.87 s** on the first B read of the session (model fetch + first WebGL compile) | – |

**Spike gate (H1 and H2):** A fails on H1 (root + family), passes H2. B fails both. **No reader passes.**

### H4, the two riffs

| Riff | Reader | Found (onset ≤ 50 ms, right pitch) | Wrong | Lead from |
| --- | --- | --- | --- | --- |
| Mason 17–24 (G4 held, F4 stab, G♯4 turn; 18 notes) | A | 66.7 % (12/18) | 31.8 % (7/22) | top-line |
| | B | 66.7 % (12/18) | 33.3 % (9/27) | Lead row |
| Dubspinna 105–112 (Fatima Yamaha line, octave-doubled; 16 notes) | A | 12.5 % (2/16) | 87.0 % (40/46) | top-line |
| | B | 93.8 % (15/16) | 74.6 % (50/67) | Lead row |

B finds the Dubspinna line but adds the B♭m stab tones as lead notes; A's top line follows the stab
tops, not the line. Neither meets the ≤ 20 % wrong target (L249: reported, not a gate).

### H3: why it isn't graded

Every labelled chord in the 10 loops is struck or plucked: the 194 labelled onsets decay 12 dB in
70–1,345 ms (median 179 ms). Six ring ≥ 1.5 beats; four are lead notes, one is re-struck inside, so
**one** held chord is left (Dubspinna 141–148 at 5,596 ms, B♭m7, 746 ms). A plays it as 3 struck
events, B as 5 (0/1 each). The pad-like loops found (Kiki 49–56, Lost 49–56) have no chord
boundaries I could label honestly. The reverse case passes: no struck chord was read as held (A 0 of
193 matched onsets, B 0 of 135).

## Failures and repro

Repro for all: the sandbox and Chrome as above, open the track's map (`/map?id=<url>&quiet=1`), Play,
`__sixamLab.setLoop(loopStartMs, loopEndMs)` with the times in the fixture, then
`await __sixamLab.chordsRead("dsp" | "basic-pitch")`.

**CH-1. Reader A names the root but drops the chord's colour: the 7th and the minor third lose to a
triad or a sus2.** This is most of A's H1 miss: 24 of 38 typed bars are wrong, while the root is wrong on only 7 of 44
cells.
- Lost 69–76 (the G7 stab, G3 D4 B4 F5): 7/7 bars read **G**. G7 is the first alternative
  (0.947 against G's 0.984), so H5 passes.
- Dubspinna B♭m (B♭ D♭ F, with C from the voicing and the lead): read **B♭sus2** on 5 of 9 B♭m cells (and 2 of 4 held out)
  (score 0.962; B♭m 0.828, third alternative). Db reads C♯sus2 on 2 of 4 halves; E♭ reads E♭sus2.
- Likely cause: cosine against templates of different sizes favours 3-note templates when the 4th
  tone is weaker than the others, and a strong 9th (C over B♭, A over G) tips minor and major chords
  into sus2. The 0.15 root bonus helps the root, not the family.

**CH-2. Reader A on Retrouvé 57–64: F minor stabs read as other chords.** Bars 4–7 (F4 A♭4 C5 stabs,
G5 on top) read C♯maj7, Csus4, Fm, A♭maj7. D♭maj7 and A♭maj7 contain the F–A♭–C triad, so the bar
chroma (with the pad's D♭ and the G5 hits) pulls to a 4-note chord with another root. Root right 1/4.

**CH-3. Reader B (Basic Pitch) still reads the Lost G7 stab as a low line.** 7/7 bars read **Gm**,
with G, Gsus2, Gsus4 tied at 0.727 behind it: the folded notes carry G and D and almost nothing
else, as in Phase 5 (B heard a G2 line). H5 0/7 on that loop. BP-1 is fixed (29/29 reads used the
model), so the 13 % of Phase 5 was not the scope bug.

**CH-4. Reader B misses whole parts.** Retrouvé 33–40: 0 events. Retrouvé 57–64: 2 events for 13
labelled onsets (7.7 % found); 89–96: 8 events for 22. On the Dubspinna plucks it adds 31–38 %
extra events. B's H2 fails mainly on Retrouvé's short plucks and Dubspinna's busy loops.

**CH-5. Mid-bar changes are missed or misplaced.** Lost 49–56 bar 3 (D7 then Gm) reads Gm for the
whole bar with both readers; Dubspinna 141–148 bars 1 and 5 (D♭ then E♭) are split by A but as
C♯sus2 / E♭sus2.

**CH-6 (H16, B only). The first Basic Pitch read of a session takes 8.9 s.** Later first reads in a
new page take 1.0–2.2 s (the model is in the HTTP cache), repeat reads 0.6–1.0 s. Reader A is
0.37–1.43 s everywhere.

## What wasn't checked

- By ear: none of the labels or the four new maps (owner checks).
- H3 on real pads: no labelled held chord apart from one (above). A pad loop with clear chords is
  still needed (the owner may know one in these tracks).
- The "knobs live ≤ 35 s" half of H16: Make's Melody tab is still off (`MELODY_ON = false`), so only
  the read time was measured.
- H6–H16 other than H16's read time (no slice built yet).
- The labelling method on a known-truth bench for half-bar names and dyads (Phase 5's validation was
  struck chords, note sets only).
- Kiki's lead (swapped out with the chords); Mason 41–48's lead (octave-ambiguous).

Cost: $0 (no Mentor, no Stable Audio; keys empty in the sandbox). Time: the 4 maps 3.5–7.6 min each
(one play), 18–21 s to fill each 8-bar loop, then 0.4–2.2 s per read (8.9 s for the first B read).
