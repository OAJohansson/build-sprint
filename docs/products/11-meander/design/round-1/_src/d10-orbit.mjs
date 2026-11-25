// 10 Orbit (seed 4: lowercase start = soft and round; digits 1 2 8 and 2 8 3 = hues 128 and 283; the repeated 8 = two rings). Axis: the map re-centres on where you are; the whole field shrinks to a strip.
const C=[500,385];
const pol=(r,a)=>[Math.round(C[0]+r*Math.cos(a*Math.PI/180)),Math.round(C[1]+r*Math.sin(a*Math.PI/180))];
const ring1={ide:[245,185,'pushed against','ag'],phe:[245,246,'built on',''],abs:[245,20,'grew from it',''],pos:[245,-32,'pushed back','ag']};
const ring2={rat:[352,204,'ide'],emp:[352,167,'ide'],mar:[352,221,'ide'],ana:[352,143,'ide']};
export default {
  name:'Orbit',
  fonts:['Young+Serif','Figtree:wght@400;500;700'],
  css:`
.screen{background:#f6f3ec;color:#1d1a24;font:400 14px/1.45 Figtree,sans-serif;--bg:#f6f3ec;--ink:#1d1a24;--violet:#5b2a86;--lilac:#e7dcf6;--green:#2f8f46;--mint:#d5eed8}
.wm{position:absolute;left:32px;top:24px;font:400 28px/1 'Young Serif';display:flex;align-items:center;gap:10px;color:var(--violet)}
.back{position:absolute;left:32px;top:70px;font-size:12.5px;color:#6a6474}
svg.links .r{fill:none;stroke:#d8d2c6;stroke-width:1.5}
svg.links .l{stroke:var(--green);stroke-width:3}
svg.links .l.ag{stroke:var(--violet);stroke-dasharray:3 7;stroke-linecap:round}
svg.links .l2{stroke:#b9b2a4;stroke-width:1.5}
.rl{position:absolute;font:500 11px Figtree;letter-spacing:.1em;text-transform:uppercase;color:#8d8697;background:var(--bg);padding:0 8px;transform:translate(-50%,-50%)}
.me{position:absolute;left:${C[0]-140}px;top:${C[1]-140}px;width:280px;height:280px;border-radius:50%;background:var(--violet);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:30px}
.me h2{font:400 32px/1 'Young Serif'}
.me p{font-size:13.5px;line-height:1.35;margin-top:10px;opacity:.92}
.me small{font-size:11.5px;opacity:.75;margin-top:10px}
.n1{position:absolute;width:150px;height:150px;margin:-75px 0 0 -75px;border-radius:50%;background:var(--mint);border:2px solid var(--green);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:10px}
.n1.ag{background:var(--lilac);border:2px dashed var(--violet)}
.n1 em{font:700 10.5px Figtree;font-style:normal;letter-spacing:.06em;text-transform:uppercase;color:var(--green)}
.n1.ag em{color:var(--violet)}
.n1 b{font:400 17.5px/1.1 'Young Serif';margin:3px 0}
.n1 small{font-size:11px;line-height:1.25;color:#4c4658}
.n1.v:after{content:"✓ " attr(data-v);position:absolute;bottom:-9px;background:var(--violet);color:#fff;font-size:10.5px;padding:1px 8px;border-radius:99px}
.n2{position:absolute;width:104px;height:104px;margin:-52px 0 0 -52px;border-radius:50%;background:#fff;border:1.5px solid #cfc8ba;display:flex;align-items:center;justify-content:center;text-align:center;font:400 13px/1.15 'Young Serif';color:#4c4658;padding:6px}
.strip2{position:absolute;left:0;top:790px;width:1000px;height:110px;border-top:1.5px solid #d8d2c6;background:#fff}
.strip2 h4{position:absolute;left:32px;top:10px;font:500 11px Figtree;letter-spacing:.1em;text-transform:uppercase;color:#8d8697}
.strip2 .ln{position:absolute;left:40px;right:40px;top:60px;border-top:1.5px solid #cfc8ba}
.d{position:absolute;top:60px;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;background:#fff;border:1.5px solid #8d8697}
.d.v{background:var(--violet);border-color:var(--violet)}
.d.one{border:2.5px solid var(--green);background:var(--mint)}
.d.here{width:20px;height:20px;margin:-10px 0 0 -10px}
.d span{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:10.5px;color:#4c4658}
.d.up span{bottom:16px}.d.dn span{top:16px}
.d.v span{color:var(--violet);font-weight:700}
.panel{position:absolute;left:1000px;top:0;width:440px;height:900px;background:#fff;border-left:1.5px solid #d8d2c6;padding:26px 32px 0}
.panel h3{font:500 11px Figtree;letter-spacing:.1em;text-transform:uppercase;color:#8d8697;margin:0 0 6px}
.panel section{margin-bottom:16px}
.d-q li{font:400 17px/1.25 'Young Serif';margin-bottom:5px}
.d-themes li{display:inline-block;background:var(--lilac);border-radius:99px;padding:2px 10px;margin:0 4px 5px 0;font-size:12.5px}
.d-thinkers>ul>li{border-bottom:1px solid #e6e1d6}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;padding:5px 0}
.d-thinkers b{font-weight:700}.d-thinkers i{font-style:normal;font-size:12px;color:#8d8697}.d-thinkers .t-row span{display:none}
.d-thinkers li.open{background:#faf7ff;border:1.5px solid var(--violet);border-radius:14px;padding:6px 14px 12px;margin:4px -14px}
.d-thinkers li.open b{font:400 19px 'Young Serif'}
.t-open p{font-size:13px;line-height:1.4}
.t-open ul{margin:7px 0 10px}
.t-open li{font-size:13px;padding-left:14px;position:relative;line-height:1.4}
.t-open li:before{content:"";position:absolute;left:0;top:7px;width:6px;height:6px;border-radius:50%;background:var(--green)}
.study{background:var(--violet);color:#fff;border-radius:99px;padding:8px 18px;font:700 13.5px Figtree}
.t-open .hint{font-size:11.5px;color:#8d8697;margin-left:10px}
.d-against p{font-size:13px}.d-against a{font-weight:700;color:var(--violet)}
.d-next{display:none}
`,
  html({schools,detail,S,exi}){
    const why={ide:"Hegel's system",phe:'the method it borrowed',abs:"Camus's answer",pos:'doubted the free subject'};
    const r1=Object.entries(ring1).map(([id,[r,a,rel,cls]])=>{const [x,y]=pol(r,a);return {id,x,y,rel,cls}});
    const r2=Object.entries(ring2).map(([id,[r,a,via]])=>{const [x,y]=pol(r,a);return {id,x,y,via}});
    const lines=r1.map(n=>`<line class="l ${n.cls}" x1="${C[0]}" y1="${C[1]}" x2="${n.x}" y2="${n.y}"/>`).join('')+r2.map(n=>{const p=r1.find(q=>q.id===n.via);return `<line class="l2" x1="${p.x}" y1="${p.y}" x2="${n.x}" y2="${n.y}"/>`}).join('');
    const n1=r1.map(n=>`<div class="n1 ${n.cls} ${S[n.id].visited?'v':''}" ${S[n.id].visited?`data-v="${S[n.id].visited}"`:''} style="left:${n.x}px;top:${n.y}px"><em>${n.rel}</em><b>${S[n.id].name}</b><small>${why[n.id]}</small></div>`).join('');
    const n2=r2.map(n=>`<div class="n2" style="left:${n.x}px;top:${n.y}px">${S[n.id].name}</div>`).join('');
    const dots=schools.map((s,i)=>{const x=60+i*58.5;const one=ring1[s.id]&&!s.visited;return `<div class="d ${i%2?'dn':'up'} ${s.visited?'v':''} ${one?'one':''} ${s.id==='exi'?'here':''}" style="left:${x}px"><span>${s.name}${s.visited&&s.id!=='exi'?' · '+s.visited:''}</span></div>`}).join('');
    let d=detail({q:'Key questions',themes:'Themes',thinkers:'Thinkers',against:'Reacted against',next:'',rel:{},study:'Study with Claude'},{open:'bea'});
    d=d.replace('<button class="study">Study with Claude</button>','<button class="study">Study with Claude</button><span class="hint">copies a ready-made prompt</span>');
    return `<svg class="links"><circle class="r" cx="${C[0]}" cy="${C[1]}" r="245"/><circle class="r" cx="${C[0]}" cy="${C[1]}" r="352"/>${lines}</svg>
<div class="wm"><svg width="30" height="30"><circle cx="15" cy="15" r="13" fill="none" stroke="#5b2a86" stroke-width="2"/><circle cx="15" cy="15" r="7.5" fill="none" stroke="#2f8f46" stroke-width="2"/><circle cx="15" cy="15" r="3" fill="#5b2a86"/></svg>meander</div>
<div class="back">← Whole field &nbsp;·&nbsp; Esc</div>
<div class="rl" style="left:${C[0]}px;top:${C[1]-245}px">one step away</div><div class="rl" style="left:${C[0]+200}px;top:${C[1]-290}px">two steps away</div>
${n2}${n1}
<div class="me"><h2>Existentialism</h2><p>${exi.lede}</p><small>1840s–1960s · here now, 12 Nov</small></div>
<div class="strip2"><h4>The whole field · 16 schools · you've been to 4, over 3 days</h4><div class="ln"></div>${dots}</div>
<div class="panel">${d}</div>`;
  },
  brand:{
    wordmark:`<span style="font:400 40px/1 'Young Serif';color:#5b2a86;display:flex;align-items:center;gap:12px"><svg width="42" height="42"><circle cx="21" cy="21" r="19" fill="none" stroke="#5b2a86" stroke-width="2.5"/><circle cx="21" cy="21" r="11" fill="none" stroke="#2f8f46" stroke-width="2.5"/><circle cx="21" cy="21" r="4" fill="#5b2a86"/></svg>meander</span>`,
    personality:'Wherever you are is the centre. Soft, round, encouraging.',
    altName:'Meander, or "Nearby"',
    palette:[['ground','#f6f3ec'],['ink','#1d1a24'],['violet','#5b2a86'],['lilac','#e7dcf6'],['green','#2f8f46'],['mint','#d5eed8']],
    type:[{name:'Young Serif · names',css:"font-family:'Young Serif'",sample:'One step away'},{name:'Figtree 400/700 · body',css:'font-family:Figtree',sample:'here now, 12 Nov · built on'}],
    voice:{empty:'Start anywhere. Everything here is one step from something.',next:'One step away',been:"You've been to 4, over 3 days"},
    sig:`<svg width="230" height="68"><circle cx="115" cy="34" r="32" fill="none" stroke="#d8d2c6" stroke-width="1.5"/><circle cx="115" cy="34" r="60" fill="none" stroke="#d8d2c6" stroke-width="1.5"/><circle cx="115" cy="34" r="14" fill="#5b2a86"/><circle cx="147" cy="34" r="8" fill="#d5eed8" stroke="#2f8f46" stroke-width="2"/><circle cx="87" cy="18" r="8" fill="#e7dcf6" stroke="#5b2a86" stroke-width="2" stroke-dasharray="3 3"/><circle cx="60" cy="52" r="6" fill="#fff" stroke="#cfc8ba" stroke-width="1.5"/></svg>`,
    sigText:'Two rings: one step away, two steps away. The map re-centres on you.',
    axis:'focus plus context (re-centring map, whole field as a strip), soft tone',
    seed:true,
  },
};
