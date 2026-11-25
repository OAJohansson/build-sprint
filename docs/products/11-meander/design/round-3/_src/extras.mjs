// Brand board, phone screen and contact sheet for round 3.
import fs from 'node:fs';
import path from 'node:path';
import { verb } from './data.mjs';
export default function (out, data, clew, page) {
  const { schools, links, detail } = data, d = detail.exi;
  // ---------- phone: one school at a time, no globe
  const near = links.filter(l => l[0] === 'exi' || l[1] === 'exi').map(l => ({ s: schools.find(s => s.id === (l[0] === 'exi' ? l[1] : l[0])), v: verb(l, 'exi'), against: l[2] === 'against' }));
  const pcss = `
.screen{--ground:#101918;--lift:#18231f;--bone:#e9e2d4;--brass:#d3a66c;--quiet:rgba(233,226,212,.72);--faint:rgba(233,226,212,.14);background:linear-gradient(180deg,#1b2825 0%,#111b19 60%,#0d1514 100%);color:var(--bone);font:400 16px/1.45 'Hanken Grotesk',sans-serif;padding:14px 22px 0}
header{display:flex;align-items:center;justify-content:space-between;height:48px}
.wm{font:400 22px/1 Fraunces,serif;display:flex;align-items:center;gap:9px}
.back{font-size:14px;color:var(--quiet);padding:12px 16px;border-radius:99px;border:1px solid var(--faint);min-height:44px}
.here{display:block;width:13px;height:13px;border-radius:50%;background:var(--brass);box-shadow:0 0 0 6px rgba(211,166,108,.16);margin:30px 0 14px 6px}
h1{font:300 42px/1.02 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144}
.meta{font-size:14px;color:rgba(233,226,212,.84);margin-top:8px}
.meta button{color:var(--bone);border-bottom:1px solid rgba(233,226,212,.4);padding:4px 0}
h2{font-size:14px;color:var(--quiet);margin:30px 0 6px}
.near{position:relative;margin-left:6px}
.near:before{content:"";position:absolute;left:6px;top:34px;bottom:34px;border-left:1.5px solid rgba(233,226,212,.5)}
.near button{display:grid;grid-template-columns:13px 1fr;gap:0 18px;align-items:center;width:100%;padding:9px 0;min-height:64px;position:relative}
.near i{width:13px;height:13px;border-radius:50%;background:var(--bone);box-shadow:0 0 0 4px #15201e}
.near .v i{box-shadow:0 0 0 2.5px #15201e,0 0 0 4px var(--brass)}
.near em{display:block;font-style:normal;font-size:14px;line-height:1.2;color:var(--bone)}
.near b{display:block;font:400 23px/1.15 Fraunces,serif;margin-top:2px}
.near small{display:block;font-size:13px;color:var(--quiet)}
.q li{font:300 20px/1.3 Fraunces,serif;letter-spacing:-.01em;text-wrap:balance}
.q li+li{margin-top:12px}
button:focus-visible{outline:2px solid var(--brass);outline-offset:3px}
button:active{transform:scale(.98)}`;
  const phone = `<div class="screen"><header><div class="wm" translate="no">${clew.mark(22)}Meander</div><button class="back">Whole field</button></header>
<main><i class="here"></i><h1>Existentialism</h1><p class="meta">${d.dates} · you are here · <button>Themes</button></p>
<h2>One thread away</h2><ul class="near">${near.map(n => `<li><button class="${n.s.visited ? 'v' : ''}"><i></i><span><em>${n.v}</em><b>${n.s.name}</b>${n.s.visited ? `<small>visited ${n.s.visited}</small>` : ''}</span></button></li>`).join('')}</ul>
<h2>It asks</h2><ol class="q">${d.questions.map(q => `<li>${q}</li>`).join('')}</ol>
<h2>Thinkers</h2></main></div>`;
  fs.writeFileSync(path.join(out, 'phone.html'), page({ title: 'Meander · Clew · phone', fonts: clew.fonts, css: pcss, theme: clew.theme, body: phone, w: 390, h: 844 }));
  // ---------- brand board
  const pal = [['ground', '#101918'], ['lift', '#18231f'], ['bone', '#e9e2d4'], ['brass', '#d3a66c'], ['quiet', 'bone 72%']];
  const bcss = `.board{width:1440px;height:810px;background:radial-gradient(1000px 700px at 30% 40%,#1f2d29 0%,#141f1d 55%,#0c1413 100%);color:#e9e2d4;font:400 15px/1.5 'Hanken Grotesk',sans-serif;padding:60px 72px;display:grid;grid-template-columns:500px 1fr;gap:0 76px;-webkit-font-smoothing:antialiased}
.tag{font-size:13.5px;color:rgba(233,226,212,.72);margin-bottom:104px}
.concept{font:400 22px/1.4 Fraunces,serif;margin-top:44px;max-width:480px}
.grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:50px 56px;align-content:center}
.grid h2{font-size:13.5px;color:rgba(233,226,212,.72);margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid rgba(233,226,212,.16)}
.pal{display:flex;gap:12px}.pal i{display:block;width:50px;height:50px;border-radius:50%;box-shadow:inset 0 0 0 1px rgba(233,226,212,.16)}
.pal span{display:block;font-size:12.5px;margin-top:9px;line-height:1.35}.pal small{display:block;color:rgba(233,226,212,.72);font:11.5px ui-monospace,Menlo,monospace}
.ty small{display:block;font-size:12.5px;color:rgba(233,226,212,.72);margin:6px 0 14px}
.voice dt{font-size:12.5px;color:rgba(233,226,212,.72)}.voice dd{font:400 20px/1.25 Fraunces,serif;margin:2px 0 12px}
.sig p{font-size:14px;line-height:1.45;margin-top:10px;max-width:310px}
.marks{display:flex;gap:26px;align-items:center;font-size:13px}.marks span{display:flex;align-items:center;gap:10px}
.marks i{width:12px;height:12px;border-radius:50%;background:#e9e2d4;display:block}`;
  const board = `<div class="board"><div><p class="tag">Meander · Clew · brand</p><span style="font:300 84px/1 Fraunces,serif;letter-spacing:-.03em;font-variation-settings:'opsz' 144;display:flex;align-items:center;gap:22px">${clew.mark(76, .6)}Meander</span><p class="concept">A clew is a ball of thread, the one you unwind to find your way. The whole field is one clew, turned so the school you are in faces you.</p></div>
<div class="grid"><section><h2>Palette</h2><div class="pal">${pal.map(([n, c], i) => `<div><i style="background:${i === 4 ? 'rgba(233,226,212,.72)' : c}"></i><span>${n}<small>${c}</small></span></div>`).join('')}</div></section>
<section class="ty"><h2>Type</h2><div style="font:300 40px/1 Fraunces,serif;letter-spacing:-.02em;font-variation-settings:'opsz' 144">One thread away</div><small>Fraunces 300 at optical size 144 for names (48 / 36 / 22)</small><div style="font:400 16px/1.4 'Hanken Grotesk',sans-serif">built on · visited 9 Nov · Rationalism</div><small>Hanken Grotesk 400 / 600 for everything else (15 / 13.5)</small></section>
<section><h2>Voice</h2><dl class="voice"><dt>First visit</dt><dd>Sixteen schools, one ball of thread. Pull any end.</dd><dt>Go next</dt><dd>One thread away</dd><dt>After copying</dt><dd>The prompt is on your clipboard. Paste it into Claude.</dd></dl></section>
<section class="sig"><h2>Signature</h2><div class="marks"><span><i style="width:16px;height:16px;background:#d3a66c;box-shadow:0 0 0 7px rgba(211,166,108,.16)"></i>here</span><span><i style="box-shadow:0 0 0 2.5px #141f1d,0 0 0 4px #d3a66c"></i>visited</span><span><i></i>not yet</span></div><p>The ball of thread, turned to face you. One filled brass point is where you are; a brass ring is where you have been; a thread between two visited schools turns brass.</p></section></div></div>`;
  fs.writeFileSync(path.join(out, 'brand.html'), page({ title: 'Meander · Clew · brand', fonts: clew.fonts, css: bcss, theme: clew.theme, body: board, w: 1440, h: 810 }));
  // ---------- contact sheet
  const items = [['field-existentialism', '1 · Whole field, Existentialism in focus (main state)'], ['thinker-beauvoir', '2 · Thinker open'], ['copied', '3 · After “Study with Claude”'], ['themes', '4 · Themes, one click in'], ['field-stoicism', '5 · A different focus: Stoicism'], ['first-visit', '6 · First visit, nothing visited'], ['worst-case', '7 · Worst case: long names, eight visits'], ['brand', '9 · Brand board']];
  fs.writeFileSync(path.join(out, 'contact-sheet.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Meander · round 3 · Clew, every state</title><style>
*{box-sizing:border-box;margin:0;padding:0}body{background:#161616;color:#e9e7e2;font:14px/1.45 ui-sans-serif,system-ui,sans-serif;padding:40px 44px;width:1680px}
h1{font-weight:500;font-size:22px;margin-bottom:4px}.sub{color:#9a978f;margin-bottom:28px}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:26px 20px}a{display:block;color:inherit;text-decoration:none}img{width:100%;display:block;border-radius:8px;outline:1px solid #2c2c2c}
p.c{margin-top:9px;color:#b9b6ae}.ph{display:flex;gap:18px;align-items:flex-start}.ph img{width:150px}
</style></head><body><h1>Meander · round 3 · Clew, every state for sign-off</h1><p class="sub">1440 × 900 unless noted. Sample content, draft copy. Click a thumbnail for the full mockup.</p>
<div class="grid">${items.map(([f, c]) => `<a href="${f}.html"><img src="${f}.png" alt="${c}"><p class="c">${c}</p></a>`).join('')}<a class="ph" href="phone.html"><img src="phone.png" alt="phone"><p class="c">8 · Phone, 390 × 844: one school at a time</p></a></div></body></html>`);
}
