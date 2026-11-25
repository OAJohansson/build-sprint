// C · Mobile. Orbit grown up: paper discs hanging in soft light, the school you are in at the centre, its thinkers hanging beneath it.
import { linkClass } from './lib.mjs';
// x, y, radius, tier, label side (beads only)
const P = {
  exi: [690, 368, 128, 0],
  ide: [438, 392, 72, 1], phe: [548, 178, 72, 1], pos: [896, 190, 74, 1], abs: [952, 424, 68, 1],
  rat: [270, 250, 50, 2], emp: [278, 566, 50, 2], mar: [410, 104, 44, 2], ana: [420, 730, 52, 2],
  sch: [210, 372, 8, 3, 'below'], cla: [130, 236, 8, 3, 'left'], sto: [236, 112, 8, 3, 'left'], pre: [120, 400, 8, 3, 'left'],
  epi: [120, 540, 8, 3, 'left'], uti: [160, 694, 8, 3, 'below'], pra: [290, 774, 8, 3, 'below'],
};
const TH = { kie: [518, 630], nie: [604, 654], sar: [690, 662], bea: [776, 654], cam: [862, 630] };
const css = `
.screen{--wall:#e8e4dc;--paper:#f8f5ee;--ink:#2b2631;--plum:#3d2f4c;--sage:#5f7c5c;--mute:#6c6574;--line:#cfc8bb;
  background:radial-gradient(900px 700px at 22% 12%,#f4f1ea 0%,rgba(244,241,234,0) 70%),linear-gradient(165deg,#ebe7df 0%,#ddd8ce 100%);color:var(--ink);font:400 15px/1.45 Figtree,sans-serif}
svg.threads path.th{stroke:#6f6758;stroke-opacity:.5;stroke-width:1}
svg.threads path.against{stroke-dasharray:1.5 4.5}
svg.threads path.focus{stroke:#2b2631;stroke-opacity:.72;stroke-width:1.3}
svg.threads path.walked{stroke:#5f7c5c;stroke-opacity:1;stroke-width:1.7}
svg.threads path.thinker{stroke:#2b2631;stroke-opacity:.38;stroke-width:1}
header{position:absolute;left:44px;top:32px;display:flex;align-items:center;gap:20px}
.wm{font:400 26px/1 'Young Serif',serif;color:var(--plum);display:flex;align-items:center;gap:10px}
.back{font-size:13.5px;color:var(--mute);padding:9px 14px;border-radius:99px;border:1px solid var(--line);background:rgba(248,245,238,.6);transition:transform 160ms cubic-bezier(.23,1,.32,1),border-color 160ms ease}
.back kbd{font:inherit;opacity:.75;margin-left:8px}
.been{position:absolute;left:44px;bottom:34px;font-size:13.5px;color:var(--mute);display:flex;align-items:center;gap:9px}
.been i{width:8px;height:8px;border-radius:50%;background:var(--sage)}
.key{display:flex;align-items:center;gap:8px;margin-left:20px}.key svg:nth-of-type(2){margin-left:10px}
.n{position:absolute;border-radius:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transition:transform 160ms cubic-bezier(.23,1,.32,1)}
.disc{background:radial-gradient(circle at 32% 26%,#fffdf9 0%,#f4f0e8 72%);padding:10px}
.t1{box-shadow:0 26px 42px -18px rgba(62,50,40,.34),0 6px 12px -6px rgba(62,50,40,.16)}
.t2{padding:6px;box-shadow:0 15px 26px -13px rgba(62,50,40,.3),0 3px 6px -3px rgba(62,50,40,.12)}
.t1 em{font-style:normal;font-size:12px;line-height:1.2;color:var(--mute)}
.t1 b{font:400 15.5px/1.14 'Young Serif',serif;margin:4px 0 5px;text-wrap:balance;max-width:100%;overflow-wrap:break-word;hyphens:auto}
.t1 small{font-size:12px;line-height:1.25;color:var(--mute);text-wrap:balance}
.t1 small.d,.bead small.d{color:var(--sage);font-weight:500}
.t1.v{box-shadow:0 0 0 2px var(--sage),0 26px 42px -18px rgba(62,50,40,.34),0 6px 12px -6px rgba(62,50,40,.16)}
.t2 b{font:400 13px/1.15 'Young Serif',serif;color:#4a4353;text-wrap:balance;max-width:100%;overflow-wrap:break-word;hyphens:auto}
.focus{background:radial-gradient(circle at 32% 24%,#57446c 0%,#3a2c49 74%);color:#fff;padding:26px;box-shadow:0 40px 64px -22px rgba(48,34,58,.5),0 12px 22px -10px rgba(48,34,58,.28)}
.focus h1{font:400 29px/1.05 'Young Serif',serif;text-wrap:balance}
.focus p{font-size:14px;line-height:1.4;color:rgba(255,255,255,.86);margin-top:10px;max-width:196px}
.focus small{font-size:12px;color:rgba(255,255,255,.68);margin-top:10px}
.bead{width:0;height:0;border-radius:0}
.bead .dot{position:absolute;left:0;top:0;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);background:radial-gradient(circle at 32% 26%,#fffdf9,#ece7dd);box-shadow:0 7px 10px -5px rgba(62,50,40,.4)}
.bead.v .dot{background:var(--sage)}
.bead .lb{position:absolute;white-space:nowrap;display:flex;flex-direction:column;font-size:13.5px;line-height:1.3;color:#544d5c}
.bead.left .lb{right:17px;top:0;transform:translateY(-50%);align-items:flex-end;text-align:right}
.bead.below .lb{left:0;top:15px;transform:translateX(-50%);align-items:center}
.bead .lb.wrap{white-space:normal;width:100px;text-wrap:balance}
.bead .lb::before{content:"";position:absolute;inset:-10px}
.bead small{font-size:12.5px}
.tk{box-shadow:0 12px 20px -10px rgba(62,50,40,.32),0 2px 5px -2px rgba(62,50,40,.12);font-size:12px;font-weight:500;color:#3d3645;padding:4px;line-height:1.15;overflow-wrap:break-word}
.tk.on{background:radial-gradient(circle at 32% 24%,#57446c 0%,#3a2c49 74%);color:#fff;box-shadow:0 0 0 4px rgba(61,47,76,.16),0 12px 20px -10px rgba(48,34,58,.45)}
.tk-label{position:absolute;font-size:12.5px;color:var(--mute);transform:translateX(-50%);white-space:nowrap}
.asks{position:absolute;left:1104px;top:232px;width:290px}
.asks h2,.sheet h2{font-size:13.5px;color:var(--mute);margin-bottom:12px}
.q li{font:400 20px/1.3 'Young Serif',serif;text-wrap:balance}
.q li+li{margin-top:14px}
.themes{font-size:13.5px;line-height:1.5;color:var(--mute);margin-top:20px}
.sheet{position:absolute;left:1078px;top:50%;transform:translateY(-50%);width:322px;background:linear-gradient(170deg,#fdfbf6,#f5f1e9);border-radius:20px;padding:28px 28px 24px;box-shadow:0 44px 70px -30px rgba(62,50,40,.42),0 10px 20px -10px rgba(62,50,40,.16)}
.up{font-size:13.5px;color:var(--mute);padding:7px 10px;margin:-7px -10px 12px;border-radius:9px;display:inline-block}
.sheet h2.who{font:400 30px/1.08 'Young Serif',serif;color:var(--plum);text-wrap:balance;margin:0;overflow-wrap:break-word}
.dates{font-size:13.5px;color:var(--mute);margin:7px 0 14px}
.sum{font-size:15px;line-height:1.55;color:#3b3542}
.ideas{margin:16px 0 22px}
.ideas li{font-size:15px;line-height:1.35;font-weight:500;padding-left:18px;position:relative}
.ideas li+li{margin-top:8px}
.ideas li:before{content:"";position:absolute;left:0;top:.5em;width:7px;height:7px;border-radius:50%;background:var(--sage)}
.study{display:block;width:100%;text-align:center;background:var(--plum);color:#fff;font:600 15.5px/1 Figtree,sans-serif;padding:16px 18px;border-radius:99px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.hint{font-size:13px;color:var(--mute);text-align:center;margin-top:11px}
button:focus-visible{outline:2px solid var(--plum);outline-offset:4px}
button.n:active{transform:translate(-50%,-50%) scale(.97)}
.study:active,.back:active{transform:scale(.97)}
@media (hover:hover){.back:hover{border-color:var(--mute)}.study:hover{background:#4b3a5d}button.disc:hover{transform:translate(-50%,-50%) scale(1.02)}.up:hover{color:var(--ink)}}
`;
export default {
  slug: 'c-mobile', name: 'Mobile', theme: '#e8e4dc',
  fonts: ['Young+Serif', 'Figtree:wght@400;500;600'],
  css,
  screen({ schools, links, exi }, state) {
    const visited = new Set(schools.filter(s => s.visited).map(s => s.id));
    const nodes = schools.map(s => {
      const [x, y, r, t, side] = P[s.id]; const near = exi.near[s.id];
      const pos = `data-id="${s.id}" data-x="${x}" data-y="${y}" data-r="${r}" style="left:${x}px;top:${y}px;${t < 3 ? `width:${2 * r}px;height:${2 * r}px` : ''}"`;
      if (t === 0) return `<div class="n focus circ" ${pos}><h1>${s.name}</h1><p>${exi.lede}</p><small>${exi.dates} · you are here</small></div>`;
      if (t === 1) return `<button class="n disc t1 circ ${s.visited ? 'v' : ''}" ${pos}><em>${near.rel}</em><b>${s.name}</b>${s.visited ? `<small class="d">visited ${s.visited}</small>` : `<small>${near.why}</small>`}</button>`;
      if (t === 2) return `<button class="n disc t2 circ" ${pos}><b>${s.name}</b></button>`;
      return `<button class="n bead ${side} ${s.visited ? 'v' : ''}" ${pos}><i class="dot"></i><span class="lb ${s.name.length > 20 ? 'wrap' : ''}">${s.name}${s.visited ? `<small class="d">visited ${s.visited}</small>` : ''}</span></button>`;
    }).join('\n');
    const tks = exi.thinkers.map(t => { const [x, y] = TH[t.id]; return `<button class="n disc tk circ ${state === 'thinker' && t.id === 'bea' ? 'on' : ''}" data-id="t-${t.id}" data-x="${x}" data-y="${y}" data-r="38" style="left:${x}px;top:${y}px;width:76px;height:76px"${state === 'thinker' && t.id === 'bea' ? ' aria-pressed="true"' : ''}>${t.short}</button>`; }).join('\n');
    const side = state === 'thinker'
      ? `<aside class="sheet solid" aria-label="Thinker"><button class="up">← ${exi.name}</button><h2 class="who">${exi.beauvoir.name}</h2><p class="dates">${exi.beauvoir.dates}</p><p class="sum">${exi.beauvoir.summary}</p><ul class="ideas">${exi.beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul><button class="study">Study with Claude</button><p class="hint">Copies a prompt you can paste into Claude.</p></aside>`
      : `<aside class="asks solid" aria-label="${exi.name}"><h2>It asks</h2><ol class="q">${exi.questions.map(q => `<li>${q}</li>`).join('')}</ol><p class="themes">${exi.themes.join(' · ')}</p></aside>`;
    const L = links.map(l => [l[0], l[1], linkClass(l, visited)]).concat(exi.thinkers.map(t => ['exi', 't-' + t.id, 'thinker']));
    return {
      body: `<div class="screen"><svg class="threads" aria-hidden="true"></svg>
<header><div class="wm" translate="no"><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><path d="M8 9.5Q13 15 19.5 17" fill="none" stroke="#3d2f4c" stroke-width="1.2"/><circle cx="7" cy="8" r="5.5" fill="#3d2f4c"/><circle cx="20.5" cy="18" r="3.5" fill="#5f7c5c"/></svg>Meander</div><button class="back">Whole field<kbd>Esc</kbd></button></header>
<main>${nodes}
${tks}<span class="tk-label" style="left:690px;top:724px">Its thinkers. Open one to study it with Claude.</span></main>
${side}
<p class="been"><i></i>You’ve been to ${visited.size} of ${schools.length}, over 3 days<span class="key"><svg width="26" height="6" aria-hidden="true"><path d="M1 3h24" stroke="#2b2631" stroke-opacity=".6"/></svg>built on<svg width="26" height="6" aria-hidden="true"><path d="M1 3h24" stroke="#2b2631" stroke-opacity=".7" stroke-dasharray="1.5 4.5" stroke-linecap="round"/></svg>pushed against</span></p></div>`,
      web: JSON.stringify({ mode: 'sag', pad: 2, links: L, bows: BOWS }),
    };
  },
  brand: {
    concept: 'A mobile: every school hangs from the ones it grew out of, and the whole thing turns to bring the one you are in to the centre. Paper, thread and soft daylight.',
    palette: [['wall', '#e8e4dc'], ['paper', '#f8f5ee'], ['ink', '#2b2631'], ['plum', '#3d2f4c'], ['sage', '#5f7c5c']],
    type: [{ name: 'Young Serif', css: "font:400 36px/1 'Young Serif',serif", sample: 'One step away' }, { name: 'Figtree 400 / 500 / 600', css: 'font:400 16px/1.4 Figtree,sans-serif', sample: 'visited 9 Nov · built on · grew from it' }],
    voice: { empty: 'Start anywhere. Everything here hangs from something else.', next: 'One step away', been: 'You’ve been to 4 of 16, over 3 days' },
    letter: 'C', bg: 'radial-gradient(900px 700px at 22% 12%,#f4f1ea 0%,rgba(244,241,234,0) 70%),linear-gradient(165deg,#ebe7df 0%,#ddd8ce 100%)', fg: '#2b2631', quiet: '#6c6574', hair: '#cfc8bb', display: "'Young Serif',serif", body: 'Figtree,sans-serif',
    wordmark: `<span style="font:400 76px/1 'Young Serif',serif;color:#3d2f4c;display:flex;align-items:center;gap:20px"><svg width="72" height="72" viewBox="0 0 26 26"><path d="M8 9.5Q13 15 19.5 17" fill="none" stroke="#3d2f4c" stroke-width=".8"/><circle cx="7" cy="8" r="5.5" fill="#3d2f4c"/><circle cx="20.5" cy="18" r="3.5" fill="#5f7c5c"/></svg>Meander</span>`,
    sig: `<div style="position:relative;width:300px;height:170px"><svg width="300" height="170" style="position:absolute;inset:0"><path d="M118 78Q170 112 214 108" fill="none" stroke="#2b2631" stroke-opacity=".6" stroke-width="1.2"/></svg><i style="position:absolute;left:14px;top:14px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle at 32% 24%,#57446c,#3a2c49 74%);box-shadow:0 34px 50px -20px rgba(48,34,58,.5),0 10px 18px -8px rgba(48,34,58,.28)"></i><i style="position:absolute;left:212px;top:72px;width:72px;height:72px;border-radius:50%;background:radial-gradient(circle at 32% 26%,#fffdf9,#f4f0e8 72%);box-shadow:0 22px 34px -16px rgba(62,50,40,.36),0 5px 10px -5px rgba(62,50,40,.16)"></i></div>`,
    sigText: 'The hanging disc and its soft shadow. The bigger and nearer a disc, the closer it is to where you are.',
  },
};
const BOWS = {};
export { P, TH };
