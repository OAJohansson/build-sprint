import fs from 'node:fs';
import path from 'node:path';
import * as data from './data.mjs';
import { page } from './lib.mjs';
import * as clew from './clew.mjs';
const out = path.resolve(import.meta.dirname, '..');
const W = { ...data, ...data.worst() };
const states = [
  ['field-existentialism', data, 'exi', 'field'], ['thinker-beauvoir', data, 'exi', 'thinker'], ['copied', data, 'exi', 'copied'], ['themes', data, 'exi', 'themes'],
  ['field-stoicism', data, 'sto', 'field'], ['first-visit', data, null, 'first'], ['worst-case', W, 'exi', 'field'],
];
for (const [name, d, focus, state] of states) {
  fs.writeFileSync(path.join(out, name + '.html'), page({ title: 'Meander · Clew · ' + name, fonts: clew.fonts, css: clew.css, theme: clew.theme, ...clew.screen(d, focus, state) }));
}
// every other focus, for the collision check only
fs.mkdirSync(path.join(import.meta.dirname, 'checks'), { recursive: true });
for (const s of data.schools) if (s.id !== 'exi' && s.id !== 'sto') {
  const d = { ...data, detail: { ...data.detail, [s.id]: { ...data.detail.exi, dates: 'dates' } } };
  fs.writeFileSync(path.join(import.meta.dirname, 'checks', 'focus-' + s.id + '.html'), page({ title: 'check', fonts: clew.fonts, css: clew.css, theme: clew.theme, ...clew.screen(d, s.id, 'field') }));
}
if (fs.existsSync(path.join(import.meta.dirname, 'extras.mjs'))) (await import('./extras.mjs')).default(out, data, clew, page);
console.log('built');
