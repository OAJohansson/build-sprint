// C · Mobile (round 2b). A real hanging mobile: the school you are in hangs at the top, the four schools one step away hang from its arm as paper discs, everything else hangs below as small beads. Thinkers are flat tags on a string, not discs.
const F = [560, 178, 100];                 // the focused school
const ARM1 = 352;                          // first arm
const N = { ide: [200, 474], phe: [452, 446], abs: [748, 458], pos: [990, 480] }; // one step away, r 62
const RN = 62;
// beads: x, y, label side
const B = {
  mar: [230, 640, 'below'], rat: [96, 640, 'right'], emp: [410, 640, 'right'],
  sch: [96, 694, 'right'], cla: [96, 748, 'right'], sto: [62, 824, 'below'], pre: [150, 812, 'right'], epi: [150, 856, 'right'],
  ana: [352, 720, 'below'], uti: [470, 720, 'below'], pra: [590, 720, 'below'],
};
const css = `
.screen{--wall:#e7e3db;--paper:#f7f4ee;--ink:#2a2530;--plum:#3d2f4c;--sage:#57755a;--mute:#655e6d;--line:#cbc4b7;
  background:linear-gradient(170deg,#ece8e1 0%,#dfdad0 100%);color:var(--ink);font:400 15px/1.45 Figtree,sans-serif}
svg.threads .arm{stroke:#2a2530;stroke-width:1.6;stroke-linecap:round;fill:none}
svg.threads .hang{stroke:#2a2530;stroke-opacity:.6;stroke-width:1;fill:none}
svg.threads .slack{stroke:#2a2530;stroke-opacity:.45;stroke-width:1;fill:none}
svg.threads .against{stroke-dasharray:1.5 4.5}
svg.threads .walked{stroke:#57755a;stroke-opacity:1;stroke-width:1.6}
header{position:absolute;left:44px;top:32px;display:flex;align-items:center;gap:20px}
.wm{font:400 27px/1 Newsreader,serif;letter-spacing:-.01em;color:var(--plum);display:flex;align-items:center;gap:10px}
.back{font-size:13.5px;color:var(--mute);padding:9px 14px;border-radius:99px;border:1px solid var(--line);transition:transform 160ms cubic-bezier(.23,1,.32,1),border-color 160ms ease}
.been{position:absolute;right:48px;bottom:34px;font-size:13.5px;color:var(--mute);display:flex;align-items:center;gap:9px}
.been i{width:9px;height:9px;border-radius:50%;background:var(--sage)}
.n{position:absolute;border-radius:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;transition:transform 160ms cubic-bezier(.23,1,.32,1)}
.focus{background:var(--plum);color:#fff;padding:20px;box-shadow:0 30px 44px -22px rgba(48,34,58,.5)}
.focus h1{font:400 26px/1.05 Newsreader,serif;letter-spacing:-.01em}
.focus small{font-size:12.5px;color:rgba(255,255,255,.72);margin-top:8px}
.disc{background:var(--paper);padding:8px;box-shadow:0 22px 30px -18px rgba(62,50,40,.42);font:400 16px/1.12 Newsreader,serif;letter-spacing:-.005em;text-wrap:balance}
.disc.v{box-shadow:0 0 0 2px var(--sage),0 22px 30px -18px rgba(62,50,40,.42)}
.verb{position:absolute;font-size:13px;color:var(--mute);white-space:nowrap}
.bead{width:0;height:0;border-radius:0}
.bead .dot{position:absolute;left:0;top:0;width:16px;height:16px;border-radius:50%;transform:translate(-50%,-50%);background:var(--paper);box-shadow:0 6px 8px -4px rgba(62,50,40,.45)}
.bead.v .dot{background:var(--sage)}
.bead .lb{position:absolute;white-space:nowrap;display:flex;flex-direction:column;font-size:14px;line-height:1.3;color:#48414f}
.bead.right .lb{left:16px;top:0;transform:translateY(-50%);align-items:flex-start}
.bead.below .lb{left:0;top:14px;transform:translateX(-50%);align-items:center}
.bead .lb.wrap{white-space:normal;width:110px;text-wrap:balance}
.bead .lb::before{content:"";position:absolute;inset:-9px}
.bead small,.vd{font-size:12.5px;color:var(--sage);font-weight:500}
.vd{position:absolute;white-space:nowrap}
.tags{position:absolute;left:700px;top:106px;display:flex;gap:10px}
.tags button{font-size:14px;line-height:1;padding:9px 13px;border-radius:99px;background:var(--wall);border:1px solid #b9b1a3;color:#3a3441;white-space:nowrap;transition:transform 160ms cubic-bezier(.23,1,.32,1),border-color 160ms ease}
.tags button[aria-pressed=true]{background:var(--plum);border-color:var(--plum);color:#fff}
.asks{position:absolute;left:700px;top:176px;width:680px}
.q{display:grid;grid-template-columns:repeat(3,1fr);gap:0 30px}
.q li{font:400 19px/1.3 Newsreader,serif;text-wrap:balance;color:#2f2a36}
.sheet{position:absolute;left:1092px;top:330px;width:306px;background:var(--paper);border-radius:16px;padding:24px 24px 22px;box-shadow:0 30px 44px -24px rgba(62,50,40,.42)}
.sheet h2{font:400 29px/1.08 Newsreader,serif;letter-spacing:-.015em;color:var(--plum);text-wrap:balance;overflow-wrap:break-word}
.dates{font-size:13.5px;color:var(--mute);margin:5px 0 12px}
.sum{font-size:15px;line-height:1.5;color:#3b3542}
.ideas{margin:14px 0 20px}
.ideas li{font-size:15px;line-height:1.35;padding-left:16px;position:relative}
.ideas li+li{margin-top:7px}
.ideas li:before{content:"";position:absolute;left:0;top:.5em;width:6px;height:6px;border-radius:50%;background:var(--sage)}
.study{display:block;width:100%;text-align:center;background:var(--plum);color:#fff;font:600 15.5px/1 Figtree,sans-serif;padding:15px 18px;border-radius:99px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.hint{font-size:13px;color:var(--mute);text-align:center;margin-top:10px}
button:focus-visible{outline:2px solid var(--plum);outline-offset:4px}
button.n:active{transform:translate(-50%,-50%) scale(.97)}
.study:active,.back:active,.tags button:active{transform:scale(.97)}
@media (hover:hover){.back:hover,.tags button:hover{border-color:var(--mute)}.study:hover{background:#4b3a5d}button.disc:hover{transform:translate(-50%,-50%) scale(1.03)}}
`;
const mark = (s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 28 28" aria-hidden="true"><g fill="none" stroke="#3d2f4c" stroke-width="1.3" stroke-linecap="round"><path d="M14 2v6M4 8h20M6 8v5M22 8v9"/></g><circle cx="6" cy="17" r="4.2" fill="#3d2f4c"/><circle cx="22" cy="20.5" r="3" fill="#57755a"/></svg>`;
export default {
  slug: 'c-mobile', name: 'Mobile', theme: '#e7e3db',
  fonts: ['Newsreader:opsz,wght@6..72,400;6..72,500', 'Figtree:wght@400;500;600'],
  css,
  screen({ schools, exi }, state) {
    const S = Object.fromEntries(schools.map(s => [s.id, s]));
    const vis = id => !!S[id].visited;
    const hang = (x, y1, y2, cls = '', a = '', b = '') => `<path class="hang ${cls}" data-a="${a}" data-b="${b}" d="M${x} ${y1}V${y2}"/>`;
    const arm = (x1, x2, y) => `<path class="arm" d="M${x1} ${y}H${x2}"/>`;
    const slack = (a, b, cls, sag = 26, ia = '', ib = '') => `<path class="slack ${cls}" data-a="${ia}" data-b="${ib}" d="M${a[0]} ${a[1]}Q${(a[0] + b[0]) / 2} ${Math.max(a[1], b[1]) + sag} ${b[0]} ${b[1]}"/>`;
    const svg = [
      hang(F[0], 0, F[1] - F[2], '', 'exi'),                                   // the whole mobile hangs from the top
      hang(F[0], F[1] + F[2], ARM1, '', 'exi'), arm(200, 990, ARM1),
      ...Object.entries(N).map(([id, [x, y]]) => hang(x, ARM1, y - RN, (id === 'ide' || id === 'pos' ? 'against ' : '') + (vis(id) ? 'walked' : ''), id)),
      hang(200, N.ide[1] + RN, 596, '', 'ide'), arm(96, 410, 596),             // German Idealism's arm
      hang(96, 596, 632), hang(230, 596, 632), hang(410, 596, 632),
      hang(96, 648, 686, 'against'), hang(96, 702, 740),            // Rationalism > Scholasticism > Classical Greek
      hang(96, 756, 784), arm(62, 150, 784), hang(62, 784, 816, 'walked'), hang(150, 784, 804), hang(150, 820, 848),
      hang(410, 648, 684), arm(352, 590, 684), hang(352, 684, 712), hang(470, 684, 712), hang(590, 684, 712), // Empiricism's arm
      slack([96, 612], [410, 612], 'against', 12),                 // Rationalism / Empiricism
      slack([N.ide[0] + 40, N.ide[1] + 48], [346, 716], 'against', 6, 'ide'), // German Idealism / Analytic philosophy
      slack([N.phe[0] - 56, N.phe[1] + 26], [N.ide[0] + 58, N.ide[1] - 22], '', 40, 'phe', 'ide'), // Phenomenology built on German Idealism
    ].join('');
    const verbs = Object.entries(N).map(([id, [x, y]]) => `<span class="verb lb" style="left:${x + 9}px;top:${ARM1 + 7}px">${exi.near[id].rel}</span>`).join('');
    const discs = Object.entries(N).map(([id, [x, y]]) => `<button class="n disc circ ${vis(id) ? 'v' : ''}" data-id="${id}" data-x="${x}" data-y="${y}" data-r="${RN}" style="left:${x}px;top:${y}px;width:${2 * RN}px;height:${2 * RN}px">${S[id].name}</button>${vis(id) ? `<span class="vd lb" style="left:${x + RN + 4}px;top:${y + RN - 22}px">visited ${S[id].visited}</span>` : ''}`).join('\n');
    const beads = Object.entries(B).map(([id, [x, y, side]]) => `<button class="n bead ${side} ${vis(id) ? 'v' : ''}" data-id="${id}" style="left:${x}px;top:${y}px"><i class="dot"></i><span class="lb ${S[id].name.length > 20 ? 'wrap' : ''}">${S[id].name}${vis(id) ? `<small>visited ${S[id].visited}</small>` : ''}</span></button>`).join('\n');
    const tags = `<div class="tags solid" role="group" aria-label="Thinkers">${exi.thinkers.map(t => `<button${state === 'thinker' ? ` aria-pressed="${t.id === 'bea'}"` : ''}>${t.short}</button>`).join('')}</div>`;
    const sheet = state === 'thinker' ? `<aside class="sheet solid" aria-label="Thinker"><h2>${exi.beauvoir.name}</h2><p class="dates">${exi.beauvoir.dates}</p><p class="sum">${exi.beauvoir.summary}</p><ul class="ideas">${exi.beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul><button class="study">Study with Claude</button><p class="hint">Copies a prompt you can paste into Claude.</p></aside>` : '';
    const nv = schools.filter(s => s.visited).length;
    return {
      body: `<div class="screen"><svg class="threads" aria-hidden="true">${svg}<path class="hang" data-a="exi" data-skip="tags solid" d="M${F[0] + 92} ${F[1] - 54}H1100" /></svg>
<header><div class="wm" translate="no">${mark()}Meander</div><button class="back" title="Esc" aria-keyshortcuts="Escape">Whole field</button></header>
<main><div class="n focus circ" data-id="exi" data-x="${F[0]}" data-y="${F[1]}" data-r="${F[2]}" style="left:${F[0]}px;top:${F[1]}px;width:${2 * F[2]}px;height:${2 * F[2]}px"><h1>${S.exi.name}</h1><small>${exi.dates} · you are here</small></div>
${verbs}${discs}
${beads}</main>
${tags}
<aside class="asks solid" aria-label="It asks"><ol class="q">${exi.questions.map(q => `<li>${q}</li>`).join('')}</ol></aside>
${sheet}
<p class="been"><i></i>You’ve been to ${nv} of ${schools.length}, over 3 days</p></div>`,
      web: JSON.stringify({ mode: 'static', links: [] }),
    };
  },
  brand: {
    concept: 'A mobile. The school you are in hangs at the top; what is one step away hangs from its arm, and the rest of the field hangs below that. Open another school and the whole thing re-hangs from there.',
    palette: [['wall', '#e7e3db'], ['paper', '#f7f4ee'], ['ink', '#2a2530'], ['plum', '#3d2f4c'], ['sage', '#57755a']],
    type: [{ name: 'Newsreader 400', css: 'font:400 40px/1 Newsreader,serif;letter-spacing:-.015em', sample: 'One step away' }, { name: 'Figtree 400 / 500 / 600', css: 'font:400 16px/1.4 Figtree,sans-serif', sample: 'visited 9 Nov · built on · grew from it' }],
    voice: { empty: 'Start anywhere. Everything here hangs from something else.', next: 'One step away', been: 'You’ve been to 4 of 16, over 3 days' },
    letter: 'C', bg: 'linear-gradient(170deg,#ece8e1 0%,#dfdad0 100%)', fg: '#2a2530', quiet: '#655e6d', hair: '#cbc4b7', display: 'Newsreader,serif', body: 'Figtree,sans-serif',
    wordmark: `<span style="font:400 86px/1 Newsreader,serif;letter-spacing:-.02em;color:#3d2f4c;display:flex;align-items:center;gap:20px">${mark(80)}Meander</span>`,
    sig: `<div style="position:relative;width:300px;height:170px"><svg width="300" height="170" style="position:absolute;inset:0"><g fill="none" stroke="#2a2530" stroke-linecap="round"><path d="M150 0v26" stroke-width="1"/><path d="M50 26h200" stroke-width="1.6"/><path d="M50 26v34M250 26v62" stroke-width="1"/></g></svg><i style="position:absolute;left:10px;top:60px;width:80px;height:80px;border-radius:50%;background:#3d2f4c;box-shadow:0 22px 30px -16px rgba(48,34,58,.5)"></i><i style="position:absolute;left:222px;top:88px;width:56px;height:56px;border-radius:50%;background:#f7f4ee;box-shadow:0 18px 24px -14px rgba(62,50,40,.42)"></i></div>`,
    sigText: 'The arm and its hanging discs: flat paper, one soft shadow, different thread lengths.',
  },
};
