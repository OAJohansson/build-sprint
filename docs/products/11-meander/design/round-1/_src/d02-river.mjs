// 02 River (seed 1: S = serpentine, hue 205, doubled letters = double bank line). Axis: one winding path through time.
const rows=[185,445,705], X0=180, X1=840, R=130;
// order along the river
const order=[['pre','cla','epi','sto','sch'],['rat','emp','ide','uti','mar'],['pra','ana','phe','exi','abs','pos']];
function wob(x,i){const e=Math.min(1,Math.abs(x-X0)/90,Math.abs(x-X1)/90);return 12*e*Math.sin(x/58+i*1.7)}
function riverPts(){const p=[];
  for(let x=-10;x<=X1;x+=10)p.push([x,rows[0]+wob(x,0)]);
  for(let a=-90;a<=90;a+=6){const r=a*Math.PI/180;p.push([X1+R*Math.cos(r),rows[0]+R+R*Math.sin(r)])}
  for(let x=X1;x>=X0;x-=10)p.push([x,rows[1]+wob(x,1)]);
  for(let a=-90;a<=90;a+=6){const r=a*Math.PI/180;p.push([X0-R*Math.cos(r),rows[1]+R+R*Math.sin(r)])}
  for(let x=X0;x<=1010;x+=10)p.push([x,rows[2]+wob(x,2)]);
  return p}
