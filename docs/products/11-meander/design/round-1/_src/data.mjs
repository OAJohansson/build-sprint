// Sample content for the round-1 mockups. Not yet checked against the accuracy guardrail (R7).
export const eras = [
  { id: 'anc', name: 'Ancient', span: '600 BCE – 200 CE' },
  { id: 'med', name: 'Medieval', span: '1100 – 1400' },
  { id: 'mod', name: 'Early modern', span: '1630 – 1830' },
  { id: 'c19', name: '19th century', span: '1780 – 1900' },
  { id: 'c20', name: '20th century to now', span: '1880 – today' },
];
export const schools = [
  { id: 'pre', name: 'Presocratics', era: 'anc', dates: 'c. 600–430 BCE', who: 'Thales, Heraclitus, Parmenides', claim: 'What is everything made of?' },
  { id: 'cla', name: 'Classical Greek', era: 'anc', dates: 'c. 470–322 BCE', who: 'Socrates, Plato, Aristotle', claim: 'Ask better questions, then define the good.', visited: '5 Nov' },
  { id: 'epi', name: 'Epicureanism', era: 'anc', dates: 'c. 307 BCE–100s CE', who: 'Epicurus, Lucretius', claim: 'Pleasure is the goal, and calm is the best pleasure.' },
  { id: 'sto', name: 'Stoicism', era: 'anc', dates: 'c. 300 BCE–180 CE', who: 'Zeno, Epictetus, Marcus Aurelius', claim: 'You control your response, not events.', visited: '3 Nov' },
  { id: 'sch', name: 'Scholasticism', era: 'med', dates: 'c. 1100–1400', who: 'Anselm, Aquinas, Ockham', claim: 'Faith and reason can be reconciled.' },
  { id: 'rat', name: 'Rationalism', era: 'mod', dates: '1630s–1710s', who: 'Descartes, Spinoza, Leibniz', claim: 'Reason alone can reach certain truth.' },
  { id: 'emp', name: 'Empiricism', era: 'mod', dates: '1680s–1770s', who: 'Locke, Berkeley, Hume', claim: 'Knowledge starts with the senses.' },
  { id: 'ide', name: 'German Idealism', era: 'mod', dates: '1781–1831', who: 'Kant, Fichte, Schelling, Hegel', claim: 'The mind shapes the world we experience.', visited: '9 Nov' },
  { id: 'uti', name: 'Utilitarianism', era: 'c19', dates: '1780s–1870s', who: 'Bentham, Mill, Sidgwick', claim: 'Right is what brings the most happiness.' },
  { id: 'mar', name: 'Marxism', era: 'c19', dates: '1840s–', who: 'Marx, Engels, Gramsci', claim: 'Material conditions shape ideas, not the reverse.' },
  { id: 'pra', name: 'Pragmatism', era: 'c19', dates: '1870s–', who: 'Peirce, James, Dewey', claim: 'An idea is true if it works in practice.' },
  { id: 'ana', name: 'Analytic philosophy', era: 'c20', dates: '1880s–', who: 'Frege, Russell, Wittgenstein', claim: 'Many puzzles dissolve when language is clear.' },
  { id: 'phe', name: 'Phenomenology', era: 'c20', dates: '1900–', who: 'Husserl, Heidegger, Merleau-Ponty', claim: 'Go back to experience as it is lived.' },
  { id: 'exi', name: 'Existentialism', era: 'c20', dates: '1840s–1960s', who: 'Kierkegaard, Nietzsche, Sartre, Beauvoir, Camus', claim: 'No system can live your life for you.', visited: 'today' },
  { id: 'abs', name: 'Absurdism', era: 'c20', dates: '1940s–', who: 'Camus', claim: 'Life gives no meaning. Live anyway.' },
  { id: 'pos', name: 'Post-structuralism', era: 'c20', dates: '1960s–', who: 'Foucault, Derrida, Deleuze', claim: 'There is no fixed self or final meaning.' },
];
export const S = Object.fromEntries(schools.map(s => [s.id, s]));
// [from, to, type]: "to" built on / pushed against "from"
export const links = [
  ['pre','cla','built'], ['cla','sto','built'], ['pre','epi','built'], ['cla','sch','built'],
  ['sch','rat','against'], ['rat','emp','against'], ['rat','ide','built'], ['emp','ide','built'],
  ['emp','uti','built'], ['ide','mar','built'], ['ide','exi','against'], ['phe','exi','built'],
  ['emp','pra','built'], ['ide','phe','built'], ['ide','ana','against'], ['emp','ana','built'],
  ['exi','abs','built'], ['exi','pos','against'],
];
export const exi = {
  name: 'Existentialism', dates: '1840s–1960s',
  lede: 'Start from the single person who has to choose, not from a theory of everything.',
  questions: [
    'If nothing hands me a purpose, how do I live?',
    'What does it mean to be free, and to answer for it?',
    'How do I live as myself and not as the crowd expects?',
  ],
  themes: ['Freedom and responsibility', 'Anxiety', 'Authenticity and bad faith', 'Existence before essence', 'The individual against the crowd'],
  thinkers: [
    { id: 'kie', name: 'Søren Kierkegaard', short: 'Kierkegaard', dates: '1813–1855', line: 'Truth has to be lived by one person. Faith is a leap.' },
    { id: 'nie', name: 'Friedrich Nietzsche', short: 'Nietzsche', dates: '1844–1900', line: 'God is dead, so values are ours to make. A forerunner.' },
    { id: 'sar', name: 'Jean-Paul Sartre', short: 'Sartre', dates: '1905–1980', line: 'Existence precedes essence. We are condemned to be free.' },
    { id: 'bea', name: 'Simone de Beauvoir', short: 'Beauvoir', dates: '1908–1986', line: 'Freedom always has a situation. One becomes a woman.' },
    { id: 'cam', name: 'Albert Camus', short: 'Camus', dates: '1913–1960', line: 'The absurd, and revolt against it. He refused the label.' },
  ],
  against: { school: 'German Idealism', text: "Hegel's system, which explains everything except the person living inside it, and the rationalism that puts abstract reason before a lived life." },
  next: [
    { id: 'phe', name: 'Phenomenology', rel: 'built', why: 'The method Sartre and Beauvoir took from Husserl and Heidegger.' },
    { id: 'abs', name: 'Absurdism', rel: 'grew', why: "Camus's answer when the search for meaning meets a silent world." },
    { id: 'pos', name: 'Post-structuralism', rel: 'against', why: 'Foucault and Derrida doubted the free, self-making subject.' },
  ],
  beauvoir: {
    summary: "French philosopher who carried existentialist freedom into ethics and politics. In The Second Sex she argued that 'woman' is a situation one is made into, not a fixed nature.",
    ideas: ['One is not born, but becomes, a woman', 'The ethics of ambiguity', 'My freedom needs the freedom of others'],
  },
};
export const visitedTrail = ['sto', 'cla', 'ide', 'exi'];

