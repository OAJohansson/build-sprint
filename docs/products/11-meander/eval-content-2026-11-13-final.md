# Meander content eval: final grade, round 3 (13 Nov 2026)

Grader: `data-evals`. I didn't write the content or any of the fixes. Ground truth is only the saved SEP/IEP corpus, judged with the same rubric (`scratchpad/grader/rubric.txt`) and the same bars as the earlier rounds. Earlier reports: `eval-content-2026-11-13.md` (round 1) and `eval-content-2026-11-13-r2.md` (round 2). Round-3 rows are appended to `eval-content-log.jsonl` with `"round": 3`.

## How each round was graded
| Round | Graded | By whom |
|---|---|---|
| 1 | All 833 items (2,825 atomic claims) | API judge (`claude-opus-5-5` with the written rubric), one call per school, thinker and link. I hand-checked the 5 "wrong" verdicts, 20 random claims and 15 random "unsupported" verdicts. |
| 2 | 229 changed items | 115 by the API judge. 114 by me in-session, after the API hit the account's usage limit. |
| 3 | 81 changed items (102 claims) | All by me in-session. The API is still over its limit (it resets 1 Dec 2026). |

**Method caveat.** About 195 of the 855 items in the final picture were last graded in-session by me, not by the API judge: 114 items from round 2 and 81 from round 3. It's the same model and the same written rubric, judged against the same corpus. But the procedure differs:
- **API judge:** reads every cited section in full and splits each item into atomic claims.
- **In-session (me):** checked each new or changed sentence, and each earlier failure, against the cited sections. I used targeted searches of the section text (the probe files in `scratchpad/grader/`, quoted as evidence in the log), not a full re-read of every section.

Those in-session verdicts haven't been checked by a second grader. For the clean API-judged version that the bar asks for ("read next to its cited source by a grader that didn't write it"), re-run them when the limit resets. The outputs are cached, so nothing is graded twice. Because round-1 rows are atomic claims and in-session rows are mostly whole sentences, the claim totals below aren't strictly comparable across rounds. The item counts are.

## Before and after, per bar

| Eval | Bar | Round 1 | Round 2 | Final (round 3) | Pass/fail |
|---|---|---|---|---|---|
| 1. Sourced: URL in the corpus and section exists | 100% | 100% | 100% | **100%**: 23 schools, 23 taglines, 115 themes, 88 thinkers, 88 dates, 56 links (112 copies), 69 questions, 23 reacted-against, 264 key ideas, 88 prompts. `links.json` and `full.json` agree. | **PASS** |
| 2. Supported: claims judged against their cited sections | 0 wrong; every unsupported fixed or cut | 2,540 supported / 282 unsupported / 3 wrong; 200 of 833 items failing | 2,527 / 16 / 0; 14 of 832 items failing | **2,505 / 6 / 1 wrong; 7 of 855 items failing** | **FAIL** |
| 3. Links: kind supported by the cited section | 100% | 56/57 kinds; 20 links with an unsupported label or reason | 56/56; 0 | **56/56 kinds.** But 1 rewritten label is **wrong** (Stoicism → Aristotle), and 1 label reads ambiguously from one end. | **PASS** on kinds; the label failure is counted in bar 2 |
| 4. Study prompts mention only what's on the card | 100% | 52/88 | 78/88 | **88/88** | **PASS** |
| 5. No `"sample": true` | 0 | 0 in the content, 74 in the app | 0 / 0 | **0 / 0** | **PASS** |
| Hand spot-check, 20 random claims | 20/20 | 20/20 | 20/20 (changed items) | **20/20 across all content and all three rounds** (log rows `record: hand_spot_check_final`) | **PASS** |

## Still failing (7 items)

