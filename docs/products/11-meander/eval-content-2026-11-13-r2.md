# Meander content eval, round 2: re-grade after the fix pass (13 Nov 2026)

Grader: `data-evals` (I didn't write the content or the fixes). Same corpus, same rubric (`scratchpad/grader/rubric.txt`) and same bars as round 1 (`eval-content-2026-11-13.md`). The new rows are appended to `eval-content-log.jsonl` with `"round": 2`; the round-1 rows are kept.

## What was re-graded
- **Scope.** `revisions.json` lists 218 items. Diffing `full.json` against the round-1 commit (`4af515d`) gives 219 changed items in my item scheme. A few listed revisions map onto one item (e.g. `date_range` and `era` live inside "description"). Six changed items weren't listed but were re-graded anyway, because their sources changed:
  - Adorno: dates
  - Enlightenment: description
  - Duns Scotus: dates
  - Ockham: dates
  - Skepticism: debatable
  - Bentham: summary

  One link was cut: Rationalism → Ancient Skepticism. There are now 56 links.
- **Prompt card checks.** I also re-ran the card check on 10 study prompts whose text didn't change but whose card (summary or key ideas) did, because bar 4 compares the prompt to the card.
- **Who graded what.** That makes 229 items in 121 tasks.
  - **115 items (47 tasks)** were graded by the same judge as round 1 (`claude-opus-5-5` via the API, same rubric). These are the schools from the Presocratics to Rationalism, and their thinkers.
  - **114 items (74 tasks)** were graded by me in this session, using the same rubric and the same model. Partway through, the API returned *"You have reached your specified API usage limits. You will regain access on 2026-12-01"*. I checked each new or changed sentence and each round-1 failure against the cited section text. The probes are in `scratchpad/grader/p1.json`, `p1b.json`, `p2.json` and `p3.json`. These rows are marked `judge: ... in-session`. They are logged per changed sentence, not per atomic claim, so the round-2 claim total isn't directly comparable to round 1's.
- **Unchanged items** keep their round-1 verdicts.

## Results per bar (before → after)

| Eval | Metric | Bar | Round 1 | Round 2 | Pass/fail |
|---|---|---|---|---|---|
| 1. Sourced | source URL in corpus and section exists | 100% | 100% | **100%** (23 schools, 115 themes, 88 thinkers, 88 dates, 112 link copies of 56 links, 69 questions, 23 reacted-against, 264 key ideas, 88 prompts). `links.json` and `full.json` agree. | **PASS** |
| 2. Supported | claims judged against their cited sections | 0 wrong, every unsupported fixed or cut | 2,540 supported, 282 unsupported, **3 wrong** (89.9%). 200 of 833 items failing. | **2,527 supported, 16 unsupported, 0 wrong** (99.4%). **14 of 832 items failing.** | **FAIL** (0 wrong is met; 16 unsupported remain) |
| 3. Links | link kind supported by its cited section | 100% | 56/57; 20 links with an unsupported label or reason | **56/56**; 0 links with an unsupported label or reason | **PASS** |
| 4. Study prompts | prompt mentions only ideas on its card | 100% | 52/88 | **78/88** | **FAIL** |
| 5. No sample content | `"sample": true` count | 0 | 0 in content; 74 in the app's `src/content` | **0** in the content and **0** in the app | **PASS** |
| Hand spot-check | 20 random claims from the changed items, checked by hand | 20/20 | 20/20 | **20/20** correct. The judge agreed on all 20 (log rows marked `hand_spot_check`). | **PASS** |

**All 3 wrong claims from round 1 are fixed:**
- **Skepticism description:** it now says "suspended judgment and kept investigating"; supported.
- **Erasmus:** it now says he broke with Luther over sectarianism and debated him on free will; supported.
- **Heidegger:** "the beings he called Dasein, whose kind of being he called existence"; supported.

**Hand override in round 2 (1):** the judge marked the Skepticism date range "3rd century BCE – 2nd century CE" unsupported, but the evidence it quoted says exactly that ("begin roughly in the third century BCE, and end with Sextus Empiricus in the second century CE"). I changed it to supported.

**Every round-1 failure outside the fix list was already supported.** All 16 remaining unsupported claims are in revised items. 9 come from rewritten text and 7 are leftovers the rewrite didn't fully fix.

## Still unsupported (16 claims in 14 items)

| School | Item | Claim | Cited source | What the source says | Suggested fix |
|---|---|---|---|---|---|
| Socrates and Plato | description | SEP calls the Forms the most basic distinction in Plato's thought | SEP Plato §1 | "The most fundamental distinction in Plato's philosophy is between the many observable objects that appear beautiful … and the one object that is what beauty … really is" | "…the distinction between the many things we observe and the one Form each shares in, which SEP calls the most fundamental distinction in Plato's philosophy." |
| Socrates and Plato | theme 5 | We know him mainly through Plato and Xenophon | SEP Socrates §2 | The three primary sources are Aristophanes, Xenophon and Plato | "…mainly through Plato, Xenophon and the comic playwright Aristophanes, whose portraits differ a lot." |
| Socrates and Plato | Socrates summary | He changed how philosophy itself is understood | SEP Socrates intro | "is considered one of the handful of philosophers who forever changed how philosophy itself was to be conceived" | Restore the hedge: "…he is considered one of the few philosophers who changed how philosophy itself is understood." |
| Socrates and Plato | Plato study prompt | Plato turned philosophy into a systematic discipline | SEP Plato intro | Philosophy "as it is often conceived" as a rigorous, systematic examination "can be called his invention" | "…whose conception of philosophy as a rigorous, systematic discipline can be called his invention" (also matches the card) |
| Epicureanism | description | The school's date range ends in the 1st century BCE | SEP Epicurus §3 | No end date is given; Epicurean views are still discussed "in Sextus' time, late 2nd century C.E." | "late 4th century BCE onward (featured thinkers to the 1st century BCE)" |
| Epicureanism | description | Freedom from fear of the gods | SEP Epicurus intro | The cited text says only that the gods don't concern themselves with humans | "…freedom from fear of death, and gods who are unconcerned with human affairs." |
| Stoicism | description | Its period ends in the 2nd century CE | SEP Stoicism intro | No end date; its popularity continued "in the Roman period and beyond" | "c. 300 BCE onward (major figures through the 2nd century CE)" |
| Stoicism | Epictetus summary | Arrian wrote up Epictetus's teaching as the Discourses | SEP Epictetus §1 | The preface says Arrian wrote them up; a few scholars (Dobbin) think Epictetus composed them himself | "According to their preface, the Discourses were written up by Arrian, though a few scholars think Epictetus composed them himself." |
| Neoplatonism | theme 2 | Reality emerges from the One in stages, not all at once | SEP Neoplatonism §3 | Emergence is eternal; "there is no process of generation … nothing material or spatial is happening" | "Reality emerges from the One as a hierarchy of levels, eternally rather than step by step in time." |
| Early Christian | theme 3 | This view keeps God from being evil's author | SEP Augustine §7.5 | It credits Manichean dualism, not the privation view, with freeing God from responsibility; evil will has a "deficient" cause in the will's own turning away | Cut, or: "Everything God made is good; evil comes from the will's own turning away from God." |
| Early Christian | Boethius key idea 1 | The true goods are the virtues | SEP Boethius §5 | The true goods are the virtues **and** sufficiency | "…the true goods are the virtues and sufficiency." |
| Scholasticism | description | It began in the 12th century | SEP Medieval Philosophy §2.5 | Paris became the centre of Latin philosophy in the twelfth century; no start date is given for "scholasticism" | "flourishing from the 12th-century Paris schools onward" |
| Scholasticism | description | It lasted until around 1700 | SEP Medieval Philosophy §5.2 | Around 1700 is only "a plausible" and "radical" suggestion for when medieval philosophy ended | "…to perhaps around 1700" |
| Scholasticism | reacted-against | The school as a whole answered these two groups | SEP Abelard §7 | Describes only Abelard's conflicts with the anti-dialecticians and the pseudo-dialecticians | "Abelard answered both those who wanted no reasoning in matters of faith and those he called pseudo-dialecticians…" |
| Renaissance | description | It spans the 14th–16th century | IEP Renaissance intro | "roughly from the middle of the fourteenth century to the beginning of the seventeenth century" | "roughly mid-14th to early 17th century" |
| Pragmatism | Rorty summary | Among the pragmatists, he drew most on Dewey | SEP Rorty intro, §4.2 | "sought to integrate and apply the milestone achievements of Dewey, Hegel and Darwin"; his "heterodox reading of Dewey" | "He set out to combine Dewey, Hegel and Darwin, though many pragmatist scholars dispute his readings of Dewey and Peirce and even his right to the label." |

## Study prompts still going beyond their card (10)

| Prompt | Status | Not on the card | Suggested fix |
|---|---|---|---|
| Parmenides | **not revised** | "cannot … change"; the card says only that what is cannot come into being or pass away | "what truly is cannot be born or perish; it is whole, unshaken and complete" |
| Philodemus | revised; still fails | "Epicurean teacher"; the card says only that he studied at the school | "an Epicurean philosopher and poet" |
| Carneades | new in round 2 | "famous for arguing both sides"; the card says "is said to have argued for justice one day and against it the next" | "said to have argued both sides of justice" |
| Peter Abelard | revised; still fails | "Paris" is not on the card | Drop "Paris", or add it to the card with a source |
| Lorenzo Valla | new in round 2 | "sharp-tongued critic" is a characterisation not on the card | "a leading humanist and critic of established ideas and institutions" |
| Erasmus | new in round 2 | "Dutch"; the card says "of Rotterdam" | "a Christian humanist from Rotterdam" |
| Schelling | **not fixed** | "art" ("of nature, art and the critique of Hegel") | Cut "art", or add an art key idea to the card with a source |
| Sartre (phenomenology) | **not revised** | "French" and "existentialist" are not on this card | "the philosopher and writer behind Being and Nothingness" |
| Adorno | re-cited; still fails | "negative dialectics" and "of the Frankfurt School" are not on the card | Add both to the card (SEP Adorno §5 and the intro support them), or reword the prompt |
| Deleuze | **not revised** | "desiring-production"; "difference without negation" is stronger than the card | "desire as a productive force in society"; "difference as productive, not just the negation of identity" |

## Cost and time
- **Judge calls.** 47 calls to `claude-opus-5-5`, with 0.64M input and 0.09M output tokens. That's about $5, assuming $5/$25 per million tokens. The calls took 700 s in total with 8 running at once, so about 2 minutes of wall time.
- **API limit.** The remaining 74 calls failed on the account's API usage limit, which resets on 1 Dec 2026. Raising it needs the owner's account.
- **In-session grading.** I graded the 114 remaining items in this session. That cost no extra API spend and took about 40 minutes.
- **Both rounds together.** 215 API calls, about $28.

## Not checked
- **In-session grading (114 items) is my own reading of the source text, not the API judge's.** It follows the same rubric and the same model, but I checked per changed sentence plus each round-1 failure, using the probe hits rather than re-reading every full section. If the owner wants the two halves graded identically, those 74 tasks can be re-run with `run_r2.py` after the limit resets. The outputs are cached, so nothing gets graded twice.
- **Unchanged items weren't re-read.** They keep their round-1 verdicts.
- **Whether the corpus itself is correct** (same as round 1).
