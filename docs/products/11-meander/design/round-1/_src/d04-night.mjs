// 04 Night chart. Axis: scattered sky, bottom drawer instead of a side panel; your visits draw your own constellation.
const P={pre:[90,310],cla:[225,235],epi:[260,410],sto:[365,160],sch:[480,300],rat:[610,205],emp:[650,395],ide:[790,275],uti:[840,445],mar:[925,150],pra:[975,385],ana:[1100,440],phe:[1065,215],exi:[1190,315],abs:[1320,410],pos:[1335,190]};
const star=(r)=>`M0 ${-r}Q${r*.18} ${-r*.18} ${r} 0Q${r*.18} ${r*.18} 0 ${r}Q${-r*.18} ${r*.18} ${-r} 0Q${-r*.18} ${-r*.18} 0 ${-r}Z`;
export default {
  name:'Night chart',
  fonts:['Cormorant+Garamond:ital,wght@0,500;0,600;1,400;1,500','Karla:wght@400;500;700'],
  css:`
.screen{background:#0d1326;color:#f3ead2;font:400 14px/1.45 Karla,sans-serif;--night:#0d1326;--deep:#161e3a;--cream:#f3ead2;--gold:#e9b44c;--coral:#e8806a;--mist:#8690b3}
.wm{position:absolute;left:36px;top:24px;font:italic 500 30px/1 'Cormorant Garamond';display:flex;align-items:center;gap:8px}
.key{position:absolute;right:36px;top:30px;display:flex;gap:22px;color:var(--mist);font-size:12px;align-items:center}
.key i{display:inline-block;width:26px;border-top:1px solid var(--cream);vertical-align:middle;margin-right:7px;opacity:.7}
.key i.a{border-top:1px dashed var(--coral);opacity:1}.key i.t{border-top:2px solid var(--gold);opacity:1}
.era{position:absolute;top:84px;font:italic 400 17px/1 'Cormorant Garamond';color:var(--mist);letter-spacing:.04em}
svg.links .built{stroke:var(--cream);stroke-width:1;opacity:.38}
svg.links .against{stroke:var(--coral);stroke-width:1.2;stroke-dasharray:4 5;opacity:.9}
svg.links .trail{fill:none;stroke:var(--gold);stroke-width:2.2;stroke-linejoin:round}
svg.links .s0{fill:var(--night);stroke:var(--cream);stroke-width:1.3}
svg.links .s1{fill:var(--gold)}
svg.links .ring{fill:none;stroke:var(--gold);stroke-width:1.2}
.lb{position:absolute;white-space:nowrap;font:500 17px/1.1 'Cormorant Garamond';transform:translateX(-50%);text-align:center;color:#cfd3e4}
.lb.v{color:var(--cream);font-weight:600}
.lb small{display:block;font:500 11px Karla;color:var(--gold);margin-top:2px}
.lb.here{font:italic 500 26px/1 'Cormorant Garamond';color:var(--gold)}
.drawer{position:absolute;left:0;top:520px;width:1440px;height:380px;background:var(--deep);border-top:1px solid #36406a;padding:22px 36px 0;display:grid;grid-template-columns:330px 270px 330px 1fr;grid-template-areas:"head themes thinkers next" "q against thinkers next";grid-template-rows:auto 1fr;gap:0 40px}
.dh{grid-area:head}.d-q{grid-area:q}.d-themes{grid-area:themes}.d-against{grid-area:against}.d-thinkers{grid-area:thinkers}.d-next{grid-area:next}
.dh .back{font-size:12px;color:var(--mist);margin-bottom:10px}
.dh h2{font:italic 500 44px/1 'Cormorant Garamond';color:var(--gold)}
.dh p{font-size:12px;color:var(--mist);margin:6px 0 14px}
.drawer h3{font:700 10.5px Karla;letter-spacing:.14em;text-transform:uppercase;color:var(--mist);margin-bottom:8px}
.d-q li{font:italic 500 19px/1.2 'Cormorant Garamond';margin-bottom:7px}
.d-themes{padding-top:22px}.d-themes li{font-size:13.5px;line-height:1.55}
.d-against{padding-top:14px}.d-against p{font-size:13px;color:#c9cde0}.d-against a{color:var(--coral);border-bottom:1px dashed var(--coral)}
.d-thinkers{padding-top:22px}
.d-thinkers .t-row{display:grid;grid-template-columns:1fr auto;gap:0 8px;padding:5px 0 6px;border-bottom:1px solid #2b355c}
.d-thinkers b{font:600 18px/1.1 'Cormorant Garamond'}.d-thinkers i{font-style:normal;font-size:11.5px;color:var(--mist)}.d-thinkers span{grid-column:1/3;font-size:12.5px;color:#c9cde0}
.d-next{padding-top:22px}
.d-next li{display:grid;grid-template-columns:28px 1fr auto;gap:0 10px;padding:9px 0 10px;border-bottom:1px solid #2b355c;align-items:baseline}
.d-next li:before{content:"";width:14px;height:14px;border-radius:50%;border:1.3px solid var(--cream);grid-row:1/3;align-self:center;justify-self:center}
.d-next b{font:italic 500 26px/1 'Cormorant Garamond';color:var(--cream)}
.d-next em{font-style:normal;font-size:11.5px;color:var(--mist);grid-column:3;grid-row:1}
.d-next li.against em{color:var(--coral)}
.d-next span{grid-column:2/4;font-size:13px;color:#c9cde0}
`,
  html({schools,links,detail,visitedTrail}){
    const lp=links.map(([a,b,t])=>`<line class="${t}" x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}"/>`).join('');
    const trail=`<path class="trail" d="M${visitedTrail.map(i=>P[i].join(' ')).join('L')}"/>`;
    const st=schools.map(s=>{const [x,y]=P[s.id];const here=s.id==='exi';return s.visited?`<g transform="translate(${x} ${y})">${here?'<circle class="ring" r="24"/>':''}<path class="s1" d="${star(here?17:12)}"/></g>`:`<circle class="s0" cx="${x}" cy="${y}" r="5"/>`}).join('');
    const lb=schools.map(s=>{const [x,y]=P[s.id];const here=s.id==='exi';return `<div class="lb ${s.visited?'v':''} ${here?'here':''}" style="left:${x}px;top:${y+(here?32:14)}px">${s.name}${s.visited?`<small>${here?'you are here':'lit '+s.visited}</small>`:''}</div>`}).join('');
    const era=[[70,'Ancient'],[450,'Medieval'],[600,'Early modern'],[850,'19th century'],[1090,'20th century to now']].map(([x,t])=>`<div class="era" style="left:${x}px">${t}</div>`).join('');
    return `<svg class="links">${lp}${trail}${st}</svg>
<div class="wm"><svg width="22" height="22" viewBox="-12 -12 24 24"><path d="${star(11)}" fill="#e9b44c"/></svg>meander</div>
<div class="key"><span><i></i>built on</span><span><i class="a"></i>pushed against</span><span><i class="t"></i>your path: 4 of 16 lit, over 3 nights</span></div>
${era}${lb}
<div class="drawer"><div class="dh"><div class="back">← The whole sky &nbsp;·&nbsp; Esc</div><h2>Existentialism</h2><p>1840s–1960s · lit tonight, 12 Nov</p></div>${detail({q:'It asks',themes:'Themes',thinkers:'Thinkers',against:'Pushed against',next:'Nearest lights',rel:{built:'built on',grew:'grew from it',against:'pushed back'},study:''},{shortNames:false})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:italic 500 40px/1 'Cormorant Garamond';color:#f3ead2;background:#0d1326;padding:10px 20px 14px 14px;display:flex;align-items:center;gap:10px"><svg width="28" height="28" viewBox="-12 -12 24 24"><path d="${star(11)}" fill="#e9b44c"/></svg>meander</span>`,
    personality:'A star chart you fill in yourself. Quiet, wondering, late-evening.',
    altName:'Meander, or "Nightwalk"',
    palette:[['night','#0d1326'],['deep','#161e3a'],['cream','#f3ead2'],['gold','#e9b44c'],['coral','#e8806a'],['mist','#8690b3']],
    type:[{name:'Cormorant Garamond 500 italic · names',css:"font-family:'Cormorant Garamond';font-style:italic;font-weight:500",sample:'Nearest lights'},{name:'Karla 400 · body, dates',css:'font-family:Karla',sample:'lit 9 Nov · built on'}],
    voice:{empty:'A dark sky, sixteen faint points. Light the first one.',next:'Nearest lights',been:'4 of 16 lit, over 3 nights'},
    sig:`<svg width="240" height="64" style="background:#0d1326"><path d="M25 50L95 20L160 45L215 22" fill="none" stroke="#e9b44c" stroke-width="2"/><g fill="#e9b44c"><path transform="translate(25 50)" d="${star(9)}"/><path transform="translate(95 20)" d="${star(9)}"/><path transform="translate(160 45)" d="${star(9)}"/><path transform="translate(215 22)" d="${star(13)}"/></g></svg>`,
    sigText:'Your visits join into your own constellation.',
    axis:'scattered sky with a bottom drawer, dark and quiet',
  },
};
