// B · Red thread. An editorial page: the schools are words in time order, joined by hairline threads; one red thread runs through the words you have visited.
import { linkClass } from './lib.mjs';
// left edge, centre y, tier
const P = {
  sto: [72, 180, 3], cla: [190, 296, 3], pre: [72, 416, 3], epi: [118, 552, 3],
  sch: [352, 290, 3],
  rat: [520, 236, 2], emp: [520, 528, 2], ide: [548, 384, 1],
  mar: [800, 226, 2], uti: [790, 566, 3], pra: [784, 668, 3],
  pos: [990, 152, 1], phe: [1040, 252, 1], exi: [980, 396, 0], abs: [1010, 590, 1], ana: [1000, 662, 2],
};
const ERAS = [[72, 'Ancient'], [352, 'Medieval'], [520, 'Early modern'], [800, '19th century'], [1000, '20th century']];
const css = `
.screen{--paper:#f3efe6;--ink:#1c1b18;--mid:#55514a;--far:#6b675f;--hair:#d2ccbf;--red:#b23a2a;background:var(--paper);color:var(--ink);font:400 15px/1.45 Geist,sans-serif}
svg.threads path.th{stroke:#1c1b18;stroke-opacity:.2;stroke-width:1}
svg.threads path.against{stroke-dasharray:1.5 4.5}
svg.threads path.focus{stroke-opacity:.7;stroke-width:1.2}
svg.threads path.red{stroke:var(--red);stroke-width:1.9;stroke-linejoin:round}
header{position:absolute;left:72px;top:34px;right:72px;display:flex;align-items:center;gap:24px}
.wm{font:400 31px/1 'Instrument Serif',serif;letter-spacing:-.01em;position:relative;padding-bottom:5px}
.wm svg{position:absolute;left:0;bottom:-3px}
.back{font-size:13.5px;color:var(--mid);padding:9px 14px;border-radius:99px;border:1px solid var(--hair);transition:transform 160ms cubic-bezier(.23,1,.32,1),border-color 160ms ease}
.back kbd{font:inherit;color:var(--far);margin-left:8px}
.been{margin-left:auto;font-size:13.5px;color:var(--mid);display:flex;align-items:center;gap:10px}
.been svg{flex-shrink:0}
.era{position:absolute;top:88px;font-size:12.5px;color:var(--far);letter-spacing:.01em}
.w{position:absolute;transform:translateY(-50%);white-space:nowrap;font-family:'Instrument Serif',serif;line-height:1;letter-spacing:-.01em;padding:2px 0 3px;transition:color 160ms ease}
.w.t1{font-size:32px}.w.t2{font-size:22.5px;color:var(--mid)}.w.t3{font-size:18px;color:var(--far)}
.w em,.w small{position:absolute;left:0;font:400 12.5px/1.2 Geist,sans-serif;font-style:normal;letter-spacing:0;color:var(--far);white-space:nowrap}
.w em{bottom:calc(100% + 3px)}
.w small{top:calc(100% + 8px)}
.w em i{font-style:normal;color:var(--red)}
.w.wrap{white-space:normal;max-width:300px;line-height:1.02;text-wrap:balance}
.w.t3.wrap{max-width:150px}
.w.t2.wrap{max-width:210px}
button.w::before{content:"";position:absolute;inset:-8px}
h1.w{font:italic 400 68px/1 'Instrument Serif',serif;letter-spacing:-.02em;padding:0 2px 6px 0}
.focus-note{position:absolute;left:1016px;top:460px;width:330px}
.focus-note p{font-size:15.5px;line-height:1.45;color:var(--mid)}
.focus-note small{display:block;font-size:12.5px;color:var(--far);margin-top:7px}
.key{position:absolute;left:72px;top:656px;font-size:12.5px;color:var(--far);display:flex;align-items:center;gap:8px}
.key svg:nth-of-type(2){margin-left:12px}
.band{position:absolute;left:72px;right:72px;top:698px;bottom:0;border-top:1px solid var(--ink);padding-top:20px;display:grid;gap:0 40px}
.band h2{font-size:12.5px;color:var(--far);margin-bottom:9px}
.band.field{grid-template-columns:1fr 330px}
.q{display:grid;grid-template-columns:repeat(3,1fr);gap:0 36px}
.q li{font:400 25px/1.16 'Instrument Serif',serif;letter-spacing:-.01em;text-wrap:balance}
.themes{font-size:13.5px;color:var(--far);margin-top:16px}
.th-list{margin:-7px -10px 0;display:grid;grid-template-columns:1fr 1fr;gap:0 8px}
.th-list button{display:block;width:100%;padding:8px 10px;border-radius:8px;font-size:15px;line-height:1.25;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.band.thinker{grid-template-columns:280px 1fr 300px 216px}
.up{font-size:13.5px;color:var(--mid);padding:6px 10px;margin:-6px -10px 8px;border-radius:8px;display:inline-block}
.band h2.who{font:italic 400 40px/1 'Instrument Serif',serif;letter-spacing:-.02em;text-wrap:balance;color:var(--ink);margin:0}
.others{font-size:13px;line-height:1.7;color:var(--far);margin-top:10px}
.others button{color:var(--mid);border-bottom:1px solid var(--hair)}
.dates{font-size:13.5px;color:var(--far);margin-top:8px}
.sum{font-size:16px;line-height:1.55;color:#33312c;max-width:440px}
.ideas li{font:400 20px/1.2 'Instrument Serif',serif;padding-left:22px;position:relative}
.ideas li+li{margin-top:8px}
.ideas li:before{content:"";position:absolute;left:0;top:.56em;width:12px;border-top:1.8px solid var(--red)}
.study{display:block;width:100%;text-align:center;background:var(--ink);color:var(--paper);font:500 15px/1 Geist,sans-serif;padding:16px 14px;border-radius:12px;margin-top:22px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.hint{font-size:12.5px;line-height:1.4;color:var(--far);margin-top:10px;text-align:center}
button:focus-visible{outline:2px solid var(--red);outline-offset:4px}
button:active{transform:scale(.97)}
button.w:active{transform:translateY(-50%) scale(.98)}
@media (hover:hover){.others button:hover{border-color:var(--mid)}.back:hover{border-color:var(--far)}button.w:hover{color:var(--ink)}.th-list button:hover{background:rgba(28,27,24,.06)}.study:hover{background:#34322d}.up:hover{color:var(--ink)}}
`;
// the red thread: underline each visited word in order, looping from one to the next, then a loose end
const extra = `window.WEB.after=function(box,el,svg){
  const ids=window.WEB.trail,b=ids.map(i=>box(el(i)));let d='';
  b.forEach((r,i)=>{const y=r.y+r.h+1,x1=r.x-3,x2=r.x+r.w+5;
    if(i===0)d+='M'+(x1-26)+' '+(y-9)+'C'+(x1-14)+' '+(y-9)+' '+(x1-10)+' '+y+' '+x1+' '+y;
    else{const p=b[i-1],py=p.y+p.h+1,px=p.x+p.w+5,k=Math.max(46,Math.abs(x1-px)*.42);d+='C'+(px+k)+' '+py+' '+(x1-k)+' '+y+' '+x1+' '+y}
    d+='L'+x2+' '+y;
    if(i===b.length-1)d+='c16 0 26 6 24 15s-13 9-12 1'});
  const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('class','red');p.dataset.a='red';p.dataset.skip=ids.join(' ');svg.appendChild(p)};`;
