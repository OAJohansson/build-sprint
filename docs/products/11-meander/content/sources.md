# Meander content: schema and sources note

This folder has four files. Researched 13 Nov 2026; owner defaults applied as decision L17.
- `schools.json`: 23 schools.
- `links.json`: 57 links between them.
- `full.json`: the full learner content for every school.
- `sources.md`: this note.

## Schema

### Sources
Every source is `{ "url", "section" }`.
- `url` is an SEP (plato.stanford.edu/entries/…) or IEP (iep.utm.edu/…) entry.
- `section` is the exact section heading in that entry. `"intro"` means the entry's opening text before section 1.
- Link sources can also carry `quote`: a word-for-word phrase of under 15 words from that section.

### Grader copy of the sources
The full text of every cited entry is saved as plain text in `/private/tmp/claude-501/-Users-ante-Workplace-build-sprint/d85d1318-e983-4d89-8a89-976011c59890/scratchpad/meander-sources/`. There is one file per entry, named `sep-<slug>.txt` or `iep-<slug>.txt`, and `index.json` maps each URL to its file. Each line reads `[Section heading] paragraph`.

### schools.json
An array of school objects:
```
id, name, era, date_range, description, debatable (string | null),
thinkers: [{ name, dates, source (url) }],
sources: [{ url, title, sections: [heading, ...] }]
```

### links.json
An array of link objects:
```
from, to (school ids),
kind: "built_on" | "pushed_against" | "built_on_then_pushed_against",
label (2–4 words, shown beside the neighbour),
reason (one line),
sources: [{ url, section, quote? }]
```
The kind is read from → to. "Built on, then pushed against" is used for three pairs:
- Aristotle → Socrates and Plato.
- The Enlightenment and Kant → Rationalism: the Enlightenment built on Descartes, then Kant pushed against Leibniz-Wolff rationalism.
- The Enlightenment and Kant → Empiricism: the Enlightenment built on Locke, then Kant answered Hume.

### full.json
An array with one object per school, in timeline order:
```
id, name, era, date_range, description, debatable
questions: [3 × { text, sources }]
themes: [5 × { title, text, thinkers: [names], sources }]
reacted_against: { text, sources }
links: [{ neighbour, neighbour_name, direction: "out" | "in", kind, label, reason, sources }]
       ("out": this school is the "from"; "in": the neighbour links to this school)
thinkers: [{ name, dates, summary, sources,
             key_ideas: [3 × { text, sources }],
             study_prompt: { text, sources } }]
sources: [{ url, section }]   (school-level)
```

## Counts
- 23 schools: 69 questions, 115 themes, 23 reacted-against lines.
- 88 thinkers: 264 key ideas and 88 study prompts.
- 57 links, shown 114 times in `full.json` (once from each end).
- 784 objects in `full.json` carry `sources`, and none lacks them.
- The validator (`scratchpad/tools/validate_full.py`) checks that every source URL is in the saved corpus and every section is a real heading in that entry. It found 0 errors.
- Every link quote has been checked as appearing word for word inside the section it cites.