// Shared semantic detail block; each direction styles it and supplies its own labels (voice).
export function detail(L, o = {}) {
  const rel = L.rel;
  const th = exi.thinkers.map(t => {
    const open = o.open === t.id;
    return `<li class="${open ? 'open' : ''}"><div class="t-row"><b>${o.shortNames ? t.short : t.name}</b><i>${t.dates}</i><span>${t.line}</span></div>${open ? `<div class="t-open"><p>${exi.beauvoir.summary}</p><ul>${exi.beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul><button class="study">${L.study}</button></div>` : ''}</li>`;
  }).join('');
  return `
  <section class="d-q"><h3>${L.q}</h3><ol>${exi.questions.map(q => `<li>${q}</li>`).join('')}</ol></section>
  <section class="d-themes"><h3>${L.themes}</h3><ul>${exi.themes.map(t => `<li>${t}</li>`).join('')}</ul></section>
  <section class="d-thinkers"><h3>${L.thinkers}</h3><ul>${th}</ul></section>
  <section class="d-against"><h3>${L.against}</h3><p><a>${exi.against.school}</a> ${exi.against.text}</p></section>
  <section class="d-next"><h3>${L.next}</h3><ul>${exi.next.map(n => `<li class="${n.rel}"><em>${rel[n.rel]}</em><b>${n.name}</b><span>${n.why}</span></li>`).join('')}</ul></section>`;
}
