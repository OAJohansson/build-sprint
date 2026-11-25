// Sample content for the round-3 mockups. Real schools, thinkers and links; not yet checked against the accuracy guardrail (R7).
// Each school's fixed [latitude, longitude] on the globe lives in positions.mjs, written by embed.mjs.
export const schools = [
  { id: 'pre', name: 'Presocratics' },
  { id: 'cla', name: 'Classical Greek', visited: '5 Nov' },
  { id: 'cyn', name: 'Cynicism', sample: true },
  { id: 'epi', name: 'Epicureanism' },
  { id: 'sto', name: 'Stoicism', visited: '3 Nov' },
  { id: 'ske', name: 'Skepticism', sample: true },
  { id: 'neo', name: 'Neoplatonism', sample: true },
  { id: 'sch', name: 'Scholasticism' },
  { id: 'rat', name: 'Rationalism' },
  { id: 'emp', name: 'Empiricism' },
  { id: 'enl', name: 'Enlightenment', sample: true },
  { id: 'ide', name: 'German Idealism', visited: '9 Nov' },
  { id: 'rom', name: 'Romanticism', sample: true },
  { id: 'uti', name: 'Utilitarianism' },
  { id: 'mar', name: 'Marxism' },
  { id: 'pra', name: 'Pragmatism' },
  { id: 'ana', name: 'Analytic philosophy' },
  { id: 'phe', name: 'Phenomenology' },
  { id: 'exi', name: 'Existentialism', visited: '12 Nov' },
  { id: 'abs', name: 'Absurdism' },
  { id: 'cri', name: 'Critical theory', sample: true },
  { id: 'str', name: 'Structuralism', sample: true },
  { id: 'pos', name: 'Post-structuralism' },
  { id: 'fem', name: 'Feminist philosophy', sample: true },
];
// [older, newer, type]: the newer school built on / pushed against the older one.
// The first 18 are from round 3; the rest are plausible sample links for the eight added schools, unchecked.
export const links = [
  ['pre','cla','built'], ['cla','sto','built'], ['pre','epi','built'], ['cla','sch','built'],
  ['sch','rat','against'], ['rat','emp','against'], ['rat','ide','built'], ['emp','ide','built'],
  ['emp','uti','built'], ['ide','mar','built'], ['ide','exi','against'], ['phe','exi','built'],
  ['emp','pra','built'], ['ide','phe','built'], ['ide','ana','against'], ['emp','ana','built'],
  ['exi','abs','built'], ['exi','pos','against'],
  ['cla','cyn','built'], ['cyn','sto','built'], ['cla','ske','built'], ['sto','ske','against'], ['ske','emp','built'],
  ['cla','neo','built'], ['neo','sch','built'], ['rat','enl','built'], ['emp','enl','built'], ['enl','ide','built'],
  ['enl','rom','against'], ['rom','exi','built'], ['mar','cri','built'], ['ana','cri','against'],
  ['exi','fem','built'], ['mar','fem','built'], ['pos','fem','built'], ['phe','str','against'], ['str','pos','against'],
];
import { POS } from './positions.mjs';
schools.forEach(s => { s.pos = POS[s.id]; });
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
    themes: [
      { name: 'Freedom and responsibility', text: 'Nothing outside you settles what you do, so every choice is yours and so is what follows from it. Sartre called this being condemned to be free.', who: 'Sartre, Beauvoir' },
      { name: 'Anxiety', text: 'The dizziness of seeing how many ways you could go. It is not fear of something; it is what freedom feels like from the inside.', who: 'Kierkegaard, Sartre' },
      { name: 'Bad faith', text: 'Lying to yourself that you have no choice: hiding behind a role, a rule or “that is just how I am”. The opposite is owning what you choose.', who: 'Sartre, Beauvoir' },
      { name: 'Existence before essence', text: 'You are not born with a purpose the way a tool is made for a job. You exist first, and become someone through what you do.', who: 'Sartre' },
      { name: 'The individual against the crowd', text: 'Truth has to be lived by one person; going along with everyone is a way of avoiding it. The crowd, said Kierkegaard, is untruth.', who: 'Kierkegaard, Nietzsche' },
    ],
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
    themes: [
      { name: 'What is in our control', text: '', who: '' }, { name: 'Virtue as the only good', text: '', who: '' }, { name: 'Living according to nature', text: '', who: '' },
      { name: 'Emotions as judgements', text: '', who: '' }, { name: 'Citizen of the world', text: '', who: '' },
    ],
    thinkers: [
      { id: 'zen', name: 'Zeno of Citium', short: 'Zeno', dates: 'c. 334–262 BCE' },
      { id: 'chr', name: 'Chrysippus', short: 'Chrysippus', dates: 'c. 279–206 BCE' },
      { id: 'sen', name: 'Seneca', short: 'Seneca', dates: 'c. 4 BCE–65 CE' },
      { id: 'epc', name: 'Epictetus', short: 'Epictetus', dates: 'c. 50–135 CE' },
      { id: 'mau', name: 'Marcus Aurelius', short: 'Marcus Aurelius', dates: '121–180 CE' },
    ],
  },
};
// the visit history shown in the Your thread panel; the summary line is counted from these rows
export const history = [
  { date: '12 Nov', note: 'today', items: ['Existentialism', 'Simone de Beauvoir'] },
  { date: '9 Nov', items: ['German Idealism'] },
  { date: '5 Nov', items: ['Classical Greek'] },
  { date: '3 Nov', items: ['Stoicism'] },
];
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
  set('ide', 'Kant and German Idealism'); set('cla', 'Socrates, Plato and Aristotle'); set('sto', 'Stoa'); set('fem', 'Feminist philosophy and the ethics of care');
  s.forEach(x => { if (!x.visited && 'pre epi sch rat'.includes(x.id)) x.visited = '28 Sep'; });
  const d = JSON.parse(JSON.stringify(detail));
  d.exi.thinkers[0].name = 'Søren Aabye Kierkegaard';
  d.exi.questions[1] = 'What does it mean to be free, to answer for that freedom, and to keep choosing when no rule tells me how?';
  return { schools: s, detail: d };
}