const pos={};
order.forEach((row,i)=>{const n=row.length;row.forEach((id,k)=>{let t=(k+0.5)/n;let x=i===1?X1-10-t*(X1-X0-30):X0+10+t*((i===2?960:X1)-X0-30);if(i===0)x=30+t*(X1-20);pos[id]=[Math.round(x),Math.round(rows[i]+wob(x,i))]})});
export default {
  name:'River',
  fonts:['Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300;1,9..144,500','DM+Mono:wght@400;500'],
  css:`
.screen{background:#f1ecdf;color:#22323a;font:14px/1.45 Fraunces,serif;--water:#bcd9e6;--bank:#2f6f8f;--ink:#22323a;--moss:#55683a;--rust:#b4532a;--paper:#f1ecdf}
.wm{position:absolute;left:40px;top:26px;font:italic 300 30px/1 Fraunces;letter-spacing:-.01em;z-index:3}
.wm svg{display:block;margin-top:2px}
svg.links .riv{fill:none;stroke:var(--bank);stroke-width:30;stroke-linejoin:round;stroke-linecap:round}
svg.links .riv2{fill:none;stroke:var(--water);stroke-width:26;stroke-linejoin:round;stroke-linecap:round}
svg.links .built{fill:none;stroke:var(--moss);stroke-width:1.5}
svg.links .against{fill:none;stroke:var(--rust);stroke-width:1.5;stroke-dasharray:5 4}
svg.links .trail{fill:none;stroke:var(--ink);stroke-width:2;stroke-dasharray:1 6;stroke-linecap:round}
.reach{position:absolute;font:500 10.5px/1 'DM Mono',monospace;letter-spacing:.22em;text-transform:uppercase;color:var(--bank)}
.pl{position:absolute;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:var(--paper);border:2px solid var(--ink)}
.pl.v{background:var(--ink)}
.pl.here{width:22px;height:22px;margin:-11px 0 0 -11px;background:var(--rust);border-color:var(--ink);box-shadow:0 0 0 5px var(--paper),0 0 0 6.5px var(--ink)}
.pl label{position:absolute;left:50%;transform:translateX(-50%);white-space:nowrap;font:500 17px/1.1 Fraunces;text-align:center;text-shadow:0 0 4px var(--paper),0 0 4px var(--paper),0 0 4px var(--paper),0 0 4px var(--paper)}
.pl.d label{top:26px}.pl.lo label{top:50px}.pl.lo:after{content:'';position:absolute;left:50%;top:24px;height:22px;border-left:1px solid var(--ink);opacity:.5}
.pl.here label{font-size:22px;font-style:italic}.pl.here.d label{top:58px}
.pl label small{display:block;font:400 10.5px/1.5 'DM Mono',monospace;color:#5d6b70}
.pl.v label small{color:var(--rust)}
.key{position:absolute;left:250px;top:38px;display:flex;gap:22px;font:400 11px 'DM Mono',monospace;color:#5d6b70;align-items:center}
.key i{display:inline-block;width:26px;border-top:1.5px solid var(--moss);vertical-align:middle;margin-right:7px}
.key i.a{border-top:1.5px dashed var(--rust)}
.key i.t{border-top:2px dotted var(--ink)}
.note{position:absolute;left:270px;top:560px;width:230px;font:italic 300 15px/1.4 Fraunces;color:#5d6b70}
.panel{position:absolute;left:1010px;top:0;width:430px;height:900px;background:#faf7ee;border-left:1.5px solid var(--ink);padding:26px 34px 0}
.back{font:400 11px 'DM Mono',monospace;color:#5d6b70;display:flex;justify-content:space-between}
.panel h2{font:italic 300 46px/1 Fraunces;letter-spacing:-.02em;margin:18px 0 6px}
.panel .meta{font:400 11px 'DM Mono',monospace;color:var(--rust)}
.panel .lede{font:300 16px/1.4 Fraunces;margin:10px 0 2px}
.panel h3{font:500 10.5px 'DM Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--bank);margin:15px 0 5px}
.d-q li{font:italic 300 16px/1.3 Fraunces;margin-bottom:3px}
.d-themes ul{font-size:13.5px}.d-themes li{display:inline}.d-themes li:not(:last-child):after{content:", "}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;font-size:13.5px;padding:2px 0}
.d-thinkers b{font-weight:500}.d-thinkers i{font:400 10.5px 'DM Mono',monospace;color:#5d6b70}.d-thinkers span{display:none}
.d-against p{font-size:13.5px}.d-against a{font-weight:500;border-bottom:1.5px dashed var(--rust)}
.d-next ul{border-top:1.5px solid var(--ink);margin-top:2px}
.d-next li{padding:8px 0 7px;border-bottom:1px solid #cfc8b6;display:grid;grid-template-columns:1fr auto;gap:0 10px}
.d-next em{font:400 10.5px 'DM Mono',monospace;font-style:normal;color:var(--moss);grid-column:2;grid-row:1;align-self:center}
.d-next li.against em{color:var(--rust)}
.d-next b{font:italic 500 21px/1.1 Fraunces;grid-column:1;grid-row:1}
.d-next span{grid-column:1/3;font-size:13px;color:#4c5a5f}
`,
  html({schools,links,detail,exi,visitedTrail}){
    const pts=riverPts();const d='M'+pts.map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L');
    const same=(a,b)=>order.findIndex(r=>r.includes(a))===order.findIndex(r=>r.includes(b));
    const lp=links.map(([a,b,t])=>{const [x1,y1]=pos[a],[x2,y2]=pos[b];const s=same(a,b);const mx=(x1+x2)/2,my=(y1+y2)/2;return s?`<path class="${t}" d="M${x1} ${y1}Q${mx} ${my-50-Math.abs(x2-x1)/6} ${x2} ${y2}"/>`:`<path class="${t}" d="M${x1} ${y1}C${x1} ${my+20} ${x2} ${my-20} ${x2} ${y2}"/>`}).join('');
    const up={};const low={cla:1,sto:1,emp:1,uti:1,ana:1};
    const pl=schools.map(s=>{const [x,y]=pos[s.id];const here=s.id==='exi';return `<div class="pl d ${low[s.id]?'lo':''} ${s.visited?'v':''} ${here?'here':''}" style="left:${x}px;top:${y}px"><label>${s.name}${s.visited?`<small>${here?'you are here':'landed '+s.visited}</small>`:''}</label></div>`}).join('');
    const reach=[[30,128,'Ancient'],[700,128,'Medieval'],[690,392,'Early modern'],[200,392,'19th century'],[300,652,'20th century'],[900,660,'today →']].map(([x,y,t])=>`<div class="reach" style="left:${x}px;top:${y}px">${t}</div>`).join('');
    return `<svg class="links"><path class="riv" d="${d}"/><path class="riv2" d="${d}"/>${lp}</svg>
<div class="wm">meander<svg width="118" height="12"><path d="M2 6c14-9 22 9 36 0s22 9 36 0 22 9 40 0" fill="none" stroke="#2f6f8f" stroke-width="2.5" stroke-linecap="round"/></svg></div>
<div class="key"><span><i></i>built on</span><span><i class="a"></i>pushed against</span><span>● landed · 4 of 16, over 3 days</span></div>
${reach}${pl}
<div class="panel"><div class="back"><span>← back to the whole river</span><span>esc</span></div><h2>Existentialism</h2><div class="meta">1840s–1960s · landed today, 12 Nov</div><p class="lede">${exi.lede}</p>${detail({q:'It asks',themes:'Themes',thinkers:'Who you meet here',against:'The current it fought',next:'Where the water goes next',rel:{built:'upstream · built on',grew:'downstream · grew from it',against:'downstream · pushed back'},study:''},{})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:italic 300 40px/1 Fraunces;color:#22323a">meander<svg width="158" height="14" style="display:block;margin-top:2px"><path d="M2 7c19-11 30 11 49 0s30 11 49 0 30 11 54 0" fill="none" stroke="#2f6f8f" stroke-width="3" stroke-linecap="round"/></svg></span>`,
    personality:'A hand-drawn river map. Calm, unhurried, a little literary.',
    palette:[['paper','#f1ecdf'],['ink','#22323a'],['water','#bcd9e6'],['bank','#2f6f8f'],['moss','#55683a'],['rust','#b4532a']],
    type:[{name:'Fraunces 300 italic · names',css:'font-family:Fraunces;font-style:italic;font-weight:300',sample:'Downstream'},{name:'DM Mono 400 · dates, labels',css:"font-family:'DM Mono';font-size:12px",sample:'landed 9 Nov · upstream'}],
    voice:{empty:'Nothing landed on yet. Put in at any bend.',next:'Where the water goes next',been:'Landed at 4 of 16, over 3 days'},
    sig:`<svg width="230" height="60"><path d="M0 20c40-22 50 22 90 6s40 40 80 22 40-10 60-14" fill="none" stroke="#2f6f8f" stroke-width="20" stroke-linecap="round"/><path d="M0 20c40-22 50 22 90 6s40 40 80 22 40-10 60-14" fill="none" stroke="#bcd9e6" stroke-width="16" stroke-linecap="round"/><circle cx="90" cy="26" r="6" fill="#22323a"/><circle cx="170" cy="48" r="7" fill="#b4532a" stroke="#22323a" stroke-width="2"/></svg>`,
    sigText:'One river: time is the current, schools are landings.',
    axis:'a single winding path, quiet literary tone',
    seed:true,
  },
};
