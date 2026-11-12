// 09 Rooms. Axis: a floor plan; schools are rooms, "built on" is a door, "pushed against" is a marked wall. Wayfinding tone, two-colour print.
const R={ // x1,y1,x2,y2
  epi:[30,100,165,270],sto:[165,100,305,270],pre:[30,270,165,520],cla:[165,270,305,520],sch:[305,270,415,520],rat:[415,270,555,520],
  mar:[555,100,665,270],phe:[665,100,805,270],pos:[805,100,990,270],ide:[555,270,725,520],exi:[725,270,900,520],abs:[900,270,990,520],
  emp:[415,520,645,700],ana:[645,520,865,700],uti:[415,700,530,850],pra:[530,700,645,850]};
const num={};
export default {
  name:'Rooms',
  fonts:['Familjen+Grotesk:wght@400;500;700','Martian+Mono:wght@400;600'],
  css:`
.screen{background:#f3eee2;color:#1d2b6f;font:400 13.5px/1.4 'Familjen Grotesk',sans-serif;--paper:#f3eee2;--navy:#1d2b6f;--coral:#ff5a3c;--mint:#a9dcc6}
.wm{position:absolute;left:30px;top:26px;font:700 30px/1 'Familjen Grotesk';letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.wm i{width:30px;height:30px;border:4px solid var(--navy);border-right-color:transparent;display:block;position:relative}
.wm i:after{content:"";position:absolute;right:-4px;top:-4px;width:4px;height:12px;background:var(--navy)}
.tag{position:absolute;left:200px;top:38px;font:400 11px 'Martian Mono',monospace}
svg.links .room{fill:var(--paper);stroke:var(--navy);stroke-width:4}
svg.links .room.v{fill:var(--mint)}
svg.links .room.here{fill:var(--coral)}
svg.links .gap{stroke:var(--paper);stroke-width:7}
svg.links .gap.v{stroke:var(--mint)}
svg.links .arc{fill:none;stroke:var(--navy);stroke-width:1.5}
svg.links .wall{stroke:var(--coral);stroke-width:9}
svg.links .wall2{stroke:var(--navy);stroke-width:9;stroke-dasharray:3 5}
.rm{position:absolute;padding:10px 9px;font:700 14.5px/1.1 'Familjen Grotesk';letter-spacing:-.01em}
.rm u{display:block;text-decoration:none;font:600 10px 'Martian Mono',monospace;margin-bottom:5px;letter-spacing:0}
.rm small{display:block;font:400 9.5px/1.4 'Martian Mono',monospace;margin-top:5px;letter-spacing:0}
.rm.here{color:#fff;font-size:22px}
.rm.here small{font-size:10.5px}
.you{position:absolute;left:${R.exi[0]+12}px;top:${R.exi[3]-42}px;background:var(--navy);color:#fff;font:600 10px 'Martian Mono',monospace;padding:5px 8px;border-radius:99px}
.keyb{position:absolute;left:322px;top:112px;width:220px;font:400 10.5px/1.5 'Martian Mono',monospace}
.keyb b{font:700 15px 'Familjen Grotesk';display:block;margin-bottom:6px}
.keyb div{display:flex;align-items:center;gap:10px;margin-bottom:5px}
.keyb i{width:26px;flex:none;display:block}
.book{position:absolute;left:30px;top:548px;width:360px}
.book b{font:700 15px 'Familjen Grotesk';display:block;margin-bottom:8px}
.book li{display:grid;grid-template-columns:70px 1fr;font:400 11px/1.9 'Martian Mono',monospace;border-bottom:1.5px solid var(--navy)}
.book li:first-child{border-top:1.5px solid var(--navy)}
.book p{font-size:13px;margin-top:10px}
.panel{position:absolute;left:1014px;top:0;width:426px;height:900px;background:var(--navy);color:var(--paper);padding:22px 30px 0}
.back{font:400 10.5px 'Martian Mono',monospace;display:flex;justify-content:space-between;opacity:.8}
.rn{font:600 11px 'Martian Mono',monospace;color:var(--coral);margin-top:20px}
.panel h2{font:700 38px/1 'Familjen Grotesk';letter-spacing:-.03em;margin:4px 0 4px}
.panel .meta{font:400 10.5px 'Martian Mono',monospace;opacity:.8}
.panel h3{font:600 10px 'Martian Mono',monospace;text-transform:uppercase;letter-spacing:.08em;color:var(--mint);margin:14px 0 5px}
.d-q li{font:500 16px/1.25 'Familjen Grotesk';margin-bottom:3px}
.d-themes li{display:inline}.d-themes li:not(:last-child):after{content:" · ";opacity:.5}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;padding:1px 0}
.d-thinkers b{font-weight:700}.d-thinkers i{font:400 10px 'Martian Mono',monospace;opacity:.7}.d-thinkers span{display:none}
.d-against a{font-weight:700;border-bottom:3px solid var(--coral)}
.d-next li{display:grid;grid-template-columns:1fr auto;gap:0 8px;background:var(--paper);color:var(--navy);padding:7px 12px 8px;margin-bottom:6px;align-items:baseline}
.d-next b{font:700 19px/1.1 'Familjen Grotesk';letter-spacing:-.02em}
.d-next b:after{content:" →"}
.d-next em{font:600 9.5px 'Martian Mono',monospace;font-style:normal;grid-column:2;grid-row:1}
.d-next li.against em{color:var(--coral)}
.d-next span{grid-column:1/3;font-size:12.5px;line-height:1.3}
`,
  html({schools,links,detail,S}){
    schools.forEach((s,i)=>num[s.id]=i+1);
    const rooms=schools.map(s=>{const r=R[s.id];return `<rect class="room ${s.visited?'v':''} ${s.id==='exi'?'here':''}" x="${r[0]}" y="${r[1]}" width="${r[2]-r[0]}" height="${r[3]-r[1]}"/>`}).join('');
    const doors=links.map(([a,b,t])=>{const A=R[a],Z=R[b];let seg=null;
      if(A[2]===Z[0]||Z[2]===A[0]){const x=A[2]===Z[0]?A[2]:A[0];const lo=Math.max(A[1],Z[1]),hi=Math.min(A[3],Z[3]);if(hi>lo){const m=lo+(hi-lo)*0.66;seg=['v',x,m]}}
      if(!seg&&(A[3]===Z[1]||Z[3]===A[1])){const y=A[3]===Z[1]?A[3]:A[1];const lo=Math.max(A[0],Z[0]),hi=Math.min(A[2],Z[2]);if(hi>lo){const m=lo+(hi-lo)*0.68;seg=['h',y,m]}}
      if(!seg)return `<!-- no shared wall ${a} ${b} -->`;
      const [o,c,m]=seg;const L=17;
      if(t==='against')return o==='v'?`<line class="wall" x1="${c}" y1="${m-L-4}" x2="${c}" y2="${m+L+4}"/><line class="wall2" x1="${c}" y1="${m-L-4}" x2="${c}" y2="${m+L+4}"/>`:`<line class="wall" x1="${m-L-4}" y1="${c}" x2="${m+L+4}" y2="${c}"/><line class="wall2" x1="${m-L-4}" y1="${c}" x2="${m+L+4}" y2="${c}"/>`;
      return o==='v'?`<line class="gap" x1="${c}" y1="${m-L}" x2="${c}" y2="${m+L}"/><path class="arc" d="M${c} ${m-L}L${c+2*L} ${m-L}A${2*L} ${2*L} 0 0 1 ${c} ${m+L}"/>`:`<line class="gap" x1="${m-L}" y1="${c}" x2="${m+L}" y2="${c}"/><path class="arc" d="M${m-L} ${c}L${m-L} ${c-2*L}A${2*L} ${2*L} 0 0 1 ${m+L} ${c}"/>`}).join('');
    const lb=schools.map(s=>{const r=R[s.id];const here=s.id==='exi';const w=r[2]-r[0];return `<div class="rm ${here?'here':''}" style="left:${r[0]}px;top:${r[1]}px;width:${w}px"><u>${String(num[s.id]).padStart(2,'0')}</u>${s.name.replace('Post-structuralism','Post-structuralism').replace('Analytic philosophy','Analytic philosophy')}<small>${s.visited&&!here?'lights on · '+s.visited:here?'12 Nov':w>130?s.dates:''}</small></div>`}).join('');
    return `<svg class="links">${rooms}${doors}</svg>${lb}<div class="you">● you are here</div>
<div class="wm"><i></i>meander</div><div class="tag">Western philosophy · 16 rooms · sample content</div>
<div class="keyb"><b>Key</b><div><i style="border-top:1.5px solid #1d2b6f;height:12px;border-radius:0 12px 0 0;border-right:1.5px solid #1d2b6f"></i>door: built on</div><div><i style="height:8px;background:repeating-linear-gradient(90deg,#1d2b6f 0 3px,#ff5a3c 3px 8px)"></i>barred wall: pushed against</div><div><i style="height:14px;background:#a9dcc6;border:2px solid #1d2b6f"></i>lights on: you've been in</div><div><i style="font:600 10px 'Martian Mono'">01</i>rooms run oldest to newest</div></div>
<div class="book"><b>Visitors' book · 4 of 16 rooms, over 3 days</b><ul><li><span>3 Nov</span><span>04 Stoicism</span></li><li><span>5 Nov</span><span>02 Classical Greek</span></li><li><span>9 Nov</span><span>08 German Idealism</span></li><li><span>12 Nov</span><span>14 Existentialism</span></li></ul><p>Three doors lead out of the room you're in.</p></div>
<div class="panel"><div class="back"><span>← Whole floor</span><span>Esc</span></div><div class="rn">ROOM 14</div><h2>Existentialism</h2><div class="meta">1840s–1960s · you walked in today, 12 Nov</div>${detail({q:'Key questions',themes:'Themes',thinkers:'In this room',against:'The wall it pushed against',next:'Doors from this room',rel:{built:'ROOM 13 · BUILT ON',grew:'ROOM 15 · GREW FROM IT',against:'ROOM 16 · PUSHED BACK'},study:''},{})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:700 40px/1 'Familjen Grotesk';letter-spacing:-.02em;color:#1d2b6f;display:flex;align-items:center;gap:12px"><i style="width:38px;height:38px;border:5px solid #1d2b6f;border-right-color:transparent;display:block;position:relative"><i style="position:absolute;right:-5px;top:-5px;width:5px;height:15px;background:#1d2b6f"></i></i>meander</span>`,
    personality:'A museum floor plan. Friendly wayfinding in two-colour print.',
    altName:'Meander, or "Rooms"',
    palette:[['paper','#f3eee2'],['navy','#1d2b6f'],['coral','#ff5a3c'],['mint','#a9dcc6']],
    type:[{name:'Familjen Grotesk 700 · names',css:"font-family:'Familjen Grotesk';font-weight:700;letter-spacing:-.02em",sample:'Room 14'},{name:'Martian Mono 400 · numbers, notes',css:"font-family:'Martian Mono';font-size:11px",sample:'lights on · 9 Nov'}],
    voice:{empty:'All the lights are off. Walk into any room.',next:'Doors from this room',been:'Visitors\' book · 4 of 16 rooms'},
    sig:`<svg width="230" height="66"><rect x="4" y="6" width="110" height="54" fill="#a9dcc6" stroke="#1d2b6f" stroke-width="4"/><rect x="114" y="6" width="110" height="54" fill="#ff5a3c" stroke="#1d2b6f" stroke-width="4"/><line x1="114" y1="18" x2="114" y2="48" stroke="#a9dcc6" stroke-width="6"/><path d="M114 18L140 18A30 30 0 0 1 114 48" fill="none" stroke="#1d2b6f" stroke-width="1.5"/></svg>`,
    sigText:'The door: two schools that connect share a wall with a door in it.',
    axis:'floor plan (adjacency, not lines), wayfinding tone',
  },
};