export default {
  slug: 'b-thread', name: 'Red thread', theme: '#f3efe6',
  fonts: ['Instrument+Serif:ital@0;1', 'Geist:wght@400;500'],
  css,
  screen({ schools, links, exi }, state) {
    const visited = new Set(schools.filter(s => s.visited).map(s => s.id));
    const words = schools.map(s => {
      const [x, y, t] = P[s.id]; const near = exi.near[s.id];
      const date = s.visited && t ? `<i>visited ${s.visited}</i>` : '';
      if (t === 0) return `<h1 class="w lb" data-id="exi" style="left:${x}px;top:${y}px">${s.name}</h1>`;
      return `<button class="w t${t} lb ${s.name.length > 24 ? 'wrap' : ''}" data-id="${s.id}" style="left:${x}px;top:${y}px">${near || date ? `<em class="lb">${[near && near.rel, date].filter(Boolean).join(' · ')}</em>` : ''}${s.name}${near && !date ? `<small class="lb">${near.why}</small>` : ''}</button>`;
    }).join('\n');
    const band = state === 'thinker'
      ? `<aside class="band thinker solid" aria-label="Thinker"><div><button class="up">← ${exi.name}</button><h2 class="who">${exi.beauvoir.name}</h2><p class="dates">${exi.beauvoir.dates}</p><p class="others">Also here: ${exi.thinkers.filter(t => t.id !== 'bea').map(t => `<button>${t.short}</button>`).join(', ')}</p></div><p class="sum">${exi.beauvoir.summary}</p><ul class="ideas">${exi.beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul><div><button class="study">Study with Claude</button><p class="hint">Copies a prompt you can paste into Claude.</p></div></aside>`
      : `<aside class="band field solid" aria-label="${exi.name}"><div><h2>It asks</h2><ol class="q">${exi.questions.map(q => `<li>${q}</li>`).join('')}</ol><p class="themes">${exi.themes.join(' · ')}</p></div><div><h2>Thinkers</h2><ul class="th-list">${exi.thinkers.map(t => `<li><button>${t.name}</button></li>`).join('')}</ul></div></aside>`;
    return {
      body: `<div class="screen"><svg class="threads" aria-hidden="true"></svg>
<header><div class="wm" translate="no">Meander<svg width="118" height="10" viewBox="0 0 118 10" aria-hidden="true"><path d="M1 4h92c9 0 14 1 13 4s-7 2-6-1" fill="none" stroke="#b23a2a" stroke-width="1.8" stroke-linecap="round"/></svg></div><button class="back">Whole field<kbd>Esc</kbd></button><p class="been"><svg width="30" height="8" aria-hidden="true"><path d="M1 4h28" stroke="#b23a2a" stroke-width="1.9" stroke-linecap="round"/></svg>Your thread so far: ${visited.size} of ${schools.length}, over 3 days</p></header>
${ERAS.map(([x, t]) => `<span class="era" style="left:${x}px">${t}</span>`).join('')}
<main>${words}<div class="focus-note lb"><p>${exi.lede}</p><small>${exi.dates} · you are here</small></div></main>
<p class="key"><svg width="26" height="6" aria-hidden="true"><path d="M1 3h24" stroke="#1c1b18" stroke-opacity=".6"/></svg>built on<svg width="26" height="6" aria-hidden="true"><path d="M1 3h24" stroke="#1c1b18" stroke-opacity=".7" stroke-dasharray="1.5 4.5" stroke-linecap="round"/></svg>pushed against</p>
${band}</div>`,
      web: JSON.stringify({ mode: 'word', links: links.map(l => [l[0], l[1], linkClass(l, new Set())]), trail: schools.filter(s => s.visited).sort((a, b) => (a.visited === 'today' ? 99 : parseInt(a.visited)) - (b.visited === 'today' ? 99 : parseInt(b.visited))).map(s => s.id) }),
      extra,
    };
  },
  brand: {
    concept: 'The red thread: the line that runs through everything you have read and holds it together. The field is set like a page; your own path is the only colour on it.',
    palette: [['paper', '#f3efe6'], ['ink', '#1c1b18'], ['mid', '#55514a'], ['far', '#6b675f'], ['red', '#b23a2a']],
    type: [{ name: 'Instrument Serif, roman and italic', css: "font:italic 400 44px/1 'Instrument Serif',serif;letter-spacing:-.02em", sample: 'Follow the thread' }, { name: 'Geist 400 / 500', css: 'font:400 16px/1.4 Geist,sans-serif', sample: 'visited 9 Nov · built on · pushed against' }],
    voice: { empty: 'No thread yet. Start with any name.', next: 'Follow the thread', been: 'Your thread so far: 4 of 16, over 3 days' },
    letter: 'B', bg: '#f3efe6', fg: '#1c1b18', quiet: '#6b675f', hair: '#d2ccbf', display: "'Instrument Serif',serif", body: 'Geist,sans-serif',
    wordmark: `<span style="font:400 112px/1 'Instrument Serif',serif;letter-spacing:-.02em;position:relative;display:inline-block;padding-bottom:14px">Meander<svg width="420" height="30" viewBox="0 0 420 30" style="position:absolute;left:0;bottom:-10px"><path d="M2 8h352c22 0 34 3 32 12s-18 7-15-2" fill="none" stroke="#b23a2a" stroke-width="3" stroke-linecap="round"/></svg></span>`,
    sig: `<svg width="300" height="150" viewBox="0 0 300 150"><text x="10" y="44" font-family="Instrument Serif" font-size="26" fill="#6b675f">Stoicism</text><text x="96" y="112" font-family="Instrument Serif" font-size="30" fill="#1c1b18">German Idealism</text><path d="M0 44C5 44 4 52 10 52H98C150 52 44 121 94 121H284c9 0 14 4 13 9s-8 5-7 0" fill="none" stroke="#b23a2a" stroke-width="2" stroke-linecap="round"/></svg>`,
    sigText: 'One red thread underlines every school you have visited, in the order you visited them.',
  },
};
