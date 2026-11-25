// Sample content for the round-2 mockups. Real schools, thinkers and links; not yet checked against the accuracy guardrail (R7).
export const schools = [
  { id: 'pre', name: 'Presocratics', era: 'Ancient' },
  { id: 'cla', name: 'Classical Greek', era: 'Ancient', visited: '5 Nov' },
  { id: 'epi', name: 'Epicureanism', era: 'Ancient' },
  { id: 'sto', name: 'Stoicism', era: 'Ancient', visited: '3 Nov' },
  { id: 'sch', name: 'Scholasticism', era: 'Medieval' },
  { id: 'rat', name: 'Rationalism', era: 'Early modern' },
  { id: 'emp', name: 'Empiricism', era: 'Early modern' },
  { id: 'ide', name: 'German Idealism', era: 'Early modern', visited: '9 Nov' },
  { id: 'uti', name: 'Utilitarianism', era: '19th century' },
  { id: 'mar', name: 'Marxism', era: '19th century' },
  { id: 'pra', name: 'Pragmatism', era: '19th century' },
  { id: 'ana', name: 'Analytic philosophy', era: '20th century' },
  { id: 'phe', name: 'Phenomenology', era: '20th century' },
  { id: 'exi', name: 'Existentialism', era: '20th century', visited: 'today' },
  { id: 'abs', name: 'Absurdism', era: '20th century' },
  { id: 'pos', name: 'Post-structuralism', era: '20th century' },
];
// [older, newer, type]: the newer school built on / pushed against the older one
export const links = [
  ['pre','cla','built'], ['cla','sto','built'], ['pre','epi','built'], ['cla','sch','built'],
  ['sch','rat','against'], ['rat','emp','against'], ['rat','ide','built'], ['emp','ide','built'],
  ['emp','uti','built'], ['ide','mar','built'], ['ide','exi','against'], ['phe','exi','built'],
  ['emp','pra','built'], ['ide','phe','built'], ['ide','ana','against'], ['emp','ana','built'],
  ['exi','abs','built'], ['exi','pos','against'],
];
export const exi = {
  name: 'Existentialism', dates: '1840s–1960s', era: '20th century',
  lede: 'Start from the single person who has to choose, not from a theory of everything.',
  questions: ['If nothing hands me a purpose, how do I live?', 'What does it mean to be free, and to answer for it?', 'How do I live as myself, and not as the crowd expects?'],
  themes: ['Freedom and responsibility', 'anxiety', 'authenticity and bad faith', 'existence before essence'],
  thinkers: [
    { id: 'kie', name: 'Søren Kierkegaard', short: 'Kierkegaard', dates: '1813–1855' },
    { id: 'nie', name: 'Friedrich Nietzsche', short: 'Nietzsche', dates: '1844–1900' },
    { id: 'sar', name: 'Jean-Paul Sartre', short: 'Sartre', dates: '1905–1980' },
    { id: 'bea', name: 'Simone de Beauvoir', short: 'Beauvoir', dates: '1908–1986' },
    { id: 'cam', name: 'Albert Camus', short: 'Camus', dates: '1913–1960' },
  ],
  // the four schools one step away
  near: {
    ide: { rel: 'pushed against', why: 'Hegel’s all-explaining system' },
    phe: { rel: 'built on', why: 'the method it borrowed' },
    abs: { rel: 'grew from it', why: 'Camus’s answer' },
    pos: { rel: 'pushed back', why: 'doubted the free self' },
  },
  beauvoir: {
    name: 'Simone de Beauvoir', dates: '1908–1986',
    summary: 'French philosopher who carried existentialist freedom into ethics and politics. In The Second Sex she argued that “woman” is a situation one is made into, not a fixed nature.',
    ideas: ['One is not born, but becomes, a woman', 'An ethics of ambiguity', 'My freedom needs the freedom of others'],
  },
};
// break-ui worst case: realistic long names entering through the same data boundary
export function worst() {
  const s = schools.map(x => ({ ...x }));
  const set = (id, name) => { s.find(x => x.id === id).name = name; };
  set('pos', 'Structuralism and post-structuralism'); set('ana', 'Logical positivism and analytic philosophy');
  set('ide', 'Kant and German Idealism'); set('cla', 'Socrates, Plato and Aristotle'); set('sto', 'Stoa');
  s.forEach(x => { if (!x.visited && 'pre epi sch rat'.includes(x.id)) x.visited = '28 Sep'; });
  const e = JSON.parse(JSON.stringify(exi));
  e.thinkers[0].name = 'Søren Aabye Kierkegaard'; e.thinkers[3].short = 'de Beauvoir';
  e.near.phe.why = 'the method Sartre and Beauvoir took from Husserl';
  e.beauvoir.name = 'Simone Lucie Ernestine Marie Bertrand de Beauvoir';
  e.beauvoir.ideas[0] = 'One is not born, but rather becomes, a woman: the body is a situation, not a destiny';
  return { schools: s, exi: e };
}
