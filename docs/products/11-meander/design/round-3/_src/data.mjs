// Sample content for the round-3 mockups. Real schools, thinkers and links; not yet checked against the accuracy guardrail (R7).
// pos: fixed [latitude, longitude] on the globe, found once by embed.mjs so linked schools sit 44–50 degrees apart.
export const schools = [
  { id: 'pre', name: 'Presocratics', pos: [-75.5, 96.6] },
  { id: 'cla', name: 'Classical Greek', pos: [-26.8, 78.7], visited: '5 Nov' },
  { id: 'epi', name: 'Epicureanism', pos: [-55.3, -26.9] },
  { id: 'sto', name: 'Stoicism', pos: [-17, 129.4], visited: '3 Nov' },
  { id: 'sch', name: 'Scholasticism', pos: [-4.9, 34.7] },
  { id: 'rat', name: 'Rationalism', pos: [37.7, 17.7] },
  { id: 'emp', name: 'Empiricism', pos: [40.1, -40.3] },
  { id: 'ide', name: 'German Idealism', pos: [87, 32.4], visited: '9 Nov' },
  { id: 'uti', name: 'Utilitarianism', pos: [-6.6, -26.9] },
  { id: 'mar', name: 'Marxism', pos: [38.8, 77.7] },
  { id: 'pra', name: 'Pragmatism', pos: [1, -73.3] },
  { id: 'ana', name: 'Analytic philosophy', pos: [43.1, -100.3] },
  { id: 'phe', name: 'Phenomenology', pos: [41.2, 136.5] },
  { id: 'exi', name: 'Existentialism', pos: [42.5, -162.9], visited: 'today' },
  { id: 'abs', name: 'Absurdism', pos: [0.9, -132.8] },
  { id: 'pos', name: 'Post-structuralism', pos: [-4.2, -178.8] },
];
// [older, newer, type]: the newer school built on / pushed against the older one
export const links = [
  ['pre','cla','built'], ['cla','sto','built'], ['pre','epi','built'], ['cla','sch','built'],
  ['sch','rat','against'], ['rat','emp','against'], ['rat','ide','built'], ['emp','ide','built'],
  ['emp','uti','built'], ['ide','mar','built'], ['ide','exi','against'], ['phe','exi','built'],
  ['emp','pra','built'], ['ide','phe','built'], ['ide','ana','against'], ['emp','ana','built'],
  ['exi','abs','built'], ['exi','pos','against'],
];
// the verb a neighbour carries, seen from the focused school
export function verb(link, focus) {
  const [older, newer, type] = link;
  if (focus === newer) return type === 'built' ? 'built on' : 'pushed against';
  return type === 'built' ? 'grew from it' : 'pushed back';
}
export const detail = {
  exi: {
    dates: '1840s–1960s',
    questions: ['If nothing hands me a purpose, how do I live?', 'What does it mean to be free, and to answer for it?', 'How do I live as myself, and not as the crowd expects?'],
    themes: ['Freedom and responsibility', 'Anxiety', 'Authenticity and bad faith', 'Existence before essence', 'The individual against the crowd'],
    thinkers: [
      { id: 'kie', name: 'Søren Kierkegaard', short: 'Kierkegaard', dates: '1813–1855' },
      { id: 'nie', name: 'Friedrich Nietzsche', short: 'Nietzsche', dates: '1844–1900' },
      { id: 'sar', name: 'Jean-Paul Sartre', short: 'Sartre', dates: '1905–1980' },
      { id: 'bea', name: 'Simone de Beauvoir', short: 'Beauvoir', dates: '1908–1986' },
      { id: 'cam', name: 'Albert Camus', short: 'Camus', dates: '1913–1960' },
    ],
  },
  sto: {
    dates: 'c. 300 BCE–180 CE',
    questions: ['What is up to me, and what is not?', 'How do I stay steady when things go wrong?', 'What does it mean to live in agreement with nature?'],
    themes: ['What is in our control', 'Virtue as the only good', 'Living according to nature', 'Emotions as judgements', 'Citizen of the world'],
    thinkers: [
      { id: 'zen', name: 'Zeno of Citium', short: 'Zeno', dates: 'c. 334–262 BCE' },
      { id: 'chr', name: 'Chrysippus', short: 'Chrysippus', dates: 'c. 279–206 BCE' },
      { id: 'sen', name: 'Seneca', short: 'Seneca', dates: 'c. 4 BCE–65 CE' },
      { id: 'epc', name: 'Epictetus', short: 'Epictetus', dates: 'c. 50–135 CE' },
      { id: 'mau', name: 'Marcus Aurelius', short: 'Marcus Aurelius', dates: '121–180 CE' },
    ],
  },
};
export const beauvoir = {
  name: 'Simone de Beauvoir', dates: '1908–1986',
  summary: 'French philosopher who carried existentialist freedom into ethics and politics. In The Second Sex she argued that “woman” is a situation one is made into, not a fixed nature.',
  ideas: ['One is not born, but becomes, a woman', 'An ethics of ambiguity', 'My freedom needs the freedom of others'],
  prompt: 'Teach me Simone de Beauvoir as a short Socratic module. Start with what she took from existentialism and where she pushed it further, then her three key ideas: becoming a woman, the ethics of ambiguity, and why my freedom needs the freedom of others. Ask me one question at a time and finish with a five-question quiz.',
};
// break-ui worst case: realistic long names and eight visits, entering through the same data
export function worst() {
  const s = schools.map(x => ({ ...x }));
  const set = (id, name) => { s.find(x => x.id === id).name = name; };
  set('pos', 'Structuralism and post-structuralism'); set('ana', 'Logical positivism and analytic philosophy');
  set('ide', 'Kant and German Idealism'); set('cla', 'Socrates, Plato and Aristotle'); set('sto', 'Stoa');
  s.forEach(x => { if (!x.visited && 'pre epi sch rat'.includes(x.id)) x.visited = '28 Sep'; });
  const d = JSON.parse(JSON.stringify(detail));
  d.exi.thinkers[0].name = 'Søren Aabye Kierkegaard';
  d.exi.questions[1] = 'What does it mean to be free, to answer for that freedom, and to keep choosing when no rule tells me how?';
  return { schools: s, detail: d };
}
