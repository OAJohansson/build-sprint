// A · Clew. The field as one ball of thread, floating in a dim room. Depth comes from scale, tone and soft light.
import { linkClass } from './lib.mjs';
const C = [520, 455], R = 420;
// x, y, tier (0 here, 1 one step away, 2 everything else), label side
const P = {
  exi: [620, 390, 0, 'focus'],
  phe: [490, 236, 1, 'above'], pos: [740, 250, 1, 'above', { wrap: 1 }], abs: [820, 352, 1, 'above'], ide: [350, 372, 1, 'br'],
  mar: [372, 190, 2, 'left'], rat: [250, 320, 2, 'above'], emp: [280, 610, 2, 'left'], ana: [372, 650, 2, 'right'],
  sch: [200, 380, 2, 'below'], uti: [340, 760, 2, 'below'], pra: [480, 800, 2, 'right'],
  cla: [200, 214, 2, 'br'], sto: [316, 134, 2, 'right'], pre: [136, 470, 2, 'right'], epi: [136, 560, 2, 'right'],
};
const BOWS = { 'rat-emp': -.15, 'ide-exi': .04 };
const DOT = [8, 6, 4];
// three quiet great circles, clearly fainter than any real link
const YARN = [[.9,-18,.05,0],[.46,28,.045,0],[.2,-54,.05,0]];
const globe = `<defs><radialGradient id="lit" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#e9e2d4" stop-opacity=".085"/><stop offset=".55" stop-color="#e9e2d4" stop-opacity=".025"/><stop offset="1" stop-color="#e9e2d4" stop-opacity="0"/></radialGradient><filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>
<circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="url(#lit)"/>
<g class="yarn">${YARN.filter(y => !y[3]).map(([f, r, o]) => `<ellipse cx="${C[0]}" cy="${C[1]}" rx="${R}" ry="${(R * f).toFixed(1)}" transform="rotate(${r} ${C[0]} ${C[1]})" stroke-opacity="${o}"/>`).join('')}<circle cx="${C[0]}" cy="${C[1]}" r="${R}" stroke-opacity=".1"/></g>`;

