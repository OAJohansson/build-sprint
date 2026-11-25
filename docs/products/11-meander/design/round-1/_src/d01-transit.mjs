// 01 Transit: the field as a line map. Axis: network diagram, public-signage tone.
const P = { pre:[75,470,'b'], cla:[185,470,'b'], sto:[295,350,'t'], epi:[295,630,'b'], sch:[400,470,'b'], rat:[500,380,'l'], emp:[500,600,'l'],
  ide:[615,380,'tl'], mar:[730,250,'t'], phe:[755,380,'t'], exi:[815,500,'r'], abs:[885,630,'b'], pos:[900,300,'t'], pra:[665,600,'t'], uti:[590,760,'b'], ana:[800,715,'b'] };
const DF = new Set(['emp>ide','emp>ana']);
function octi([x1,y1],[x2,y2],diagFirst){
  const dx=x2-x1, dy=y2-y1, sx=Math.sign(dx)||1, sy=Math.sign(dy)||1, ax=Math.abs(dx), ay=Math.abs(dy);
  if(ay===0||ax===0) return `M${x1} ${y1}L${x2} ${y2}`;
  if(ax>=ay){ const h=diagFirst?0:(ax-ay)/2; return `M${x1} ${y1}L${x1+sx*h} ${y1}L${x1+sx*(h+ay)} ${y2}L${x2} ${y2}`; }
  return diagFirst?`M${x1} ${y1}L${x2} ${y1+sy*ax}L${x2} ${y2}`:`M${x1} ${y1}L${x1} ${y2-sy*ax}L${x2} ${y2}`;
}
const zones=[[0,345,'1','Ancient'],[345,450,'2','Medieval'],[450,690,'3','Early modern'],[690,1000,'4 · 5','19th and 20th century']];
export default {
  name:'Transit',
  fonts:['Overpass:wght@400;600;800;900','Overpass+Mono:wght@400;600'],
  css:`
.screen{background:#f7f5ef;color:#16181d;font:14px/1.4 Overpass,sans-serif;--ink:#16181d;--paper:#f7f5ef;--red:#e23b2e;--blue:#0b5fc4;--yellow:#ffcf1a;--zone:#ece8dc}
.top{position:absolute;left:0;top:0;width:1000px;height:64px;display:flex;align-items:center;padding:0 30px;gap:28px;border-bottom:4px solid var(--ink)}
.wm{font-weight:900;font-size:26px;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
.wm i{width:26px;height:26px;border-radius:50%;border:6px solid var(--red);position:relative;display:block}
.wm i:after{content:"";position:absolute;left:-10px;right:-10px;top:4px;height:6px;background:var(--ink)}
.key{display:flex;gap:20px;font-size:12px;font-weight:600;margin-left:auto;align-items:center}
.key span{display:flex;align-items:center;gap:7px}
.key .l{width:30px;height:0;border-top:5px solid var(--ink)}
.key .l.a{border-top:5px dotted var(--red)}
.key .s{width:14px;height:14px;border-radius:50%;border:3.5px solid var(--ink);background:var(--paper)}
.key .s.v{background:var(--blue)}
.zone{position:absolute;top:64px;bottom:0;padding:14px 0 0 30px;font:600 11px/1.3 'Overpass Mono',monospace;letter-spacing:.04em;text-transform:uppercase}
.zone:nth-of-type(even){background:var(--zone)}
.zone b{display:block;font:900 30px/1 Overpass;opacity:.16;margin-bottom:2px}
svg.links path{fill:none;stroke:var(--ink);stroke-width:7;stroke-linejoin:round;stroke-linecap:round}
svg.links path.against{stroke:var(--red);stroke-dasharray:1 12;stroke-width:7}
.st{position:absolute;width:20px;height:20px;margin:-10px 0 0 -10px;border-radius:50%;border:5px solid var(--ink);background:var(--paper)}
.st.v{background:var(--blue)}
.st.here{width:34px;height:34px;margin:-17px 0 0 -17px;background:var(--yellow);border-width:6px}
.st label{position:absolute;white-space:nowrap;font-weight:800;font-size:14px;line-height:1.15;left:50%;transform:translateX(-50%)}
.st.t label{bottom:22px}.st.b label{top:22px}
.st.l label{left:auto;right:26px;top:-8px;transform:none}
.st.tl label{left:auto;right:16px;bottom:22px;transform:none}
.st.tl label small{text-align:right}
.st.r label{left:40px;top:-6px;transform:none;background:var(--ink);color:#fff;padding:5px 10px 3px;font-size:16px}
.st label small{display:block;font:600 10.5px/1.3 'Overpass Mono',monospace;color:var(--blue);text-align:center}
.st.r label small{color:var(--yellow);text-align:left}
.foot{position:absolute;left:30px;bottom:22px;font:600 11px/1.5 'Overpass Mono',monospace;background:var(--paper);border:3px solid var(--ink);padding:8px 12px}
.foot b{font:800 13px Overpass;display:block}
.panel{position:absolute;left:1000px;top:0;width:440px;height:900px;background:#fff;border-left:4px solid var(--ink);display:flex;flex-direction:column}
.ph{background:var(--ink);color:#fff;padding:14px 26px 16px}
.ph .back{font:600 11px 'Overpass Mono',monospace;display:flex;justify-content:space-between;opacity:.75;margin-bottom:10px}
.ph h2{font-weight:900;font-size:32px;line-height:1;letter-spacing:-.02em}
.ph p{font:600 11px 'Overpass Mono',monospace;color:var(--yellow);margin-top:8px}
.pb{padding:4px 26px 0;flex:1}
.pb h3{font:600 10.5px 'Overpass Mono',monospace;letter-spacing:.08em;text-transform:uppercase;border-top:3px solid var(--ink);padding-top:6px;margin:10px 0 4px}
.pb section:first-child h3{border-top:0}
.d-q li{font-weight:600;font-size:14px;line-height:1.3;margin-bottom:2px}
.d-themes ul{display:flex;flex-wrap:wrap;gap:0 6px;font-size:13px}
.d-themes li:not(:last-child):after{content:" ·";opacity:.4}
.d-thinkers .t-row{display:grid;grid-template-columns:1fr auto;gap:0 10px;padding:3px 0 1px;border-bottom:1px solid #ddd;font-size:12px}
.d-thinkers b{font-weight:800;font-size:14px}
.d-thinkers i{font:400 11px 'Overpass Mono',monospace}
.d-thinkers span{grid-column:1/3;color:#555}
.d-against p{font-size:12.5px}
.d-against a{font-weight:800;border-bottom:3px dotted var(--red);margin-right:2px}
.d-next li{display:grid;grid-template-columns:22px 1fr;gap:0 10px;padding:3px 0;font-size:12px;line-height:1.3;align-items:start}
.d-next em{grid-row:1/4;width:18px;height:18px;border-radius:50%;border:5px solid var(--ink);font-size:0;margin-top:2px}
.d-next li.against em{border-color:var(--red)}
.d-next b{font-weight:900;font-size:16px;line-height:1.1}
.d-next b:after{content:" →"}
.d-next span{color:#555}
.d-next li:before{content:attr(data-rel);grid-column:2;font:600 10.5px 'Overpass Mono',monospace;text-transform:uppercase;letter-spacing:.05em;color:#555}
.d-next li.against:before{color:var(--red)}
`,
  html({schools,links,detail,S}){
    const z=zones.map(([a,b,n,t])=>`<div class="zone" style="left:${a}px;width:${b-a}px"><b>${n}</b>${t}</div>`).join('');
    const paths=links.map(([a,b,t])=>`<path class="${t}" d="${octi(P[a],P[b],t==='against'||DF.has(a+'>'+b))}"/>`).join('');
    const st=schools.map(s=>{const [x,y,d]=P[s.id];const here=s.id==='exi';return `<div class="st ${d} ${s.visited?'v':''} ${here?'here':''}" style="left:${x}px;top:${y}px"><label>${s.name}${s.visited?`<small>${here?'You are here · 12 Nov':s.visited}</small>`:''}</label></div>`}).join('');
    let d=detail({q:'Key questions',themes:'Themes',thinkers:'On this platform',against:'Pushed against',next:'Next stops',rel:{},study:''},{});
    d=d.replace('<li class="built">','<li class="built" data-rel="Built on · 1 stop back">').replace('<li class="grew">','<li class="grew" data-rel="Grew from here · 1 stop on">').replace('<li class="against">','<li class="against" data-rel="Pushed back · 1 stop on">');
    return `${z}<div class="top"><div class="wm"><i></i>meander</div><div class="key"><span><i class="l"></i>built on</span><span><i class="l a"></i>pushed against</span><span><i class="s v"></i>been there</span><span><i class="s"></i>not yet</span></div></div>
<svg class="links">${paths}</svg>${st}
<div class="foot"><b>Where you've been</b>4 of 16 stations · 3 days<br>Stoicism → Classical Greek → German Idealism → here</div>
<div class="panel"><div class="ph"><div class="back"><span>← Whole map</span><span>Esc</span></div><h2>Existentialism</h2><p>Zone 5 · 1840s–1960s · 5 thinkers</p></div><div class="pb">${d}</div></div>`;
  },
  brand:{
    wordmark:`<span style="font:900 34px Overpass;letter-spacing:-.02em;display:flex;align-items:center;gap:12px"><i style="width:34px;height:34px;border-radius:50%;border:8px solid #e23b2e;position:relative;display:block"><i style="position:absolute;left:-13px;right:-13px;top:5px;height:8px;background:#16181d"></i></i>meander</span>`,
    personality:'A public line map. Crisp, confident, built to be read in two seconds.',
    palette:[['paper','#f7f5ef'],['ink','#16181d'],['against','#e23b2e'],['been','#0b5fc4'],['here','#ffcf1a'],['zone','#ece8dc']],
    type:[{name:'Overpass 900 · names, stations',css:'font-family:Overpass;font-weight:900;letter-spacing:-.02em',sample:'Next stops'},{name:'Overpass Mono 600 · dates, labels',css:"font-family:'Overpass Mono';font-weight:600;font-size:12px",sample:'ZONE 5 · 1840s–1960s'}],
    voice:{empty:'No stations visited yet. Board anywhere.',next:'Next stops',been:'4 of 16 stations · 3 days'},
    sig:`<svg width="230" height="60"><path d="M10 40H80L110 15H220" fill="none" stroke="#16181d" stroke-width="7" stroke-linejoin="round"/><circle cx="30" cy="40" r="8" fill="#0b5fc4" stroke="#16181d" stroke-width="5"/><circle cx="125" cy="15" r="13" fill="#ffcf1a" stroke="#16181d" stroke-width="6"/><circle cx="200" cy="15" r="8" fill="#f7f5ef" stroke="#16181d" stroke-width="5"/></svg>`,
    sigText:'The station dot: hollow, filled once visited, yellow where you are.',
    axis:'network line map, signage tone, side board',
  },
};
