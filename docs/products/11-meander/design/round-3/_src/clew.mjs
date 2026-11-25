// Clew, round 3. One function draws every desktop state from the data and a focus; nothing is hand-placed per focus.
import { vec, project, thread, emptiest } from './layout.mjs';
import { verb } from './data.mjs';
export const C = [510, 456], R = 410;
export const TITLE = { rx: 190, ry: 78 };   // the clear oval kept around the focused school's name
export const fonts = ['Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300', 'Hanken+Grotesk:wght@400;500;600'];
export const theme = '#101918';
const YARN = [[.9, -18, .05], [.46, 28, .045], [.2, -54, .05]];
export const css = `
.screen{--ground:#101918;--lift:#18231f;--bone:#e9e2d4;--brass:#d3a66c;--quiet:rgba(233,226,212,.72);--faint:rgba(233,226,212,.14);
  background:radial-gradient(1100px 820px at 34% 46%,#1f2d29 0%,#141f1d 52%,#0c1413 100%);color:var(--bone);font:400 15px/1.45 'Hanken Grotesk',sans-serif}
.yarn ellipse,.yarn circle{fill:none;stroke:#e9e2d4;stroke-width:.9}
svg.threads path.th{stroke:#e9e2d4;stroke-opacity:.34;stroke-width:1}
svg.threads path.far{stroke-opacity:.2}
svg.threads path.focus{stroke-opacity:.9;stroke-width:1.6}
svg.threads path.focus.against{stroke-dasharray:1.5 6}
svg.threads path.walked{stroke:#d3a66c;stroke-opacity:.95;stroke-width:1.5}
svg.threads path.satline{stroke:#d3a66c;stroke-opacity:.9;stroke-width:1.3}
header{position:absolute;left:44px;top:36px;display:flex;align-items:center;gap:22px}
.wm{font:400 25px/1 Fraunces,serif;letter-spacing:-.01em;display:flex;align-items:center;gap:11px}
.back{font-size:13.5px;color:var(--quiet);padding:9px 14px;margin:-9px 0;border-radius:99px;border:1px solid var(--faint);transition:transform 160ms cubic-bezier(.23,1,.32,1),color 160ms ease}
.been{position:absolute;left:44px;bottom:36px;font-size:13.5px;color:var(--quiet);display:flex;align-items:center;gap:10px}
.been i{width:8px;height:8px;border-radius:50%;background:var(--bone);box-shadow:0 0 0 2px var(--ground),0 0 0 3.5px var(--brass)}
.n{position:absolute;width:0;height:0}
.n .dot{position:absolute;left:0;top:0;border-radius:50%;background:var(--bone);transform:translate(-50%,-50%);transition:box-shadow 160ms ease}
.n.v .dot{box-shadow:0 0 0 2.5px var(--ground),0 0 0 4px var(--brass)}
.n .lb{position:absolute;visibility:hidden;white-space:nowrap;display:flex;flex-direction:column;width:max-content}
.n .lb::before{content:"";position:absolute;inset:-9px -10px}
.n b{font:400 15px/1.25 'Hanken Grotesk',sans-serif;color:rgba(233,226,212,.86)}
.n.back2 b{font-size:14px;color:rgba(233,226,212,.62)}
.n.back2 .dot{opacity:.6}
.n.t1 b{font:400 22px/1.15 Fraunces,serif;letter-spacing:-.005em;color:var(--bone);margin-top:2px}
.n em{font-style:normal;font-size:13.5px;line-height:1.25;color:var(--bone);letter-spacing:.005em}
.n small{font-size:13px;line-height:1.3;color:var(--quiet);white-space:nowrap}
.n b.wrap{max-width:170px;white-space:normal;text-wrap:balance}
.n.t1 b.wrap{max-width:230px}
.title{position:absolute;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;text-align:center;width:max-content;max-width:310px;padding:2px 4px}
.title .here{width:14px;height:14px;border-radius:50%;background:var(--brass);box-shadow:0 0 0 7px rgba(211,166,108,.16);margin-bottom:11px}
.title h1{font:300 48px/1.02 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144}
.title p{font-size:13.5px;color:rgba(233,226,212,.84);margin-top:9px;white-space:nowrap}
.title p button{color:var(--bone);border-bottom:1px solid rgba(233,226,212,.4);margin-left:2px;padding:2px 0;transition:border-color 160ms ease}
.welcome{position:absolute;transform:translate(-50%,-50%);width:250px;text-align:center;font:300 27px/1.2 Fraunces,serif;letter-spacing:-.015em;font-variation-settings:'opsz' 100;padding:6px}
.pop{position:absolute;transform:translateX(-50%);width:270px;background:var(--lift);border:1px solid var(--faint);border-radius:16px;padding:18px 22px 20px;box-shadow:0 30px 60px -24px rgba(0,0,0,.7);z-index:3}
.pop h2{font-size:13.5px;color:var(--quiet);margin-bottom:8px}
.pop li{font:400 18px/1.3 Fraunces,serif;padding:4px 0}
.sat{position:absolute;transform:translate(-7px,-50%);display:flex;align-items:center;gap:10px;font:400 17px/1.2 Fraunces,serif;white-space:nowrap;padding:4px 0}
.sat i{width:14px;height:14px;border-radius:50%;border:1.5px solid var(--brass);background:var(--ground);flex-shrink:0}
.card{position:absolute;left:1056px;top:50%;transform:translateY(-50%);width:340px;background:var(--lift);border:1px solid var(--faint);border-radius:22px;padding:28px 28px 24px;box-shadow:0 40px 80px -40px rgba(0,0,0,.55)}
.card h2{font-size:13.5px;color:var(--quiet);margin-bottom:12px}
.q li{font:300 19px/1.32 Fraunces,serif;letter-spacing:-.01em;font-variation-settings:'opsz' 60;text-wrap:balance}
.q li+li{margin-top:12px}
.card hr{border:0;border-top:1px solid var(--faint);margin:20px 0 16px}
.th-list{margin:0 -12px}
.th-list button{display:flex;justify-content:space-between;align-items:baseline;gap:12px;width:100%;padding:9px 12px;border-radius:10px;font-size:16px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.th-list span{min-width:0}.th-list .yr{font-size:13px;color:var(--quiet);flex-shrink:0;white-space:nowrap}
.card .up{font-size:13.5px;color:var(--quiet);padding:8px 12px;margin:-8px -12px 12px;border-radius:10px;display:inline-block}
.card h2.who{font:300 36px/1.06 Fraunces,serif;letter-spacing:-.02em;font-variation-settings:'opsz' 144;color:var(--bone);margin:0}
.card .dates{font-size:13.5px;color:var(--quiet);margin:8px 0 14px}
.card .sum{font-size:15.5px;line-height:1.55;color:rgba(233,226,212,.88)}
.ideas{margin:16px 0 22px}
.ideas li{font:400 17.5px/1.3 Fraunces,serif;padding-left:22px;position:relative}
.ideas li+li{margin-top:8px}
.ideas li:before{content:"";position:absolute;left:0;top:.62em;width:12px;border-top:1.5px solid var(--brass)}
.study{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;background:var(--brass);color:#1a1408;font:600 15.5px/1 'Hanken Grotesk',sans-serif;padding:16px 20px;border-radius:13px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.study.done{background:transparent;color:var(--brass);box-shadow:inset 0 0 0 1.5px var(--brass)}
.hint{font-size:13px;color:var(--quiet);text-align:center;margin-top:11px}
.prompt{font-size:13px;line-height:1.5;color:var(--quiet);border-left:1.5px solid var(--faint);padding-left:12px;margin-top:14px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.others{font-size:13.5px;color:var(--quiet);margin-top:18px;padding-top:14px;border-top:1px solid var(--faint);white-space:nowrap}
.others button{color:var(--bone);border-bottom:1px solid var(--faint)}
button:focus-visible{outline:2px solid var(--brass);outline-offset:4px}
button:active{transform:scale(.97)}
.n:active{transform:none}.n:active .lb{opacity:.8}
@media (hover:hover){.back:hover{color:var(--bone)}.th-list button:hover{background:rgba(233,226,212,.07)}.study:hover{background:#dfb57e}.study.done:hover{background:transparent}
  .n:hover b{color:var(--bone);text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:5px}.n:hover .dot{box-shadow:0 0 0 5px rgba(233,226,212,.16)}.n.v:hover .dot{box-shadow:0 0 0 2.5px var(--ground),0 0 0 4px var(--brass),0 0 0 8px rgba(233,226,212,.14)}
  .others button:hover,.title p button:hover{border-color:var(--bone)}}
`;
export const mark = (s = 24, w = 1.1) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#e9e2d4" stroke-width="${w}"><circle cx="12" cy="12" r="10.5"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="7.4" transform="rotate(48 12 12)" stroke="#d3a66c"/></g></svg>`;
const check = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