const css = `
.screen{--ground:#101918;--lift:#18231f;--bone:#e9e2d4;--brass:#d3a66c;--quiet:rgba(233,226,212,.62);--faint:rgba(233,226,212,.14);
  background:radial-gradient(1100px 820px at 36% 46%,#1f2d29 0%,#141f1d 52%,#0c1413 100%);color:var(--bone);font:400 15px/1.45 'Hanken Grotesk',sans-serif}
.yarn ellipse,.yarn circle{fill:none;stroke:#e9e2d4;stroke-width:.9}
svg.threads path.th{stroke:#e9e2d4;stroke-opacity:.34;stroke-width:1}
svg.threads path.against{stroke-dasharray:1.5 5}
svg.threads path.focus{stroke-opacity:.85;stroke-width:1.6}
svg.threads path.satline{stroke:#d3a66c;stroke-opacity:.9;stroke-width:1.3}
svg.threads path.focus.against{stroke-dasharray:1.5 6}
svg.threads path.walked{stroke:#d3a66c;stroke-opacity:.95;stroke-width:1.6}
header{position:absolute;left:44px;top:36px;display:flex;align-items:center;gap:22px}
.wm{font:400 25px/1 Fraunces,serif;letter-spacing:-.01em;display:flex;align-items:center;gap:11px}
.back{font-size:13.5px;color:var(--quiet);padding:9px 14px;margin:-9px 0;border-radius:99px;border:1px solid var(--faint);transition:transform 160ms cubic-bezier(.23,1,.32,1),color 160ms ease}
.back kbd{font:inherit;opacity:.7;margin-left:8px}
.been{position:absolute;left:44px;bottom:36px;font-size:13.5px;color:var(--quiet);display:flex;align-items:center;gap:9px}
.been i{width:7px;height:7px;border-radius:50%;background:var(--brass)}
.key{display:flex;align-items:center;gap:8px;margin-left:22px;opacity:.85}.key svg+svg,.key svg:nth-of-type(2){margin-left:10px}
.n{position:absolute;width:0;height:0}
.n .dot{position:absolute;border-radius:50%;background:var(--bone);transform:translate(-50%,-50%)}
.n.v .dot{box-shadow:0 0 0 2.5px var(--ground),0 0 0 4px var(--brass)}
.n .lb::before{content:"";position:absolute;inset:-9px -10px}
.n .lb{position:absolute;white-space:nowrap;display:flex;flex-direction:column;padding:4px 0;transition:transform 160ms cubic-bezier(.23,1,.32,1)}
.n.left .lb{right:var(--o);transform:translate(var(--dx),calc(-50% + var(--dy)));align-items:flex-end;text-align:right}
.n.right .lb{left:var(--o);transform:translate(var(--dx),calc(-50% + var(--dy)));align-items:flex-start}
.n.br .lb{left:13px;top:11px;align-items:flex-start;transform:translate(var(--dx),var(--dy))}
.n.t1.br b{max-width:100px;white-space:normal}
.n.below .lb{top:var(--o);transform:translate(calc(-50% + var(--dx)),var(--dy));align-items:center;text-align:center}
.n.above .lb{bottom:var(--o);transform:translate(calc(-50% + var(--dx)),var(--dy));align-items:center;text-align:center}
.n b{font:400 var(--fs)/1.15 Fraunces,serif;letter-spacing:-.005em}
.n b.wrap{max-width:140px;white-space:normal;text-wrap:balance}
.n em{font-style:normal;font-size:12.5px;line-height:1.3;color:var(--quiet);letter-spacing:.01em}
.n small{font-size:13px;line-height:1.35;color:var(--quiet);max-width:190px;white-space:normal;text-wrap:balance}
.n small.d{color:var(--quiet);white-space:nowrap}
.t1{--fs:22px}
.t2 b{font:400 15px/1.25 'Hanken Grotesk',sans-serif;letter-spacing:0;color:rgba(233,226,212,.8)}
.t2 small{font-size:13px}
.t2 .dot{opacity:.75}.t2.v .dot{opacity:1}
.t1 b i{font-style:normal;font-family:'Hanken Grotesk',sans-serif;font-size:16px;color:var(--quiet);margin-left:7px}
.t1 b{margin:1px 0 2px}
.n.focus .dot{background:var(--brass);box-shadow:0 0 0 9px rgba(211,166,108,.16)}
.n.focus .lb{top:32px;transform:translateX(-50%);align-items:center;text-align:center;white-space:normal;width:max-content;max-width:340px}
.n.focus h1{font:300 50px/1.02 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144}
.n.focus p{font-size:16px;line-height:1.45;color:rgba(233,226,212,.8);margin-top:12px;max-width:310px}
.n.focus small{margin-top:10px}
.sat{position:absolute;transform:translate(-7px,-50%);display:flex;align-items:center;gap:10px;font:400 17px/1.2 Fraunces,serif;white-space:nowrap}
.sat i{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--brass);background:var(--ground);flex-shrink:0}
.card{position:absolute;left:1056px;top:50%;transform:translateY(-50%);width:340px;background:var(--lift);border:1px solid var(--faint);border-radius:22px;padding:30px 30px 26px;box-shadow:0 40px 80px -40px rgba(0,0,0,.55)}
.card h2{font-size:13.5px;color:var(--quiet);margin-bottom:14px}
.card h2.who{color:var(--bone);margin:0}
.q li{font:300 19px/1.32 Fraunces,serif;letter-spacing:-.01em;font-variation-settings:'opsz' 60;text-wrap:balance}
.q li+li{margin-top:13px}
.themes{font-size:13.5px;line-height:1.5;color:var(--quiet);margin-top:18px}
.card hr{border:0;border-top:1px solid var(--faint);margin:22px 0 18px}
.th-list{margin:0 -12px}
.th-list button{display:flex;justify-content:space-between;align-items:baseline;gap:12px;width:100%;padding:9px 12px;border-radius:10px;font-size:16px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.th-list span{min-width:0}
.th-list .yr{font-size:13px;color:var(--quiet);flex-shrink:0}
.card .up{font-size:13.5px;color:var(--quiet);padding:8px 12px;margin:-8px -12px 14px;border-radius:10px;display:inline-block}
.card h2.who{font:300 36px/1.06 Fraunces,serif;letter-spacing:-.02em;font-variation-settings:'opsz' 144}
.card .dates{font-size:13.5px;color:var(--quiet);margin:8px 0 16px}
.card .sum{font-size:15.5px;line-height:1.55;color:rgba(233,226,212,.86)}
.ideas{margin:18px 0 24px}
.ideas li{font:400 17.5px/1.3 Fraunces,serif;padding-left:22px;position:relative}
.ideas li+li{margin-top:9px}
.ideas li:before{content:"";position:absolute;left:0;top:.62em;width:12px;border-top:1.5px solid var(--brass)}
.study{display:block;width:100%;text-align:center;background:var(--brass);color:#1a1408;font:600 15.5px/1 'Hanken Grotesk',sans-serif;padding:16px 20px;border-radius:13px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.hint{font-size:13px;color:var(--quiet);text-align:center;margin-top:11px}
.others{font-size:13.5px;color:var(--quiet);margin-top:20px;padding-top:16px;border-top:1px solid var(--faint);line-height:1.6;white-space:nowrap}
.others button{color:var(--bone);border-bottom:1px solid var(--faint)}
button:focus-visible{outline:2px solid var(--brass);outline-offset:4px}
button:active{transform:scale(.97)}
.n:active{transform:none}.n:active .lb{opacity:.85}
@media (hover:hover){.back:hover{color:var(--bone)}.th-list button:hover{background:rgba(233,226,212,.07)}.study:hover{background:#dfb57e}.n:hover b{opacity:1}.others button:hover{border-color:var(--bone)}}
`;
export default {
  slug: 'a-clew', name: 'Clew', theme: '#101918', dark: true,
  fonts: ['Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300', 'Hanken+Grotesk:wght@400;500;600'],
  css,
  screen({ schools, links, exi }, state) {
    const visited = new Set(schools.filter(s => s.visited).map(s => s.id));
    const nodes = schools.map(s => {
      const [x, y, t, side, o = {}] = P[s.id]; const r = DOT[t];
      if (t === 0) return `<div class="n focus" data-id="exi" data-x="${x}" data-y="${y}" data-r="${r + 9}" style="left:${x}px;top:${y}px"><i class="dot" style="width:${2 * r}px;height:${2 * r}px"></i><div class="lb"><h1>${s.name}</h1><small>${exi.dates} · you are here</small></div></div>`;
      const near = exi.near[s.id];
      return `<button class="n t${t} ${side} ${s.visited ? 'v' : ''}" data-id="${s.id}" data-x="${x}" data-y="${y}" data-r="${r}" style="left:${x}px;top:${y}px;--o:${o.o || r + 11}px;--dx:${o.dx || 0}px;--dy:${o.dy || 0}px"><i class="dot" style="width:${2 * r}px;height:${2 * r}px"></i><span class="lb">${near ? `<em>${near.rel}</em>` : ''}<b class="${s.name.length > 20 || o.wrap ? 'wrap' : ''}">${s.name}${near && !s.visited ? '<i aria-hidden="true">→</i>' : ''}</b>${s.visited ? `<small class="d">visited ${s.visited.replace(' ', '&nbsp;')}</small>` : ''}</span></button>`;
    }).join('\n');
    const nv = visited.size;
    const card = state === 'thinker'
      ? `<aside class="card solid" aria-label="Thinker"><button class="up">← ${exi.name}</button><h2 class="who">${exi.beauvoir.name}</h2><p class="dates">${exi.beauvoir.dates}</p><p class="sum">${exi.beauvoir.summary}</p><ul class="ideas">${exi.beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul><button class="study">Study with Claude</button><p class="hint">Copies a prompt you can paste into Claude.</p><p class="others">${exi.thinkers.filter(t => t.id !== 'bea').map(t => `<button>${t.short}</button>`).join(' · ')}</p></aside>`
      : `<aside class="card solid" aria-label="${exi.name}"><h2>It asks</h2><ol class="q">${exi.questions.map(q => `<li>${q}</li>`).join('')}</ol><hr><h2>Thinkers</h2><ul class="th-list">${exi.thinkers.map(t => `<li><button><span>${t.name}</span><span class="yr">${t.dates}</span></button></li>`).join('')}</ul></aside>`;
    return {
      body: `<div class="screen"><svg class="threads" aria-hidden="true">${globe}${state === 'thinker' ? `<path class="satline" d="M${P.exi[0]} ${P.exi[1] + 120}V${P.exi[1] + 141}"/>` : ''}</svg>
<header><div class="wm" translate="no"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#e9e2d4" stroke-width="1.1"><circle cx="12" cy="12" r="10.5"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="7.4" transform="rotate(48 12 12)" stroke="#d3a66c"/></g></svg>Meander</div><button class="back" title="Esc" aria-keyshortcuts="Escape">Whole field</button></header>
<main>${nodes}${state === 'thinker' ? `<div class="sat lb" style="left:${P.exi[0]}px;top:${P.exi[1] + 150}px"><i></i>${exi.beauvoir.name}</div>` : ''}</main>
${card}
<p class="been"><i></i>${nv} of ${schools.length} visited, over 3 days</p></div>`,
      web: JSON.stringify({ mode: 'bow', centre: C, pad: 5, links: links.map(l => [l[0], l[1], linkClass(l, visited)]), bows: BOWS }),
    };
  },
  brand: {
    concept: 'A clew is a ball of thread, the one you unwind to find your way. The whole field is one clew, turned so the school you are in faces you.',
    palette: [['ground', '#101918'], ['lift', '#18231f'], ['bone', '#e9e2d4'], ['brass', '#d3a66c'], ['quiet', '#a39f95']],
    type: [{ name: 'Fraunces 300, optical size 144', css: "font:300 40px/1 Fraunces,serif;letter-spacing:-.02em;font-variation-settings:'opsz' 144", sample: 'One thread away' }, { name: 'Hanken Grotesk 400 / 600', css: "font:400 16px/1.4 'Hanken Grotesk',sans-serif", sample: 'visited 9 Nov · built on · grew from it' }],
    voice: { empty: 'Sixteen schools, one ball of thread. Pull any end.', next: 'One thread away', been: '4 of 16 visited, over 3 days' },
    letter: 'A', bg: 'radial-gradient(1000px 700px at 30% 40%,#1f2d29 0%,#141f1d 55%,#0c1413 100%)', fg: '#e9e2d4', quiet: 'rgba(233,226,212,.62)', hair: 'rgba(233,226,212,.16)', display: "Fraunces,serif", body: "'Hanken Grotesk',sans-serif",
    wordmark: `<span style="font:300 84px/1 Fraunces,serif;letter-spacing:-.03em;font-variation-settings:'opsz' 144;display:flex;align-items:center;gap:22px"><svg width="76" height="76" viewBox="0 0 24 24"><g fill="none" stroke="#e9e2d4" stroke-width=".55"><circle cx="12" cy="12" r="10.5"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="7.4" transform="rotate(48 12 12)" stroke="#d3a66c" stroke-width=".8"/><ellipse cx="12" cy="12" rx="10.5" ry="1.6" transform="rotate(74 12 12)"/></g></svg>Meander</span>`,
    sig: `<svg width="300" height="170" viewBox="0 0 300 170"><g fill="none" stroke="#e9e2d4" stroke-width=".9"><circle cx="150" cy="85" r="78" stroke-opacity=".2"/>${[[.9,-18],[.5,24],[.2,-52],[.7,71],[.35,-8],[.1,38]].map(([f,r])=>`<ellipse cx="150" cy="85" rx="78" ry="${78*f}" transform="rotate(${r} 150 85)" stroke-opacity=".14"/>`).join('')}<path d="M104 62Q120 96 176 100" stroke="#d3a66c" stroke-width="1.8" stroke-opacity="1"/><path d="M176 100Q204 80 214 50" stroke-opacity=".7" stroke-dasharray="1.5 5" stroke-linecap="round"/></g><circle cx="104" cy="62" r="4.5" fill="#d3a66c"/><circle cx="176" cy="100" r="7" fill="#d3a66c"/><circle cx="214" cy="50" r="4.5" fill="#e9e2d4"/></svg>`,
    sigText: 'The ball of thread. A brass ring marks where you have been; the one filled brass point is where you are.',
  },
};
export { C, R, YARN, P, BOWS };
