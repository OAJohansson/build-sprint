// B · Red thread (round 2b). A word-web centred on the school you are in. Your path is a thin red thread with a knot at each school you visited; short loose red ends reach toward the neighbours you have not opened.
import { linkClass } from './lib.mjs';
// left edge, centre y, tier (0 here, 1 one step away, 2 everything else)
const P = {
  exi: [760, 392, 0],
  ide: [330, 392, 1], phe: [620, 244, 1], pos: [1040, 244, 1], abs: [1050, 548, 1],
  rat: [190, 316, 2], emp: [190, 484, 2], mar: [420, 190, 2], ana: [440, 600, 2],
  sto: [44, 130, 2], cla: [196, 130, 2], pre: [44, 214, 2], sch: [192, 214, 2], epi: [44, 284, 2],
  uti: [110, 580, 2], pra: [250, 640, 2],
};
const ROUTES = { 'rat-emp': 'b' };
const css = `
.screen{--paper:#e9ebe8;--ink:#131a22;--mid:#3f4954;--quiet:#5c6672;--hair:#c3c8c9;--red:#c8402d;background:var(--paper);color:var(--ink);font:400 15px/1.45 Geist,sans-serif}
svg.threads path.th{stroke:#131a22;stroke-opacity:.36;stroke-width:1.1}
svg.threads path.against{stroke-dasharray:1.5 4.5}
svg.threads path.focus{stroke-opacity:.8;stroke-width:1.3}
svg.threads path.red{stroke:var(--red);stroke-width:1.2;stroke-linejoin:round}
svg.threads path.pull{stroke:var(--red);stroke-width:2.4}
svg.threads circle.knot{fill:var(--red)}
header{position:absolute;left:60px;top:34px;right:60px;display:flex;align-items:center;gap:24px}
.wm{font:italic 500 30px/1 'Bodoni Moda',serif;letter-spacing:-.01em;display:flex;align-items:center;gap:10px}
.back{font-size:13.5px;color:var(--mid);padding:9px 14px;border-radius:99px;border:1px solid var(--hair);transition:transform 160ms cubic-bezier(.23,1,.32,1),border-color 160ms ease}
.been{margin-left:auto;font-size:13.5px;color:var(--mid)}
.w{position:absolute;transform:translateY(-50%);white-space:nowrap;font-family:'Bodoni Moda',serif;line-height:1.05;padding:2px 0 3px;transition:color 160ms ease}
.w.t1{font-size:28px;font-weight:500;letter-spacing:-.015em}
.w.t2{font-size:19px;font-weight:500;color:var(--mid)}
.w em{font:400 13px/1 Geist,sans-serif;font-style:normal;letter-spacing:0;color:var(--quiet);margin-right:10px;position:relative;top:-.2em}
.w small{font:400 12.5px/1 Geist,sans-serif;letter-spacing:0;color:var(--quiet);margin-left:9px;position:relative;top:-.15em}
.w.wrap{white-space:normal;max-width:300px;text-wrap:balance}.w.t2.wrap{max-width:160px}
button.w::before{content:"";position:absolute;inset:-8px}
h1.w{font:italic 500 70px/1 'Bodoni Moda',serif;letter-spacing:-.03em;padding:0 4px 8px 0}
.here{position:absolute;font-size:13px;color:var(--quiet);white-space:nowrap}
.band{position:absolute;left:60px;right:60px;top:676px;bottom:0;border-top:1px solid var(--ink);padding-top:22px}
.q{display:grid;grid-template-columns:repeat(3,1fr);gap:0 48px}
.q li{font:400 23px/1.22 'Bodoni Moda',serif;letter-spacing:-.01em;text-wrap:balance}
.people{position:absolute;left:0;right:0;bottom:26px;display:grid;grid-template-columns:repeat(5,1fr);gap:0 12px;border-top:1px solid var(--hair);padding-top:8px}
.people button{display:block;width:100%;padding:10px 0;font-size:15px;color:var(--mid);transition:transform 160ms cubic-bezier(.23,1,.32,1),color 160ms ease}
.people button[aria-pressed=true]{color:var(--ink);font-weight:500}
.people button[aria-pressed=true] span{border-bottom:2px solid var(--red);padding-bottom:3px}
.who3{display:grid;grid-template-columns:repeat(3,1fr);gap:0 48px}
.who3 h2{font:italic 500 38px/1.02 'Bodoni Moda',serif;letter-spacing:-.02em;text-wrap:balance}
.dates{font-size:13.5px;color:var(--quiet);margin:6px 0 14px}
.act{display:flex;align-items:center;gap:14px}
.study{background:var(--ink);color:var(--paper);font:500 15px/1 Geist,sans-serif;padding:14px 20px;border-radius:10px;white-space:nowrap;flex-shrink:0;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.hint{font-size:12.5px;line-height:1.35;color:var(--quiet)}
.sum{font-size:15.5px;line-height:1.5;color:#27303a}
.ideas li{font:400 19px/1.22 'Bodoni Moda',serif;padding-left:20px;position:relative}
.ideas li+li{margin-top:7px}
.ideas li:before{content:"";position:absolute;left:0;top:.5em;width:7px;height:7px;border-radius:50%;background:var(--red)}
button:focus-visible{outline:2px solid var(--red);outline-offset:4px}
button:active{transform:scale(.97)}
button.w:active{transform:translateY(-50%) scale(.98)}
@media (hover:hover){.back:hover{border-color:var(--quiet)}button.w:hover,.people button:hover{color:var(--ink)}.study:hover{background:#27303a}}
`;
// the travelled thread: a thin red line under each visited word in order, a knot where it reaches each one;
// and short loose ends from the current school toward neighbours not yet opened
const extra = `window.WEB.after=function(box,el,svg){
  const NS='http://www.w3.org/2000/svg',ids=window.WEB.trail,b=ids.map(i=>box(el(i)));let d='';const knots=[];
  b.forEach((r,i)=>{const y=r.y+r.h+1,x1=r.x-2,x2=r.x+r.w+3;
    if(i===0)d+='M'+x1+' '+y;
    else{const p=b[i-1],py=p.y+p.h+1,px=p.x+p.w+3,k=x1-px>20?(x1-px)*.5:34;d+='C'+(px+k)+' '+py+' '+(x1-k)+' '+y+' '+x1+' '+y}
    knots.push([x1,y]);d+='L'+x2+' '+y});
  const p=document.createElementNS(NS,'path');p.setAttribute('d',d);p.setAttribute('class','red');p.dataset.a='red';p.dataset.skip=ids.join(' ');svg.appendChild(p);
  knots.forEach(k=>{const c=document.createElementNS(NS,'circle');c.setAttribute('cx',k[0]);c.setAttribute('cy',k[1]);c.setAttribute('r',3.2);c.setAttribute('class','knot');svg.appendChild(c)});
  svg.querySelectorAll('path.focus').forEach(t=>{const other=t.dataset.a==='exi'?t.dataset.b:t.dataset.a;if(ids.includes(other))return;
    const L=t.getTotalLength(),e=box(el('exi')),s=t.getPointAtLength(0),fromExi=s.x>e.x-12&&s.x<e.x+e.w+12&&s.y>e.y-12&&s.y<e.y+e.h+12;
    const q=document.createElementNS(NS,'path');q.setAttribute('d',t.getAttribute('d'));q.setAttribute('class','pull');q.dataset.a=t.dataset.a;q.dataset.b=t.dataset.b;
    const n=Math.min(34,L*.45);q.setAttribute('stroke-dasharray',fromExi?n+' '+(L+10):'0 '+(L-n)+' '+n+' 10');svg.appendChild(q)});
  const e=box(el('exi')),h=document.querySelector('.here');if(h){h.style.left=(e.x+2)+'px';h.style.top=(e.y+e.h+14)+'px'}
};`;
const mark = (s = 30) => `<svg width="${s}" height="${s * .6}" viewBox="0 0 30 18" aria-hidden="true"><path d="M2 5c7 0 6 9 13 9s6-9 13-9" fill="none" stroke="#c8402d" stroke-width="1.6" stroke-linecap="round"/><circle cx="2.5" cy="5" r="2.2" fill="#c8402d"/><circle cx="15" cy="14" r="2.2" fill="#c8402d"/></svg>`;
export default {
  slug: 'b-thread', name: 'Red thread', theme: '#e9ebe8',
  fonts: ['Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,500;1,6..96,500', 'Geist:wght@400;500'],
  css,
  screen({ schools, links, exi }, state) {
    const visited = schools.filter(s => s.visited);
    const words = schools.map(s => {
      const [x, y, t] = P[s.id]; const near = exi.near[s.id];
      if (t === 0) return `<h1 class="w lb" data-id="exi" style="left:${x}px;top:${y}px">${s.name}</h1>`;
      return `<button class="w t${t} lb ${s.name.length > 24 ? 'wrap' : ''}" data-id="${s.id}" style="left:${x}px;top:${y}px">${near ? `<em>${near.rel}</em>` : ''}${s.name}${s.visited ? `<small>${s.visited.replace(' ', '&nbsp;')}</small>` : ''}</button>`;
    }).join('\n');
    const people = `<ul class="people" aria-label="Thinkers">${exi.thinkers.map(t => `<li><button${state === 'thinker' ? ` aria-pressed="${t.id === 'bea'}"` : ''}><span>${t.name}</span></button></li>`).join('')}</ul>`;
    const band = state === 'thinker'
      ? `<aside class="band solid" aria-label="Thinker"><div class="who3"><div><h2>${exi.beauvoir.name}</h2><p class="dates">${exi.beauvoir.dates}</p><div class="act"><button class="study">Study with Claude</button><p class="hint">Copies a prompt you can paste into Claude.</p></div></div><p class="sum">${exi.beauvoir.summary}</p><ul class="ideas">${exi.beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul></div>${people}</aside>`
      : `<aside class="band solid" aria-label="${exi.name}"><ol class="q" aria-label="It asks">${exi.questions.map(q => `<li>${q}</li>`).join('')}</ol>${people}</aside>`;
    return {
      body: `<div class="screen"><svg class="threads" aria-hidden="true"></svg>
<header><div class="wm" translate="no">${mark()}Meander</div><button class="back" title="Esc" aria-keyshortcuts="Escape">Whole field</button><p class="been">${visited.length} of ${schools.length} visited, over 3 days</p></header>
<main>${words}<p class="here lb">${exi.dates} · you are here</p></main>
${band}</div>`,
      web: JSON.stringify({ mode: 'word', routes: ROUTES, links: links.map(l => [l[0], l[1], linkClass(l, new Set())]), trail: visited.sort((a, b) => (a.visited === 'today' ? 99 : parseInt(a.visited)) - (b.visited === 'today' ? 99 : parseInt(b.visited))).map(s => s.id) }),
      extra,
    };
  },
  brand: {
    concept: 'The red thread: the line through everything you have read. It leaves a knot at each school you visited, and its loose ends reach for the ones you have not.',
    palette: [['linen', '#e9ebe8'], ['ink', '#131a22'], ['mid', '#3f4954'], ['quiet', '#5c6672'], ['red', '#c8402d']],
    type: [{ name: 'Bodoni Moda 500, italic and roman', css: "font:italic 500 34px/1 'Bodoni Moda',serif;letter-spacing:-.02em", sample: 'Pick up the thread' }, { name: 'Geist 400 / 500', css: 'font:400 16px/1.4 Geist,sans-serif', sample: '9 Nov · built on · pushed back' }],
    voice: { empty: 'No thread yet. Start with any name.', next: 'Pick up the thread', been: '4 of 16 visited, over 3 days' },
    letter: 'B', bg: '#e9ebe8', fg: '#131a22', quiet: '#5c6672', hair: '#c3c8c9', display: "'Bodoni Moda',serif", body: 'Geist,sans-serif',
    wordmark: `<span style="font:italic 500 104px/1 'Bodoni Moda',serif;letter-spacing:-.03em;display:flex;align-items:center;gap:22px">${mark(84)}Meander</span>`,
    sig: `<svg width="300" height="150" viewBox="0 0 300 150"><text x="12" y="44" font-family="Bodoni Moda" font-size="22" fill="#3f4954">Stoicism</text><text x="92" y="108" font-family="Bodoni Moda" font-style="italic" font-weight="500" font-size="32" fill="#131a22">Existentialism</text><path d="M10 52H102C150 52 42 118 90 118H292" fill="none" stroke="#c8402d" stroke-width="1.3"/><circle cx="10" cy="52" r="3.4" fill="#c8402d"/><circle cx="90" cy="118" r="3.4" fill="#c8402d"/><path d="M236 84V62" stroke="#c8402d" stroke-width="2.6" stroke-linecap="round"/></svg>`,
    sigText: 'A thin red thread with a knot at each school you visited, and a short loose end toward each one you could open next.',
  },
};
