// 08 Strata (seed 3: K = a spine with branches, so vertical; digits 3 4 6 = hue 346 and the 3:4:6 spacing; doubled L = stacked pairs). Axis: time runs upward, "built on" is literal.
const B={ // x1,x2,y1,y2
  pre:[120,720,822,878],epi:[120,280,746,802],cla:[310,530,746,802],sto:[560,720,746,802],
  sch:[310,530,664,718],
  rat:[250,470,574,630],emp:[520,950,574,630],ide:[330,690,490,546],
  mar:[330,480,368,424],pra:[705,822,368,424],uti:[836,950,368,424],
  phe:[500,690,234,290],ana:[720,950,234,290],abs:[200,350,128,184],exi:[380,640,116,196],pos:[670,870,128,184]};
const layers=[[84,330,'20th century to now','1880 – today','#f6e9e6'],[330,460,'19th century','1780 – 1900','#edd3d1'],[460,646,'Early modern','1630 – 1830','#dfa9ae'],[646,734,'Medieval','1100 – 1400','#c06c80'],[734,900,'Ancient','600 BCE – 200 CE','#7d2a47']];
const cx=b=>(b[0]+b[1])/2;
export default {
  name:'Strata',
  fonts:['Syne:wght@600;700','Spectral:ital,wght@0,400;0,600;1,400'],
  css:`
.screen{background:#f6e9e6;color:#2a0f1c;font:400 14px/1.45 Spectral,serif;--ink:#2a0f1c;--here:#f4b21b;--rose:#c06c80;--deep:#7d2a47;--paper:#fffaf6}
.top{position:absolute;left:0;top:0;width:1000px;height:84px;display:flex;align-items:center;padding:0 28px;gap:24px;background:var(--paper);border-bottom:2px solid var(--ink)}
.wm{font:700 26px/1 Syne;letter-spacing:-.02em;text-transform:lowercase}
.wm:after{content:"";display:block;height:9px;margin-top:4px;background:linear-gradient(#dfa9ae 0 3px,#c06c80 3px 6px,#7d2a47 6px 9px)}
.top p{font-style:italic;font-size:14px}
.key{margin-left:auto;display:flex;gap:18px;font:600 11.5px Syne;align-items:center}
.key i{display:inline-block;width:24px;border-top:2.5px solid var(--ink);vertical-align:middle;margin-right:6px}
.key i.a{border-top:2.5px dashed var(--ink)}
.key i.v{width:16px;height:12px;background:var(--ink);border:0}
.ly{position:absolute;left:0;width:1000px;padding:10px 0 0 22px;font:600 11px/1.4 Syne;letter-spacing:.04em;text-transform:uppercase}
.ly small{display:block;font:italic 400 12px Spectral;text-transform:none;letter-spacing:0;opacity:.8}
.ly.dk{color:#fff}
svg.links path{fill:none;stroke:var(--ink);stroke-width:2.5}
svg.links path.against{stroke-dasharray:5 5}
.bk{position:absolute;background:var(--paper);border:2px solid var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 14px/1.1 Syne;letter-spacing:-.01em;text-align:center}
.bk small{font:italic 400 11.5px Spectral;margin-top:2px;letter-spacing:0}
.bk.v{background:var(--ink);color:#fff}
.bk.here{background:var(--here);color:var(--ink);font-size:20px;border-width:3px}
.bk.near{box-shadow:0 0 0 4px var(--here)}
.panel{position:absolute;left:1000px;top:0;width:440px;height:900px;background:var(--paper);border-left:2px solid var(--ink);padding:22px 30px 0}
.back{font:600 11.5px Syne;display:flex;justify-content:space-between;opacity:.7}
.panel h2{font:700 34px/1 Syne;letter-spacing:-.03em;margin:16px 0 6px}
.panel .meta{font-style:italic;font-size:13.5px}
.panel .meta b{background:var(--here);font:600 11px Syne;padding:2px 7px;font-style:normal;margin-right:6px}
.panel h3{font:600 11px Syne;letter-spacing:.08em;text-transform:uppercase;color:var(--deep);margin:14px 0 5px;border-top:2px solid var(--ink);padding-top:7px}
.d-q li{font:italic 400 16.5px/1.25 Spectral;margin-bottom:3px}
.d-themes li{display:inline}.d-themes li:not(:last-child):after{content:" · "}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;padding:1px 0}
.d-thinkers b{font-weight:600}.d-thinkers i{font-size:12.5px;color:#6b4a57}.d-thinkers span{display:none}
.d-against a{font-weight:600;border-bottom:2px dashed var(--ink)}
.d-next li{display:grid;grid-template-columns:1fr;border:2px solid var(--ink);padding:6px 12px 7px;margin-bottom:-2px}
.d-next em{font:600 10.5px Syne;font-style:normal;letter-spacing:.06em;text-transform:uppercase;color:var(--deep)}
.d-next b{font:700 17px/1.15 Syne;letter-spacing:-.02em}
.d-next span{font-size:13px;line-height:1.3}
`,
  html({schools,links,detail}){
    const near={phe:1,abs:1,pos:1,ide:1};
    const ly=layers.map(([a,b,n,sp,c],i)=>`<div class="ly ${i>=3?'dk':''}" style="top:${a}px;height:${b-a}px;background:${c}">${n}<small>${sp}</small></div>`).join('');
    const lp=links.map(([a,b,t])=>{const A=B[a],Z=B[b];
      // horizontal neighbours in the same band, else a vertical vein
      if(Math.abs(A[2]-Z[2])<30){const y=(A[2]+A[3])/2;const x1=A[1]<Z[0]?A[1]:A[0],x2=A[1]<Z[0]?Z[0]:Z[1];return `<path class="${t}" d="M${x1} ${y}L${x2} ${y}"/>`}
      const lo=Math.max(A[0],Z[0]),hi=Math.min(A[1],Z[1]);let x=hi-lo>30?(lo+hi)/2:null;
      if(x!==null) return `<path class="${t}" d="M${x} ${A[2]}L${x} ${Z[3]}"/>`;
      const xa=Math.min(Math.max(cx(Z),A[0]+20),A[1]-20),xz=Math.min(Math.max(cx(A),Z[0]+20),Z[1]-20);const my=Z[3]+38;
      return `<path class="${t}" d="M${xa} ${A[2]}L${xa} ${my}L${xz} ${my}L${xz} ${Z[3]}"/>`}).join('');
    const bk=schools.map(s=>{const b=B[s.id];const here=s.id==='exi';return `<div class="bk ${s.visited?'v':''} ${here?'here':''} ${near[s.id]?'near':''}" style="left:${b[0]}px;top:${b[2]}px;width:${b[1]-b[0]}px;height:${b[3]-b[2]}px">${s.name}${s.visited?`<small>${here?'you are here · 12 Nov':'dug '+s.visited}</small>`:''}</div>`}).join('');
    return `${ly}<div class="top"><div class="wm">meander</div><p>Every idea stands on an older one.</p><div class="key"><span><i></i>stands on</span><span><i class="a"></i>broke from</span><span><i class="v"></i>dug: 4 of 16, over 3 days</span></div></div>
<svg class="links">${lp}</svg>${bk}
<div class="panel"><div class="back"><span>← The whole section</span><span>Esc</span></div><h2>Existentialism</h2><div class="meta"><b>YOU ARE HERE</b>1840s–1960s, top layer</div>${detail({q:'Key questions',themes:'Themes',thinkers:'Thinkers',against:'Broke from',next:'Dig down or climb up',rel:{built:'dig down · it stands on',grew:'climb up · grew from it',against:'climb up · broke from it'},study:''},{})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:700 36px/1 Syne;letter-spacing:-.02em;color:#2a0f1c">meander<i style="display:block;height:12px;margin-top:5px;background:linear-gradient(#dfa9ae 0 4px,#c06c80 4px 8px,#7d2a47 8px 12px)"></i></span>`,
    personality:'A cross-section of ground. Solid, earthy, a little blunt.',
    altName:'Meander, or "Bedrock"',
    palette:[['surface','#f6e9e6'],['ink','#2a0f1c'],['clay','#dfa9ae'],['rose','#c06c80'],['deep','#7d2a47'],['here','#f4b21b']],
    type:[{name:'Syne 700 · names',css:'font-family:Syne;font-weight:700;letter-spacing:-.03em',sample:'Dig down'},{name:'Spectral 400 italic · reading text',css:'font-family:Spectral;font-style:italic',sample:'it stands on Phenomenology'}],
    voice:{empty:'Nothing dug yet. Start at the surface or at the bedrock.',next:'Dig down or climb up',been:'Dug 4 of 16, over 3 days'},
    sig:`<div style="width:230px"><div style="border:2px solid #2a0f1c;font:700 12px Syne;text-align:center;padding:5px;width:150px;margin-left:50px;background:#f4b21b">Existentialism</div><div style="border:2px solid #2a0f1c;font:700 12px Syne;text-align:center;padding:5px;margin-top:-2px;background:#fffaf6">Phenomenology</div></div>`,
    sigText:'"Built on" is literal: a school sits on top of what it stands on.',
    axis:'vertical layers (time runs upward), blunt earthy tone',
    seed:true,
  },
};
