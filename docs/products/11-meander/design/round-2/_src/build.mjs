import fs from 'node:fs';
import path from 'node:path';
import * as data from './data.mjs';
import { page } from './lib.mjs';
const out = path.resolve(import.meta.dirname, '..');
const chk = path.join(import.meta.dirname, 'checks'); fs.mkdirSync(chk, { recursive: true });
const only = process.argv[2];
const sheet = [];
for (const f of fs.readdirSync(import.meta.dirname).filter(f => /^[abc]-.*\.mjs$/.test(f)).sort()) {
  if (only && !f.startsWith(only)) continue;
  const o = (await import('./' + f)).default;
  for (const state of ['field', 'thinker']) {
    const s = o.screen(data, state);
    fs.writeFileSync(path.join(out, `${o.slug}-${state}.html`), page({ title: `Meander · ${o.name} · ${state}`, fonts: o.fonts, css: o.css, theme: o.theme, dark: o.dark, ...s }));
    const w = o.screen({ ...data, ...data.worst() }, state);
    fs.writeFileSync(path.join(chk, `${o.slug}-${state}-worst.html`), page({ title: 'worst case', fonts: o.fonts, css: o.css, theme: o.theme, dark: o.dark, ...w }));
  }
  {
    const b = o.brand;
    const css = `.board{width:1440px;height:810px;background:${b.bg};color:${b.fg};font:400 15px/1.5 ${b.body};padding:60px 72px;display:grid;grid-template-columns:500px 1fr;gap:0 76px;-webkit-font-smoothing:antialiased}
.tag{font-size:13.5px;color:${b.quiet};margin-bottom:108px}
.concept{font:400 22px/1.4 ${b.display};margin-top:44px;max-width:480px;text-wrap:pretty}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:54px 56px;align-content:center}
.grid h2{font-size:13.5px;color:${b.quiet};margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid ${b.hair}}
.pal{display:flex;gap:12px}.pal i{display:block;width:50px;height:50px;border-radius:50%;box-shadow:inset 0 0 0 1px ${b.hair}}
.pal span{display:block;font-size:12.5px;margin-top:9px;line-height:1.35}.pal small{display:block;color:${b.quiet};font-size:11.5px;font-family:ui-monospace,Menlo,monospace}
.ty small{display:block;font-size:12.5px;color:${b.quiet};margin:6px 0 16px}
.voice dt{font-size:12.5px;color:${b.quiet}}.voice dd{font:400 20px/1.25 ${b.display};margin:2px 0 13px}
.sig p{font-size:14px;line-height:1.45;margin-top:8px;max-width:300px}`;
    const body = `<div class="board"><div><p class="tag">Option ${b.letter} · ${o.name}</p>${b.wordmark}<p class="concept">${b.concept}</p></div>
<div class="grid"><section><h2>Palette</h2><div class="pal">${b.palette.map(([n, c]) => `<div><i style="background:${c}"></i><span>${n}<small>${c}</small></span></div>`).join('')}</div></section>
<section class="ty"><h2>Type</h2><div style="${b.type[0].css}">${b.type[0].sample}</div><small>${b.type[0].name}</small><div style="${b.type[1].css}">${b.type[1].sample}</div><small>${b.type[1].name}</small></section>
<section><h2>Voice</h2><dl class="voice"><dt>First visit</dt><dd>${b.voice.empty}</dd><dt>Go next</dt><dd>${b.voice.next}</dd><dt>Where I’ve been</dt><dd>${b.voice.been}</dd></dl></section>
<section class="sig"><h2>Signature</h2>${b.sig}<p>${b.sigText}</p></section></div></div>`;
    fs.writeFileSync(path.join(out, `${o.slug}-brand.html`), page({ title: `Meander · ${o.name} · brand`, fonts: o.fonts, css, theme: o.theme, dark: o.dark, body, w: 1440, h: 810 }));
    sheet.push(o);
  }
  console.log('built', o.slug);
}

if (!only) fs.writeFileSync(path.join(out, 'contact-sheet.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Meander · round 2 · contact sheet</title><style>
*{box-sizing:border-box;margin:0;padding:0}body{background:#161616;color:#e9e7e2;font:14px/1.45 ui-sans-serif,system-ui,sans-serif;padding:40px 44px;width:1680px}
h1{font-weight:500;font-size:22px;margin-bottom:4px}.sub{color:#9a978f;margin-bottom:30px;max-width:1000px}
.row{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:14px}.row a{display:block}img{width:100%;display:block;border-radius:8px;outline:1px solid #2c2c2c}
.cap{margin-bottom:38px;display:flex;gap:14px;align-items:baseline}.cap b{font-weight:600;font-size:16px;white-space:nowrap}.cap p{color:#b9b6ae}
.lab{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;color:#8a877f;font-size:12px;margin-bottom:8px}
</style></head><body><h1>Meander · round 2 · three webs in Orbit’s spirit</h1><p class="sub">Each option: the whole field with Existentialism in focus, a thinker open with Study with Claude, and its brand board. 1440 × 900 screens, sample content, draft copy. Click to open the full mockup.</p>
<div class="lab"><span>Whole field, Existentialism in focus</span><span>Thinker open (Beauvoir)</span><span>Brand board</span></div>
${sheet.map(o => `<div class="row"><a href="${o.slug}-field.html"><img src="${o.slug}-field.png" alt="${o.name}, field"></a><a href="${o.slug}-thinker.html"><img src="${o.slug}-thinker.png" alt="${o.name}, thinker"></a><a href="${o.slug}-brand.html"><img src="${o.slug}-brand.png" alt="${o.name}, brand"></a></div><div class="cap"><b>${o.brand.letter} · ${o.name}</b><p>${o.brand.concept}</p></div>`).join('')}
</body></html>`);
