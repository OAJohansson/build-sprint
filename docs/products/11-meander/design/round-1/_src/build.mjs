import fs from 'node:fs';
import path from 'node:path';
import * as data from './data.mjs';
const out = path.resolve(import.meta.dirname, '..');
const only = process.argv[2];
const files = fs.readdirSync(import.meta.dirname).filter(f => /^d\d\d-.*\.mjs$/.test(f)).sort();
const meta = [];
for (const f of files) {
  const d = (await import('./' + f)).default;
  const slug = f.replace(/^d/, '').replace(/\.mjs$/, '');
  meta.push({ slug, ...d.brand, name: d.name });
  if (only && !slug.startsWith(only)) continue;
  const b = d.brand;
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${slug.slice(0, 2)} ${d.name} · Meander round 1</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${d.fonts.map(x => 'family=' + x).join('&')}&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1440px;background:#fff}
ul,ol{list-style:none}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
a{color:inherit;cursor:pointer}
.screen{width:1440px;height:900px;position:relative;overflow:hidden}
.screen svg.links{position:absolute;inset:0;width:1440px;height:900px;pointer-events:none}
/* ---- the direction ---- */
${d.css}
/* ---- brand strip (about the direction, not part of the screen) ---- */
.strip{width:1440px;height:230px;background:#fff;border-top:1px solid #111;color:#111;font:12px/1.45 ui-sans-serif,system-ui,sans-serif;display:grid;grid-template-columns:300px 250px 270px 330px 1fr;position:relative}
.strip>div{padding:20px 22px 0;border-right:1px solid #e4e4e4;min-width:0}
.strip>div:last-child{border-right:0}
.strip h6{font:600 10px/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8a8a8a;margin-bottom:12px}
.strip .bs-wm{height:60px;display:flex;align-items:center;margin-bottom:8px}
.strip .bs-pers{color:#444}
.strip .bs-alt{color:#8a8a8a;margin-top:4px}
.strip .bs-sw{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 8px}
.strip .bs-sw i{display:block;height:34px;border-radius:4px;outline:1px solid rgba(0,0,0,.12);outline-offset:-1px}
.strip .bs-sw span{display:block;font:10px/1.3 ui-monospace,Menlo,monospace;color:#555;margin-top:3px}
.strip .bs-ty1{font-size:30px;line-height:1.05;margin-bottom:4px}
.strip .bs-ty2{font-size:14px;line-height:1.35;margin:8px 0 4px}
.strip .bs-tyn{font:10px/1.3 ui-monospace,Menlo,monospace;color:#777}
.strip dl{display:grid;grid-template-columns:76px 1fr;gap:5px 8px}
.strip dt{color:#8a8a8a}
.strip dd{color:#111}
.strip .bs-sig{height:70px;display:flex;align-items:center;margin-bottom:6px;overflow:hidden}
.strip .bs-note{font-size:10px;line-height:1.35;color:#8a8a8a;margin-top:8px}
</style></head>
<body>
<div class="screen">${d.html(data)}</div>
<aside class="strip">
  <div><h6>${slug.slice(0, 2)} · Wordmark</h6><div class="bs-wm">${b.wordmark}</div><p class="bs-pers">${b.personality}</p><p class="bs-alt">${b.altName ? 'Name: ' + b.altName : 'Name: Meander'}</p><p class="bs-note">Sample content, not yet checked for accuracy (R7). Draft copy.</p></div>
  <div><h6>Palette</h6><div class="bs-sw">${b.palette.map(([n, c]) => `<div><i style="background:${c}"></i><span>${n}<br>${c}</span></div>`).join('')}</div></div>
  <div><h6>Type pair</h6><div class="bs-ty1" style="${b.type[0].css}">${b.type[0].sample}</div><div class="bs-tyn">${b.type[0].name}</div><div class="bs-ty2" style="${b.type[1].css}">${b.type[1].sample}</div><div class="bs-tyn">${b.type[1].name}</div></div>
  <div><h6>Voice</h6><dl><dt>First visit</dt><dd>${b.voice.empty}</dd><dt>Go next</dt><dd>${b.voice.next}</dd><dt>Been there</dt><dd>${b.voice.been}</dd></dl></div>
  <div><h6>Signature · axis</h6><div class="bs-sig">${b.sig}</div><p><b>${b.sigText}</b></p><p class="bs-pers">Axis: ${b.axis}${b.seed ? ' · seed-derived' : ''}</p></div>
</aside>
</body></html>`;
  fs.writeFileSync(path.join(out, slug + '.html'), html);
  console.log('wrote', slug);
}
// contact sheet
const sheet = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Meander round 1 · contact sheet</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#151515;color:#e9e7e2;font:14px/1.45 ui-sans-serif,system-ui,sans-serif;padding:36px 40px 48px;width:1840px}
h1{font-weight:500;font-size:22px;margin-bottom:4px}
.sub{color:#9a978f;margin-bottom:28px;max-width:1100px}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:34px 24px}
a{color:inherit;text-decoration:none;display:block}
img{width:100%;display:block;border-radius:6px;outline:1px solid #2c2c2c}
.cap{margin-top:10px}
.cap b{font:500 12px ui-monospace,Menlo,monospace;color:#9a978f;margin-right:8px}
.cap strong{font-weight:600}
.cap p{color:#b9b6ae;font-size:13px;margin-top:2px}
.cap em{font-style:normal;color:#8a877f;font-size:12px;display:block;margin-top:3px}
</style></head><body>
<h1>Meander · round 1 · ten directions</h1>
<p class="sub">Each shows the whole field of Western philosophy with Existentialism open, at 1440 × 900, with its brand strip below. Sample content, draft copy. Click a thumbnail for the full mockup. The owner picks three.</p>
<div class="grid">${meta.map(m => `<a href="${m.slug}.html"><img src="${m.slug}.png" alt="${m.name}"><div class="cap"><b>${m.slug.slice(0, 2)}</b><strong>${m.name}</strong><p>${m.personality}</p><em>Axis: ${m.axis}</em></div></a>`).join('')}</div>
</body></html>`;
fs.writeFileSync(path.join(out, 'contact-sheet.html'), sheet);