## What changed with L17
- **Kant** is merged into **The Enlightenment and Kant**. The thinkers are Voltaire, Rousseau, Diderot and Kant; Montesquieu was dropped. Kant's links now point to this node. The link from Kant to the Enlightenment fell away, because it would now point to itself; that point is covered in the Enlightenment content instead.
- **Logical Positivism** is folded into **Analytic Philosophy**, which IEP treats as its third phase. Carnap joins the analytic thinkers and Moore leaves to keep the list at 5. The Circle's links now come from Analytic; the link from Logical Positivism to Analytic fell away for the same reason.
- **Absurdism** stays inside Existentialism. The description says Camus rejected the label (SEP Camus §1).
- **Renaissance Humanism** is renamed **Renaissance Philosophy** (id `renaissance`).
- **Aristotle → Plato** is now one link of kind "built on, then pushed against", keeping both sources.
- **Early Christian Philosophy (Patristic)** is added: Origen, Augustine, Pseudo-Dionysius and Boethius. Its links:
  - built on Neoplatonism and on Stoicism;
  - pushed against Skepticism (Augustine's Contra Academicos);
  - Scholasticism built on it.
- **Habermas** is shown as SEP gives him: "b. 1929, d. 2026".
- **Date fixes:**
  - Porphyry: 234?–305? (SEP Porphyry).
  - Duns Scotus: 1263/66–1308 (SEP Duns Scotus).
  - Theophrastus: c. 371–287 BCE.
  - Epictetus: died around 135 CE.
- **Feminist Philosophy:** Butler and Fraser (no SEP entries, no dates) are replaced by Harriet Taylor Mill (1807–1858).

## References used and why they can be trusted
- **SEP**, the main source, and **IEP** are both peer-reviewed encyclopedias. Each entry is written by a specialist and the pages show their authors and revision dates. 131 entries were downloaded and used.
- **Standard histories**, used only to check the selection and the eras. I could read catalogue and review descriptions only, not the books:
  - Anthony Kenny, *A New History of Western Philosophy* (OUP), 4 volumes: Ancient, Medieval, Rise of Modern, Modern World (Kinokuniya listing, https://www.kinokuniya.co.jp/f/dsg-02-9780199239023). The NDPR review of vol. 4 (https://ndpr.nd.edu/reviews/philosophy-in-the-modern-world-a-new-history-of-western-philosophy-volume-4/) gives its coverage: Bentham to Nietzsche, pragmatism, British idealism, logical positivism, Wittgenstein, Husserl, Heidegger, Sartre and Derrida, up to 1975.
  - Frederick Copleston, *A History of Philosophy*, 11 volumes (catalogue at https://library.iliauni.edu.ge/?p=14822). The volume titles are: Greece and Rome; Medieval; Late Medieval and Renaissance; The Rationalists; British Philosophy: Hobbes to Hume; The Enlightenment: Voltaire to Kant; German Philosophy; Utilitarianism to Early Analytic Philosophy; French Philosophy; Russian Philosophy; Logical Positivism and Existentialism.
  - How the list compares: the 23 nodes follow Kenny's four eras and Copleston's volume titles. Kenny's vol. 2 also begins with Augustine. Post-structuralism and Feminist Philosophy rest on SEP alone. I could not open the Routledge or Oxford companions.
- **Wikipedia** was not cited or used.

## How the content was written and checked
The full content was drafted in four parallel batches. Each batch read only the saved corpus, and each passed the validator before I merged them. The writers paraphrase the sources: there are no long quotations, and jargon is glossed where it is used. Where a source hedges, the content hedges too ("is said to", "probably").

## Debatable choices (one line each)
- **Presocratics:** a modern label. The Sophists are folded in (SEP covers them in the same entry, §9) but get no card of their own.
- **Socrates and Plato / Aristotle:** the "Classical Greek" node is split in two, because later schools attach to them differently.
- **Ancient Skepticism:** Academic and Pyrrhonian skepticism in one node.
- **Early Christian Philosophy:** SEP has no "Patristic" entry. The node rests on the Augustine, Origen, Boethius, Pseudo-Dionysius and Medieval Philosophy entries. Boethius is often counted as the start of medieval philosophy.
- **Scholasticism:** an institution and a method rather than a doctrine. SEP's entry is "Medieval Philosophy".
- **Renaissance Philosophy:** covers humanism, Renaissance Platonism and the revived Hellenistic schools.
- **Rationalism / Empiricism:** later historians' labels (SEP). Berkeley fits neither camp cleanly by SEP's own account, though SEP Leibniz groups him with the empiricists.
- **The Enlightenment and Kant:** a period, not a school. IEP counts Kant as the first German Idealist.
- **Existentialism:** includes Camus's absurdism, though he refused the label. Kierkegaard and Nietzsche are forerunners.
- **Analytic Philosophy:** includes logical positivism as one phase. Whether Frege is a founder is contested (IEP).
- **Post-structuralism:** SEP covers it under "Postmodernism", Derrida and Foucault.
- **Feminist Philosophy:** a field that works inside every tradition.

## What I could not verify, and date conflicts
- **Habermas:** "d. 2026" comes from SEP only.
- **Plato:** born 429? (SEP Plato) or 424/3 (SEP Socrates). The card uses 429?.
- **Sextus Empiricus:** the card says ca. 160–210 CE. SEP Sextus says only "probably 2nd or 3rd c. CE", and the summary hedges.
- **Arcesilaus:** 316/5 (SEP Ancient Skepticism) vs 315/4 (SEP Arcesilaus).
- **Erasmus:** c. 1466 (IEP) vs 1469 (SEP Erasmus).
- **Founding of the Stoa:** c. 300 BCE (SEP) vs 262 BCE (IEP Chrysippus).
- **Rousseau's 1778 and Wittgenstein's 1951** come from other SEP entries (Kant, Augustine) rather than their own.
- **Thin sourcing:** the Xenophon and Zeno of Citium cards rest on the Socrates and Stoicism entries, because SEP has no entries for them yet. Petrarch rests on IEP Renaissance Philosophy alone. For Harriet Taylor Mill, SEP says her authorship is contested, and her cards say so.
- **Unverified structure:** Kenny's and Copleston's chapter-level structure was not checked.

## Left out of the content because the sources don't support it
- **Presocratics:** that "all things are full of gods" is Thales's own line (it is hedged instead). The Pythagorean theorem and the "harmony of the spheres" as Pythagoras's own work.
- **Socrates and Plato:** Plato's founding of the Academy (not found in the SEP Plato text).
- **Aristotle:** his syllogistic logic was not covered.
- **Epicureanism:** the swerve as the basis of free will (SEP calls the link problematic). The "fourfold remedy".
- **Stoicism:** Seneca's world-city theme. The dog-tied-to-a-cart image (IEP doubts it comes from Zeno or Chrysippus).
- **Skepticism:** the Ten and Five Modes as named arguments.
- **Patristic:** Augustine's "I err, therefore I am" argument against the skeptics (only partly visible in the corpus).
- **Enlightenment:** Voltaire's Calas affair. Kant's motto "Sapere aude".
- **German Idealism:** the "thesis–antithesis–synthesis" formula. Fichte's atheism dismissal.
- **Marxism:** the "philosophers have only interpreted the world" line. Any claim that Marx called capitalism unjust (SEP: no consensus).
- **Phenomenology:** Heidegger's account of death and authenticity as a key idea (interpreters disagree).
- **Thinkers named in the sources but not on any card:** Moore, Jaspers, Lyotard, Benjamin, Fromm, Stein, Levinas, Butler, Irigaray.

## Links considered but not supported (or too weak)
| From → To | Kind | Why left out |
|---|---|---|
| Critical Theory → Analytic (logical positivism) | pushed against | SEP and IEP describe a critique of "positivism" in general and never name the Vienna Circle. |
| Rationalism → Socrates and Plato | built on | SEP shows a precedent (innate knowledge in the Meno), not stated influence. |
| Pragmatism → Scholasticism | built on | Supported only for Peirce. |
| Utilitarianism → Epicureanism | built on | No SEP statement found. |
| Stoicism → Epicureanism | pushed against | SEP says the schools "competed"; that is rivalry, not a stated critique. |
| Empiricism → Skepticism | pushed against | Hume rejects Pyrrhonism but is himself a skeptic. |
| Post-structuralism → Existentialism | pushed against | Supported (Foucault rejected Sartre's subject, SEP Foucault §2), but the pair is already "built on". This is mentioned in another link's reason instead. |
| Existentialism → Marxism | built on | Only Sartre's later work. |
| Feminist Philosophy → Enlightenment | built on | Not established in the sources read. |
| Phenomenology → Enlightenment (Kant) | built on | SEP only notes Kant used the word "phenomenology". |
| Post-structuralism → Enlightenment (Kant) | pushed against | Not stated as a reaction. |

## Open questions for the owner
1. Show Habermas's death date (2026, SEP only)?
2. Where SEP entries disagree on a date (Plato, Arcesilaus, Erasmus, Sextus), keep the current choice or show a range?
3. The Enlightenment node now has 8 links and the most crowded threads. Is that fine on the globe?
