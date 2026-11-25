// 06 Yes, but. Axis: the field as a 2,600-year conversation; each school is a claim that replies to an earlier one. Playful tone.
const cols={anc:24,med:222,mod:420,c19:618,c20:816};
export default {
  name:'Yes, but',
  fonts:['Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800','DM+Sans:wght@400;500;700'],
  css:`
.screen{background:#fff3dc;color:#1c1a2e;font:400 13.5px/1.4 'DM Sans',sans-serif;--cream:#fff3dc;--ink:#1c1a2e;--pink:#ff4d8d;--green:#00a676;--yellow:#ffd23f;--lav:#d9d4ff}
.wm{position:absolute;left:24px;top:20px;font:800 34px/1 'Bricolage Grotesque';letter-spacing:-.03em}
.wm i{color:var(--pink);font-style:normal}
.tag{position:absolute;left:190px;top:32px;font-size:13px;color:#5a5670}
.key{position:absolute;left:520px;top:30px;display:flex;gap:16px;font:600 12px 'Bricolage Grotesque';align-items:center}
.key b{padding:2px 9px 3px;border-radius:99px;color:#fff;background:var(--green);font-weight:600}
.key b.n{background:var(--pink)}
.key span{color:#5a5670;font:400 12px 'DM Sans'}
.eh{position:absolute;top:82px;font:800 13px 'Bricolage Grotesque';text-transform:uppercase;letter-spacing:.06em}
.col{position:absolute;top:110px;width:186px;display:flex;flex-direction:column;gap:20px}
.c{background:#fff;border:2px solid var(--ink);border-radius:16px 16px 16px 3px;padding:9px 12px 10px;position:relative}
.c .re{font:600 11px/1.2 'Bricolage Grotesque';color:var(--green);margin-bottom:4px}
.c .re.n{color:var(--pink)}
.c q{display:block;font:600 16px/1.15 'Bricolage Grotesque';letter-spacing:-.01em;quotes:none}
.c .who{font-size:11.5px;margin-top:6px;display:flex;justify-content:space-between;gap:6px;color:#5a5670}
.c .who b{color:var(--ink);font-weight:700}
.c.v{background:var(--lav)}
.c.here{background:var(--yellow);box-shadow:5px 5px 0 var(--ink)}
.c.one{box-shadow:5px 5px 0 var(--green)}.c.one.n{box-shadow:5px 5px 0 var(--pink)}
svg.links path{fill:none;stroke:var(--pink);stroke-width:3;stroke-dasharray:2 7;stroke-linecap:round}
.panel{position:absolute;left:1024px;top:0;width:416px;height:900px;background:#fff;border-left:2px solid var(--ink);padding:20px 28px 0}
.back{font-size:12px;color:#5a5670;display:flex;justify-content:space-between}
.panel .big{font:800 31px/1.02 'Bricolage Grotesque';letter-spacing:-.03em;margin:14px 0 8px;background:var(--yellow);border:2px solid var(--ink);border-radius:20px 20px 20px 4px;padding:14px 16px 16px}
.panel .meta{font-size:12.5px}.panel .meta b{font:800 17px 'Bricolage Grotesque'}
.panel h3{font:800 12px 'Bricolage Grotesque';text-transform:uppercase;letter-spacing:.06em;margin:13px 0 4px}
.d-q li{font:600 15px/1.25 'Bricolage Grotesque';margin-bottom:2px}
.d-themes li{display:inline-block;border:1.5px solid var(--ink);border-radius:99px;padding:1px 9px 2px;margin:0 3px 4px 0;font-size:12px}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;font-size:13px;padding:1px 0}
.d-thinkers b{font-weight:700}.d-thinkers i{font-style:normal;color:#5a5670;font-size:11.5px}.d-thinkers span{display:none}
.d-against p{font-size:12.5px}.d-against a{font-weight:700;color:var(--pink)}
.d-next li{border:2px solid var(--ink);border-radius:14px 14px 14px 3px;padding:6px 12px 8px;margin-bottom:7px;display:grid;grid-template-columns:1fr auto;gap:0 8px;align-items:center;box-shadow:4px 4px 0 var(--green)}
.d-next li.against{box-shadow:4px 4px 0 var(--pink)}
.d-next b{font:800 18px/1.1 'Bricolage Grotesque';letter-spacing:-.01em}
.d-next em{font:600 11px 'Bricolage Grotesque';font-style:normal;color:#fff;background:var(--green);border-radius:99px;padding:1px 8px 2px;grid-column:2;grid-row:1}
.d-next li.against em{background:var(--pink)}
.d-next span{grid-column:1/3;font-size:12px;color:#5a5670}
`,
  html({schools,links,eras,detail,S,exi}){
    const one={phe:'',abs:'',pos:'n',ide:'n'};
    const heads=eras.map(e=>`<div class="eh" style="left:${cols[e.id]+4}px">${e.name.replace(' to now','')}</div>`).join('');
    const colsH=eras.map(e=>`<div class="col" style="left:${cols[e.id]}px">${schools.filter(s=>s.era===e.id).map(s=>{
      const re=links.filter(l=>l[1]===s.id).map(l=>`<div class="re ${l[2]==='against'?'n':''}">↳ ${l[2]==='against'?'no, but':'yes, and'} · ${S[l[0]].name}</div>`).join('')||'<div class="re" style="color:#5a5670">opens the conversation</div>';
      const here=s.id==='exi';
      return `<div class="c ${s.visited?'v':''} ${here?'here':''} ${s.id in one?'one '+one[s.id]:''}">${re}<q>${s.claim}</q><div class="who"><b>${s.name}</b>${s.visited?`<span>${here?'here now':'heard '+s.visited}</span>`:''}</div></div>`}).join('')}</div>`).join('');
    return `<div class="wm">yes<i>,</i> but</div><div class="tag">2,600 years of people answering each other</div>
<div class="key"><b>yes, and</b><span>built on</span><b class="n">no, but</b><span>pushed against</span><span>· lilac: heard (4 of 16)</span></div>
${heads}${colsH}
<div class="panel"><div class="back"><span>← The whole conversation</span><span>Esc</span></div><div class="big">“${S.exi.claim}”</div><div class="meta"><b>Existentialism</b> · 1840s–1960s · here now, 12 Nov</div>${detail({q:'What it keeps asking',themes:'Keeps coming back to',thinkers:'Who said it',against:'It was saying no to',next:'Hear the other side',rel:{built:'it said yes, and',grew:'said yes, and',against:'said no, but'},study:''},{})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:800 46px/1 'Bricolage Grotesque';letter-spacing:-.03em;color:#1c1a2e">yes<i style="color:#ff4d8d;font-style:normal">,</i> but</span>`,
    personality:'Philosophy as one long argument. Witty, bright, a bit cheeky.',
    altName:'"Yes, but" (Meander as fallback)',
    palette:[['cream','#fff3dc'],['ink','#1c1a2e'],['no, but','#ff4d8d'],['yes, and','#00a676'],['here','#ffd23f'],['heard','#d9d4ff']],
    type:[{name:'Bricolage Grotesque 800/600 · claims, names',css:"font-family:'Bricolage Grotesque';font-weight:800;letter-spacing:-.03em",sample:'no, but…'},{name:'DM Sans 400 · body',css:"font-family:'DM Sans'",sample:'heard 9 Nov · here now'}],
    voice:{empty:'2,600 years of people answering each other. Start with anyone.',next:'Hear the other side',been:'Heard 4 of 16, over 3 days'},
    sig:`<div style="display:flex;gap:10px;align-items:center"><b style="font:600 15px 'Bricolage Grotesque';color:#fff;background:#00a676;border-radius:99px;padding:4px 14px 6px">↳ yes, and</b><b style="font:600 15px 'Bricolage Grotesque';color:#fff;background:#ff4d8d;border-radius:99px;padding:4px 14px 6px">↳ no, but</b></div>`,
    sigText:'Each school is one claim replying "yes, and" or "no, but" to an earlier one.',
    axis:'conversation thread, links as words, playful',
  },
};
