# Meander content layer 1: sources note

What this covers: the list of schools (`schools.json`, 24 schools) and the links between them (`links.json`, 58 links). Researched 13 Nov 2026.

## References used and why they can be trusted

- **Stanford Encyclopedia of Philosophy (SEP)**, plato.stanford.edu, was the main source: 60+ entries read in full. Every entry is written by a specialist, refereed by the editorial board and revised over time; each page shows its author and revision date. Main entries: Presocratic Philosophy, Sophists, Socrates, Plato, Aristotle, Epicurus, Stoicism, Ancient Skepticism, Neoplatonism, Plotinus, Medieval Philosophy, Aquinas, Rationalism vs. Empiricism, Descartes, Locke, Hume, Enlightenment, Kant, Hegel, History of Utilitarianism, Bentham, Mill, Marx, Existentialism, Camus, Pragmatism, Peirce, Phenomenology, Husserl, Vienna Circle, Critical Theory (Frankfurt School), Postmodernism, Derrida, Foucault, Feminist Philosophy, Beauvoir. Some entries were opened only for thinkers' dates (for example Seneca, Proclus, Voltaire, Schlick, Deleuze, Wollstonecraft).
- **Internet Encyclopedia of Philosophy (IEP)**, iep.utm.edu, is also peer-reviewed and was used where SEP has no matching survey entry: German Idealism (`germidea`), Renaissance Philosophy (`renaissa`), Renaissance Skepticism (`renaissance`), Kant (`kantview`), Analytic Philosophy (`analytic-philosophy`), Frankfurt School and Critical Theory (`frankfur`).
- **Standard histories, used to check the selection and the eras.** I could only read publisher and catalogue descriptions, not the books themselves:
  - Anthony Kenny, *A New History of Western Philosophy* (OUP), in four volumes: Ancient, Medieval, The Rise of Modern Philosophy, Philosophy in the Modern World (Kinokuniya listing, https://www.kinokuniya.co.jp/f/dsg-02-9780199239023). The NDPR review of vol. 4 (https://ndpr.nd.edu/reviews/philosophy-in-the-modern-world-a-new-history-of-western-philosophy-volume-4/) says it starts after Hegel's death, stops in 1975, and covers Bentham to Nietzsche, Peirce's pragmatism, British idealism, logical positivism, Wittgenstein, Husserl, Heidegger, Sartre and Derrida.
  - Frederick Copleston, *A History of Philosophy*, in 11 volumes (catalogue at https://library.iliauni.edu.ge/?p=14822): Greece and Rome; Medieval; Late Medieval and Renaissance; The Rationalists: Descartes to Leibniz; British Philosophy: Hobbes to Hume; The Enlightenment: Voltaire to Kant; 18th and 19th century German Philosophy; Utilitarianism to Early Analytic Philosophy; 19th and 20th century French Philosophy; Russian Philosophy; Logical Positivism and Existentialism.
  - How the list compares: the eras follow Kenny's four volumes. Rationalism, Empiricism, the Enlightenment with Kant, German philosophy, Utilitarianism, Logical Positivism and Existentialism all match Copleston's volume titles. The 20th-century schools match the NDPR summary of Kenny's vol. 4. I could not open the Routledge or Oxford companions. Copleston stops before post-structuralism and feminist philosophy, and Kenny's coverage of them is thin (he stops in 1975); those two nodes rest on SEP alone.
- **Wikipedia** was not cited and was not used to find entries.

## How it was checked

- I downloaded the full text of every cited SEP and IEP page and read the passages. A script confirmed that **every quote in `links.json` appears word for word** in the cited entry (curly and straight quotes treated as the same), and that every thinker's dates appear in the cited entry.
- **Sourcing:** all 58 links carry a URL, a section and a short quote (all under 15 words). All 24 schools carry their entry URLs. 86 of 89 thinkers have sourced dates.
- Section names are copied from the entries' tables of contents. "intro" means the unnumbered opening of an entry.

## What I could not verify

- **Missing dates.** No dates were found in the consulted pages for Judith Butler, Nancy Fraser and Theophrastus, so they are marked "not given in the sources consulted". Epictetus has only "expelled from Rome 93 CE", and Montesquieu only "born 1689".
- **Habermas.** The SEP Habermas entry gives his dates as "b. 1929, d. 2026". I have recorded that, but it is recent; check it before showing it.
- **Plato's birth year.** SEP gives two different years: 429? in the Plato entry and 424/3 in the Socrates entry. I used the Plato entry.
- **Duns Scotus.** SEP Medieval Philosophy prints "1265/5–1308", which looks like a typo. I used IEP's "1265/1266–1308".
- **Kenny and Copleston.** Only their volume structure was checked, not their chapters.
- **Some dates come from another entry.** A few thinkers' dates were found in a different SEP entry than their own (for example Wittgenstein's 1889–1951 in the Augustine entry, Berkeley's in the Hegel entry). The cited URL is always where the date was actually read.

## Debatable choices (one line each)

- **Presocratics:** a modern label, not a school. The Sophists are folded in because SEP covers them in the same entry (§9).
- **Socrates and Plato / Aristotle:** the owner's "Classical Greek" node is split in two, because later schools attach to them differently. Aristotle is one thinker plus the Lyceum.
- **Ancient Skepticism:** two movements, Academic and Pyrrhonian, in one node, as SEP treats them.
- **Scholasticism:** an institution and a method rather than a doctrine. SEP's entry is "Medieval Philosophy", and early medieval figures (Augustine, Boethius) have no node.
- **Renaissance Humanism:** IEP treats humanism as one current of Renaissance philosophy. The node stands for the whole period, including Ficino's Platonism.
- **Rationalism / Empiricism:** historians' groupings, not self-named schools (SEP).
- **The Enlightenment:** a period and movement that spans other schools.
- **Kant's Critical Philosophy:** one thinker. IEP even counts Kant as the first German Idealist. It is kept separate because so many links run through him.
- **Existentialism:** Absurdism (Camus) is folded in. SEP lists "absurdity" among existentialist themes, but Camus himself rejected the label.
- **Logical Positivism:** IEP makes it a phase of Analytic philosophy. It is kept separate because Copleston gives it its own volume and its links differ.
- **Post-structuralism:** SEP has no entry by that name. It is covered by "Postmodernism", Derrida and Foucault, and the two labels overlap.
- **Feminist Philosophy:** a field that works inside every tradition rather than one school.
- **Aristotle and Plato have two links between them** (built on, and pushed against). This is the only pair with two links. Both are central and both are sourced.
- **Kant and Empiricism is coded "pushed against".** Kant set out to answer Hume's skepticism rather than adopt empiricism. You could argue for "built on".

## Considered, not on the list

These are left out to keep the list near 24, or because the sources treat them as part of another node: Sophists (inside Presocratics), Cynics, Augustine and early Christian philosophy, Romanticism (SEP Enlightenment names it as the opposing movement), Structuralism, Hermeneutics, Neo-Kantianism, British Idealism, Social contract theory, Ordinary-language philosophy.

## Links considered but not supported (or too weak)

| From → To | Kind | Why left out |
|---|---|---|
| Critical Theory → Logical Positivism | pushed against | SEP and IEP describe a critique of "positivism" in general (Horkheimer 1937, the positivism dispute) and never name the Vienna Circle. |
| Rationalism → Socrates and Plato | built on | SEP shows Plato held an early version of innate knowledge. That is a precedent, not stated influence. |
| Pragmatism → Scholasticism | built on | SEP shows Peirce valued scholastic insights against Cartesianism, but only for one thinker. |
| Utilitarianism → Epicureanism | built on | No SEP statement found. |
| Stoicism → Epicureanism | pushed against | SEP says the schools "competed" and are often contrasted. That is rivalry, not a stated critique. |
| Empiricism → Skepticism | pushed against | Hume rejects Pyrrhonian scepticism (SEP Hume §2.3) but is himself a skeptic. Too ambiguous. |
| Post-structuralism → Existentialism | pushed against | Supported: Foucault rejected Sartre's privileging of the subject (SEP Foucault §2). Left out because the same pair is already linked "built on" (SEP Existentialism §7.1). It is mentioned in the Phenomenology link's reason instead. |
| Existentialism → Marxism | built on | Only Sartre's later work (SEP Existentialism §4.2). |
| Feminist Philosophy → Enlightenment | built on | Wollstonecraft's link to the Enlightenment was not established in the sources read. |
| Phenomenology → Kant | built on | SEP only notes that Kant used the word "phenomenology". |
| Post-structuralism → Kant / Enlightenment | pushed against | SEP Postmodernism frames modernism as beginning with Kant but does not state a reaction against him. |
| Analytic → Empiricism | built on | Only indirect, through Logical Positivism. |

## Open questions for the owner

1. Kant: keep as his own node (one thinker), or merge into the Enlightenment or German Idealism?
2. Logical Positivism: keep separate, or fold into Analytic philosophy as IEP does?
3. Absurdism inside Existentialism: OK, given that Camus rejected the label?
4. Should the Renaissance node be named "Renaissance Humanism" or "Renaissance Philosophy"?
5. Should the map allow two threads between the same pair (Aristotle and Plato)?
6. Should any of the left-out candidates come in, Romanticism and Augustine especially? Either would push the list to 25–26.
7. Habermas's death date (2026) comes only from SEP. Show it?