// state: 'field' | 'thinker' | 'copied' | 'themes' | 'first'
export function screen({ schools, links, detail, beauvoir }, focus, state) {
  const V = Object.fromEntries(schools.map(s => [s.id, vec(s.pos)]));
  const f = focus ? V[focus] : emptiest(Object.values(V));
  const visited = new Set(state === 'first' ? [] : schools.filter(s => s.visited).map(s => s.id));
  const P = Object.fromEntries(schools.map(s => [s.id, project(f, V[s.id], C, R)]));
  const near = {}; links.forEach(l => { if (l[0] === focus) near[l[1]] = l; if (l[1] === focus) near[l[0]] = l; });
  const rOf = id => id === focus ? 0 : near[id] ? 6 : P[id].theta > 100 ? 3 : 4;
  const openT = state === 'thinker' || state === 'copied';
  const inTitle = p => focus && ((p.x - C[0]) / (openT && p.y > C[1] ? TITLE.rx + 30 : TITLE.rx)) ** 2 + ((p.y - C[1]) / (openT && p.y > C[1] ? TITLE.ry + 56 : TITLE.ry)) ** 2 < 1;
  const paths = links.map(l => {
    const [a, b, t] = l, isF = a === focus || b === focus;
    const pts = thread(f, V[a], V[b], C, R).filter(p => !(isF && inTitle(p)) && Math.hypot(p.x - P[a].x, p.y - P[a].y) > rOf(a) + 5 && Math.hypot(p.x - P[b].x, p.y - P[b].y) > rOf(b) + 5 || false);
    if (pts.length < 2) return '';
    const cls = ['th', isF ? 'focus' : '', isF && t === 'against' ? 'against' : '', visited.has(a) && visited.has(b) ? 'walked' : '', !isF && Math.max(P[a].theta, P[b].theta) > 100 ? 'far' : ''].join(' ');
    return `<path class="${cls}" data-a="${a}" data-b="${b}" d="M${pts.map(p => p.x.toFixed(1) + ' ' + p.y.toFixed(1)).join('L')}"/>`;
  }).join('');
  const nodes = schools.filter(s => s.id !== focus).map(s => {
    const p = P[s.id], r = rOf(s.id), t1 = !!near[s.id], cls = ['n', t1 ? 't1' : '', p.theta > 100 ? 'back2' : '', visited.has(s.id) ? 'v' : ''].join(' ');
    return `<button class="${cls}" data-id="${s.id}" data-x="${p.x.toFixed(1)}" data-y="${p.y.toFixed(1)}" data-r="${r}" data-pref="${p.out.toFixed(0)}" data-ord="${t1 ? 0 : Math.round(p.theta)}" style="left:${p.x.toFixed(1)}px;top:${p.y.toFixed(1)}px"><i class="dot" style="width:${2 * r}px;height:${2 * r}px"></i><span class="lb">${t1 ? `<em>${verb(near[s.id], focus)}</em>` : ''}<b class="${s.name.length > 20 ? 'wrap' : ''}">${s.name}</b>${visited.has(s.id) ? `<small>visited ${s.visited.replace(' ', '&nbsp;')}</small>` : ''}</span></button>`;
  }).join('\n');
  const d = focus ? detail[focus] : null, name = focus ? schools.find(s => s.id === focus).name : '';
  const thinkerOpen = state === 'thinker' || state === 'copied';
  const centre = focus
    ? `<div class="title solid" style="left:${C[0]}px;top:${C[1]}px"><i class="here"></i><h1>${name}</h1><p>${d.dates} · you are here · <button aria-expanded="${state === 'themes'}">Themes</button></p></div>`
    : `<p class="welcome solid" style="left:${C[0]}px;top:${C[1]}px">Sixteen schools, one ball of thread. Pull any end.</p>`;
  const pop = state === 'themes' ? `<div class="pop" role="dialog" aria-label="Themes of ${name}" style="left:${C[0]}px;top:${C[1] + 70}px"><h2>Themes</h2><ul>${d.themes.map(t => `<li>${t}</li>`).join('')}</ul></div>` : '';
  const sat = thinkerOpen ? `<div class="sat solid" style="left:${C[0]}px;top:${C[1] + 96}px"><i></i>${beauvoir.name}</div>` : '';
  const card = !focus ? '' : thinkerOpen
    ? `<aside class="card solid" aria-label="Thinker"><button class="up">← ${name}</button><h2 class="who">${beauvoir.name}</h2><p class="dates">${beauvoir.dates}</p><p class="sum">${beauvoir.summary}</p><ul class="ideas">${beauvoir.ideas.map(i => `<li>${i}</li>`).join('')}</ul>${state === 'copied'
        ? `<button class="study done">${check}Copied</button><div aria-live="polite"><p class="hint">The prompt is on your clipboard. Paste it into Claude.</p><p class="prompt">${beauvoir.prompt}</p></div>`
        : `<button class="study">Study with Claude</button><p class="hint">Copies a prompt you can paste into Claude.</p>`}${state === 'copied' ? '' : `<p class="others">${d.thinkers.filter(t => t.id !== 'bea').map(t => `<button>${t.short}</button>`).join(' · ')}</p>`}</aside>`
    : `<aside class="card solid" aria-label="${name}"><h2>It asks</h2><ol class="q">${d.questions.map(q => `<li>${q}</li>`).join('')}</ol><hr><h2>Thinkers</h2><ul class="th-list">${d.thinkers.map(t => `<li><button><span>${t.name}</span><span class="yr">${t.dates}</span></button></li>`).join('')}</ul></aside>`;
  const globe = `<defs><radialGradient id="lit" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="#e9e2d4" stop-opacity=".085"/><stop offset=".55" stop-color="#e9e2d4" stop-opacity=".025"/><stop offset="1" stop-color="#e9e2d4" stop-opacity="0"/></radialGradient></defs><circle cx="${C[0]}" cy="${C[1]}" r="${R}" fill="url(#lit)"/><g class="yarn">${YARN.map(([fl, ro, o]) => `<ellipse cx="${C[0]}" cy="${C[1]}" rx="${R}" ry="${(R * fl).toFixed(1)}" transform="rotate(${ro} ${C[0]} ${C[1]})" stroke-opacity="${o}"/>`).join('')}<circle cx="${C[0]}" cy="${C[1]}" r="${R}" stroke-opacity=".1"/></g>`;
  const nv = visited.size;
  return {
    body: `<div class="screen"><svg class="threads" aria-hidden="true">${globe}<mask id="ko" maskUnits="userSpaceOnUse" x="0" y="0" width="1440" height="900"><rect width="1440" height="900" fill="#fff"/></mask><g mask="url(#ko)">${paths}</g>${thinkerOpen ? `<path class="satline" d="M${C[0]} ${C[1] + 64}V${C[1] + 86}"/>` : ''}</svg>
<header class="solid"><div class="wm" translate="no">${mark()}Meander</div>${focus ? `<button class="back" title="Esc" aria-keyshortcuts="Escape">Whole field</button>` : ''}</header>
<main>${nodes}${centre}${sat}${pop}</main>
${card}
${nv ? `<p class="been solid"><i></i>${nv} of ${schools.length} visited, over 3 days</p>` : ''}</div>`,
    web: JSON.stringify({ c: C, R, w: 1440, h: 900 }),
  };
}