| # | Verdict | School | Item | Claim | Cited source | What the source says | Suggested fix |
|---|---|---|---|---|---|---|---|
| 1 | **wrong** | Stoicism | link label, Stoicism → Aristotle | "non-rational soul rejected" | SEP Stoicism §2.9 | The Stoics rejected the Platonic-Aristotelian non-rational **parts** of the mature human soul, and the same section says animals have non-rational souls. The new label says the opposite. (The round-2 label "the divided soul rejected" was supported.) | Revert to "divided soul rejected" |
| 2 | unsupported | Enlightenment | tagline | "…ending in Kant's limits of reason" | SEP Kant §2.1, §2.2 | Kant wrote the Critique "toward the end of the Enlightenment, which was then in a state of crisis", as culture shifted "toward Romanticism". Nothing says the Enlightenment ended in Kant. | "Trust in reason and science to question authority; near its end, Kant set out reason's limits." |
| 3 | unsupported | Critical Theory | tagline | "…criticises domination…" | SEP Critical Theory intro, §1.1 | It aims at "a critique and transformation of society" and at "furthering emancipation"; "domination" doesn't appear in the cited sections. | "Marxist social philosophy that critiques society and aims at emancipation." |
| 4 | unsupported | Stoicism | tagline | "Live in agreement with nature, **because** virtue is the only good" | SEP Stoicism §4.2, §4.3 | Virtue is the only good, and it is what's "necessary and sufficient to live in agreement with nature". The source makes virtue the means, not the reason; the "because" is a causal link it doesn't make. | "Virtue is the only good, and living virtuously means living in agreement with nature." |
| 5 | unsupported | Post-structuralism | tagline | "…and foundations" | SEP Postmodernism intro, §1 | The text destabilizes "presence, identity, historical progress, epistemic certainty, and the univocity of meaning"; no foundations. | Replace "foundations" with "certainty" |
| 6 | unsupported (citation) | Neoplatonism | tagline | "derives all of reality from one first principle, the One" | SEP Neoplatonism intro, §1 | Not in the cited sections. §2 "The One" (not cited) says the system explains everything "on the basis of just one metaphysical principle". | Keep the text; cite SEP Neoplatonism §2 (and §3) |
| 7 | unsupported (citation) | Scholasticism | Abelard study prompt | "the leading philosopher, theologian and logician of the twelfth century" | SEP Abelard §2, §6; Medieval §2.5 | It's on the card, sourced to SEP Abelard intro, but the prompt doesn't cite the intro. | Add SEP Abelard intro to the prompt's sources |

Items 6 and 7 are citation fixes only; the text is correct against the corpus.

## The three taglines you asked me to look at hardest
- **Pragmatism** ("Make ideas clear by asking what practical difference they make"): **supported.** SEP Pragmatism §2 says James and Peirce used "pragmatism" as the name of a method or maxim "for clarifying concepts and hypotheses", and §2.1 gives the pragmatic maxim. It's a fair but narrow compression: it describes the founders' maxim, not Dewey's social turn or Rorty's anti-representationalism.
- **Existentialism** ("Philosophy that starts from the single person who must choose how to live"): **supported.** The SEP intro says it "begins in medias res, amidst our own situated, first-person experience", that we create ourselves "through our choices", and that projects matter "to each of us as individuals".
- **Enlightenment:** "Trust in reason and science to question authority" is **supported**, but "ending in Kant's limits of reason" is **not** (failure 2 above).
- **The other 20 taglines** are supported, apart from the four failures above (Critical Theory, Stoicism, Post-structuralism, Neoplatonism). All 23 taglines are sourced.

## Link labels read from either end (34 rewritten)
In the app, a label sits next to the neighbour on both cards, with a verb that depends on which end you're reading from (`verbFor` and `reasonFor` in `src/lib/content.ts`). 33 of the 34 new labels are supported. 32 are neutral noun phrases that read correctly from both ends (e.g. "Kant's synthetic a priori banned", "Hegel's history inverted", "Epicureanism rejected outright").
- **Wrong:** "non-rational soul rejected" (failure 1).
- **Ambiguous from one end:** "Academy student, then Forms critic" (Aristotle → Socrates and Plato). It's supported (SEP Aristotle §1, §9), but it names Aristotle's role. On Aristotle's own card it appears beside "Socrates and Plato" and can read as if they were the Academy student. Suggest "Plato's Academy, then the Forms criticised". Not counted as a factual failure.
- **Style note:** 7 labels run past the 2–4 word schema, e.g. "Locke, then Kant's answer to Hume" (6 words) and "Aristotle's Metaphysics as starting point" (5). That's not an accuracy issue.

## Earlier failures, now fixed
- **All 16 round-2 unsupported claims are fixed** and supported, apart from the Abelard prompt citation (failure 7, which is new).
- **All 10 failing study prompts now pass the card check.** Schelling drops "art"; Adorno drops "negative dialectics" and "Frankfurt School"; Parmenides, Philodemus, Carneades, Abelard, Valla, Erasmus, Sartre (Phenomenology) and Deleuze are all reworded to their cards.
- **Prompts whose card changed this round:** Socrates, Epictetus, Boethius and Rorty still match their updated cards.

## Cost and time
- **Round 3:** no API spend, because the judge is over its limit. About 45 minutes of in-session grading.
- **All rounds:** 215 API judge calls, 2.9M input and 0.56M output tokens. That's about $28, assuming $5/$25 per million tokens; the exact Opus 5.5 rate wasn't checked.

## Not checked
- **No second grader.** The ~195 in-session items haven't been checked by the API judge (see the method caveat). To close that, re-run when the limit resets.
- **Unchanged items weren't re-read in round 3.** They keep their earlier verdicts.
- **The corpus itself isn't verified.** Example: Xenophon's "±386" death date comes from SEP's own section heading.
- **The app itself wasn't checked.** I graded the content files only. Label placement and verbs are read from the code, not from screenshots.
