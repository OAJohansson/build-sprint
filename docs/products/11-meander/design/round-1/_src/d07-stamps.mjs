// 07 Stamps. Axis: a collection page; "where I've been" is the hero, links are words on each stamp.
const shape={pre:'rect',cla:'oval',epi:'rect',sto:'circle',sch:'oval',rat:'rect',emp:'circle',ide:'rect',uti:'oval',mar:'circle',pra:'rect',ana:'rect',phe:'oval',exi:'rect',abs:'circle',pos:'rect'};
const ink={sto:'#1d7a55',cla:'#1f3a8a',ide:'#6a3fa0',exi:'#c2362b'};
const rot={sto:-5,cla:3,ide:-2,exi:2};
const grid={pre:[0,0],cla:[1,0],epi:[2,0],sto:[3,0],sch:[0,1],rat:[2,1],emp:[3,1],ide:[4,1],uti:[0,2],mar:[1,2],pra:[2,2],ana:[0,3],phe:[1,3],exi:[2,3],abs:[3,3],pos:[4,3]};
const X=c=>44+c*188, Y=r=>104+r*186;
export default {
  name:'Stamps',
  fonts:['Big+Shoulders+Display:wght@500;700;900','Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400'],
  css:`
.screen{background:#efe9dc;color:#2a2620;font:400 14px/1.4 Newsreader,serif;--paper:#efe9dc;--text:#2a2620;--ghost:#b3a991;--red:#c2362b;--navy:#1f3a8a;--green:#1d7a55}
.wm{position:absolute;left:44px;top:22px;font:900 26px/1 'Big Shoulders Display';letter-spacing:.14em;text-transform:uppercase;color:var(--navy);border:2.5px solid var(--navy);outline:1.5px solid var(--navy);outline-offset:3px;border-radius:6px;padding:4px 10px 5px 13px;transform:rotate(-3deg)}
.tag{position:absolute;left:230px;top:34px;font-style:italic;font-size:15px;color:#6e6654}
.eh{position:absolute;font:700 12px 'Big Shoulders Display';letter-spacing:.16em;text-transform:uppercase;color:#6e6654}
.s{position:absolute;width:168px;height:130px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:1.5px dashed var(--ghost);color:#958b74;border-radius:8px;padding:6px 10px}
.s.oval{border-radius:50%}
.s.circle{width:140px;height:140px;border-radius:50%;margin:-5px 0 0 14px}
.s b{font:700 19px/1 'Big Shoulders Display';letter-spacing:.07em;text-transform:uppercase}
.s small{font-size:11.5px;line-height:1.25;margin-top:5px;font-style:italic}
.s small u{text-decoration:none;font-style:normal;font-weight:600}
.s.v{border:3px solid var(--c);outline:1.5px solid var(--c);outline-offset:-8px;color:var(--c)}
.s.v b{font-weight:900;font-size:20px}
.s.v .dt{font:900 15px/1 'Big Shoulders Display';letter-spacing:.12em;border-top:1.5px solid var(--c);border-bottom:1.5px solid var(--c);padding:3px 8px 2px;margin-top:6px}
.s.near{border:1.5px dashed var(--red);color:var(--text)}
.s.near:after{content:"within reach";position:absolute;top:-9px;background:var(--paper);padding:0 6px;font:700 10.5px 'Big Shoulders Display';letter-spacing:.14em;text-transform:uppercase;color:var(--red)}
.tally{position:absolute;left:${X(3)+10}px;top:${Y(2)+4}px;width:340px}
.tally b{font:900 64px/0.9 'Big Shoulders Display';color:var(--navy);display:block}
.tally p{font-style:italic;font-size:15px;color:#6e6654;margin-top:6px}
.panel{position:absolute;left:1000px;top:0;width:440px;height:900px;background:#f8f4ea;border-left:1.5px solid var(--text);padding:22px 32px 0}
.back{font-size:12.5px;font-style:italic;color:#6e6654;display:flex;justify-content:space-between}
.ttl{display:inline-block;margin:16px 0 4px;border:3px solid var(--red);outline:1.5px solid var(--red);outline-offset:3px;border-radius:6px;padding:6px 14px 5px;color:var(--red);transform:rotate(-1.5deg)}
.ttl h2{font:900 36px/1 'Big Shoulders Display';letter-spacing:.08em;text-transform:uppercase}
.ttl p{font:700 13px 'Big Shoulders Display';letter-spacing:.14em;border-top:1.5px solid var(--red);margin-top:4px;padding-top:3px}
.panel h3{font:700 12px 'Big Shoulders Display';letter-spacing:.16em;text-transform:uppercase;color:#6e6654;margin:13px 0 4px}
.d-q li{font-size:16.5px;line-height:1.25;margin-bottom:3px;font-style:italic}
.d-themes li{display:inline}.d-themes li:not(:last-child):after{content:" · "}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;padding:1px 0;font-size:14.5px}
.d-thinkers b{font-weight:600}.d-thinkers i{font:500 13px 'Big Shoulders Display';letter-spacing:.06em;color:#6e6654}.d-thinkers span{display:none}
.d-against a{font-weight:600}
.d-next li{display:grid;grid-template-columns:1fr auto;gap:0 8px;border:1.5px dashed var(--red);border-radius:8px;padding:6px 12px 7px;margin-bottom:7px;align-items:baseline}
.d-next b{font:900 19px/1.1 'Big Shoulders Display';letter-spacing:.07em;text-transform:uppercase}
.d-next em{font-size:12.5px;color:var(--red);grid-column:2;grid-row:1}
.d-next span{grid-column:1/3;font-size:13px;line-height:1.3;color:#5b5444}
`,
  html({schools,links,eras,detail,S}){
    const near={phe:1,abs:1,pos:1};
    const st=schools.map(s=>{const [c,r]=grid[s.id];const on=links.filter(l=>l[1]===s.id).map(l=>`${l[2]==='against'?'against':'on'} <u>${S[l[0]].name}</u>`).join(', ')||'the first questions';
      const here=s.id==='exi';
      return `<div class="s ${shape[s.id]} ${s.visited?'v':''} ${near[s.id]?'near':''}" style="left:${X(c)}px;top:${Y(r)}px;${s.visited?`--c:${ink[s.id]};transform:rotate(${rot[s.id]}deg)`:''}"><b>${s.name}</b>${s.visited?`<span class="dt">${here?'12 NOV 2026':s.visited.replace(/(\d+) Nov/,(m,d)=>d.padStart(2,'0')+' NOV 2026')}</span>`:`<small>${on}</small>`}</div>`}).join('');
    const eh=[[0,0,'Ancient'],[0,1,'Medieval'],[2,1,'Early modern'],[0,2,'19th century'],[0,3,'20th century to now']].map(([c,r,t])=>`<div class="eh" style="left:${X(c)}px;top:${Y(r)-24}px">${t}</div>`).join('');
    return `<div class="wm">Meander</div><div class="tag">Western philosophy, one stamp at a time</div>${eh}${st}
<div class="tally"><b>4 / 16</b><p>stamped over 3 days. Dashed outlines are still to visit; red ones are one step from where you are.</p></div>
<div class="panel"><div class="back"><span>← The whole page</span><span>Esc</span></div><div class="ttl"><h2>Existentialism</h2><p>1840s–1960s · STAMPED 12 NOV 2026</p></div>${detail({q:'Key questions',themes:'Themes',thinkers:'Thinkers',against:'Reacted against',next:'Within reach: three more stamps',rel:{built:'built on',grew:'grew from it',against:'pushed back'},study:''},{})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:900 32px/1 'Big Shoulders Display';letter-spacing:.14em;text-transform:uppercase;color:#1f3a8a;border:3px solid #1f3a8a;outline:1.5px solid #1f3a8a;outline-offset:3px;border-radius:6px;padding:5px 12px 6px 16px;transform:rotate(-3deg);margin-left:8px">Meander</span>`,
    personality:'A page of stamps to fill. Collectible, tactile, lightly playful.',
    altName:'Meander, or "Passage"',
    palette:[['paper','#efe9dc'],['text','#2a2620'],['ink red','#c2362b'],['ink navy','#1f3a8a'],['ink green','#1d7a55'],['ghost','#b3a991']],
    type:[{name:'Big Shoulders Display 900 caps · stamps',css:"font-family:'Big Shoulders Display';font-weight:900;letter-spacing:.08em;text-transform:uppercase",sample:'12 Nov 2026'},{name:'Newsreader 400 · reading text',css:'font-family:Newsreader;font-style:italic',sample:'one step from where you are'}],
    voice:{empty:'A clean page. Sixteen stamps, none yet.',next:'Within reach: three more stamps',been:'4 / 16 stamped over 3 days'},
    sig:`<span style="display:inline-flex;flex-direction:column;align-items:center;border:3px solid #1d7a55;outline:1.5px solid #1d7a55;outline-offset:-7px;border-radius:50%;width:150px;height:64px;justify-content:center;color:#1d7a55;transform:rotate(-4deg);font:900 15px/1 'Big Shoulders Display';letter-spacing:.08em;text-transform:uppercase">Stoicism<span style="font-size:11px;border-top:1.5px solid;margin-top:3px;padding-top:2px">03 NOV 2026</span></span>`,
    sigText:'The dated ink stamp: every visit leaves one on the page.',
    axis:'collection grid, visits as the hero, playful',
  },
};
