// 03 Departures (seed 2: leading digit = tabular family, 7 columns, run of capitals = condensed caps, hue 37 amber). Axis: a table, not a graph; highest density.
export default {
  name:'Departures',
  fonts:['Barlow+Condensed:wght@400;500;600;700','JetBrains+Mono:wght@400;500;700'],
  css:`
.screen{background:#11120f;color:#e9e4d4;font:500 15px/1.2 'Barlow Condensed',sans-serif;--amber:#ffb224;--dim:#8d8a7c;--line:#2b2c26;--bg:#11120f;--red:#ff6a4d;--green:#9bd17a;letter-spacing:.02em}
.top{height:66px;display:flex;align-items:center;padding:0 32px;gap:28px;border-bottom:1px solid var(--line)}
.wm{font:700 30px/1 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase;color:var(--amber)}
.top p{font:400 12px 'JetBrains Mono',monospace;color:var(--dim);letter-spacing:0}
.top .r{margin-left:auto;text-align:right}
.top .r b{color:var(--amber);font-weight:500}
table{border-collapse:collapse;width:1376px;margin:0 32px;table-layout:fixed}
th{font:500 11px 'JetBrains Mono',monospace;color:var(--dim);text-align:left;text-transform:uppercase;letter-spacing:.1em;padding:10px 10px 7px;border-bottom:1px solid var(--line)}
td{padding:0 10px;height:27px;border-bottom:1px solid var(--line);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:16px;text-transform:uppercase}
td.era{white-space:normal;line-height:1.5;font:500 11px 'JetBrains Mono',monospace;color:var(--dim);vertical-align:top;padding-top:8px;letter-spacing:.06em;border-right:1px solid var(--line)}
td.dt,td.vis{font:400 12px 'JetBrains Mono',monospace;color:var(--dim);letter-spacing:0;text-transform:none}
td.nm{font-weight:700;font-size:18px;letter-spacing:.05em}
td.who{color:var(--dim);text-transform:none;font-weight:400}
td.b{color:var(--green)}td.a{color:var(--red)}
td.vis b{color:var(--amber);font-weight:500}
tr.near td.nm{color:var(--amber)}
tr.near td.nm:after{content:" ›"}
tr.here td{background:var(--amber);color:#11120f;border-color:var(--amber)}
tr.here td.dt,tr.here td.vis,tr.here td.vis b,tr.here td.who,tr.here td.b,tr.here td.a{color:#11120f}
tr.open td{white-space:normal;height:auto;padding:0;border-bottom:2px solid var(--amber);text-transform:none}
.open-in{display:grid;grid-template-columns:330px 300px 1fr;border-left:2px solid var(--amber);border-right:2px solid var(--amber)}
.open-in>div{padding:14px 20px 16px;border-right:1px solid var(--line)}
.open-in>div:last-child{border-right:0}
.open-in h3{font:500 11px 'JetBrains Mono',monospace;color:var(--amber);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
.open-in h3:not(:first-child){margin-top:14px}
.oq li{font-size:19px;font-weight:500;line-height:1.15;margin-bottom:6px;letter-spacing:.01em}
.oq p,.ot p{font:400 12px/1.5 'JetBrains Mono',monospace;color:#b9b4a3;letter-spacing:0}
.ot li{display:grid;grid-template-columns:96px 1fr;font-size:17px;padding:2px 0;gap:8px;align-items:baseline}
.ot li b{font-weight:600;text-transform:uppercase;letter-spacing:.04em}
.ot li i{font:400 11px 'JetBrains Mono',monospace;color:var(--dim);letter-spacing:0}
.ot li span{display:none}
.dep{width:100%;margin:0;border-collapse:collapse}
.dep td{height:auto;padding:7px 8px;white-space:normal;border-bottom:1px solid var(--line);text-transform:none;vertical-align:top;font-size:15px}
.dep tr:last-child td{border-bottom:0}
.dep .pf{width:44px;font:700 22px 'JetBrains Mono',monospace;color:var(--amber)}
.dep .to{width:222px;font:700 21px/1 'Barlow Condensed';text-transform:uppercase;letter-spacing:.05em;color:#fff}
.dep .to small{display:block;font:400 11px 'JetBrains Mono',monospace;letter-spacing:0;margin-top:5px;color:var(--green);text-transform:none}
.dep .ag .to small{color:var(--red)}
.dep .why{color:#b9b4a3;font:400 12px/1.5 'JetBrains Mono',monospace;letter-spacing:0}
.dep .go{width:86px;text-align:right;font:500 11px 'JetBrains Mono',monospace;color:var(--amber);letter-spacing:.06em}
.foot{position:absolute;left:32px;right:32px;bottom:12px;display:flex;justify-content:space-between;font:400 11px 'JetBrains Mono',monospace;color:var(--dim);letter-spacing:0}
`,
  html({schools,links,eras,exi,S}){
    const near=new Set(['phe','abs','pos','ide']);
    const rows=[];
    for(const e of eras){const ss=schools.filter(s=>s.era===e.id);ss.forEach((s,i)=>{
      const b=links.filter(l=>l[1]===s.id&&l[2]==='built').map(l=>S[l[0]].name).join(', ')||'—';
      const a=links.filter(l=>l[1]===s.id&&l[2]==='against').map(l=>S[l[0]].name).join(', ')||'—';
      const here=s.id==='exi';
      rows.push(`<tr class="${here?'here':''} ${near.has(s.id)?'near':''}">${i===0?`<td class="era" rowspan="${ss.length+(e.id==='c20'?1:0)}">${e.name}</td>`:''}<td class="dt">${s.dates}</td><td class="nm">${s.name}</td><td class="b">${b}</td><td class="a">${a}</td><td class="who">${s.who}</td><td class="vis">${s.visited?(here?'<b>Open now · 12 Nov</b>':`<b>●</b> ${s.visited}`):'·'}</td></tr>`);
      if(here)rows.push(`<tr class="open"><td colspan="6"><div class="open-in">
<div class="oq"><h3>Key questions</h3><ol>${exi.questions.map(q=>`<li>${q}</li>`).join('')}</ol><h3>Themes</h3><p>${exi.themes.join(' / ')}</p></div>
<div class="ot"><h3>Thinkers · open one to study it with Claude</h3><ul>${exi.thinkers.map(t=>`<li><b>${t.short}</b><i>${t.dates}</i></li>`).join('')}</ul><h3>Reacted against</h3><p>${exi.against.text}</p></div>
<div><h3>Departing from Existentialism</h3><table class="dep">
<tr><td class="pf">1</td><td class="to">Phenomenology<small>built on</small></td><td class="why">${exi.next[0].why}</td><td class="go">BOARD ›</td></tr>
<tr><td class="pf">2</td><td class="to">Absurdism<small>grew from it</small></td><td class="why">${exi.next[1].why}</td><td class="go">BOARD ›</td></tr>
<tr class="ag"><td class="pf">3</td><td class="to">Post-structuralism<small>pushed back</small></td><td class="why">${exi.next[2].why}</td><td class="go">BOARD ›</td></tr>
<tr class="ag"><td class="pf">4</td><td class="to">German Idealism<small>what it pushed against</small></td><td class="why">Go back to the system it was arguing with. Visited 9 Nov.</td><td class="go">BOARD ›</td></tr>
</table></div></div></td></tr>`);
    })}
    return `<div class="top"><div class="wm">Meander</div><p>Western philosophy · 16 schools · 600 BCE to today</p><p class="r">Visited <b>4 of 16</b> over <b>3 days</b> · last: German Idealism, 9 Nov<br>Esc closes the open row</p></div>
<table><colgroup><col style="width:112px"><col style="width:176px"><col style="width:230px"><col style="width:240px"><col style="width:180px"><col><col style="width:150px"></colgroup>
<thead><tr><th>Era</th><th>Active</th><th>School</th><th>Built on</th><th>Pushed against</th><th>Thinkers</th><th>Visited</th></tr></thead><tbody>${rows.join('')}</tbody></table>
<div class="foot"><span>Amber names are one step from the open row.</span><span>Sample content</span></div>`;
  },
  brand:{
    wordmark:`<span style="font:700 38px/1 'Barlow Condensed';letter-spacing:.2em;text-transform:uppercase;color:#ffb224;background:#11120f;padding:10px 6px 10px 16px">Meander</span>`,
    personality:'A station departure board. Dry, exact, everything on one page.',
    altName:'Meander, or "Platform"',
    palette:[['board','#11120f'],['text','#e9e4d4'],['amber','#ffb224'],['built','#9bd17a'],['against','#ff6a4d'],['rule','#2b2c26']],
    type:[{name:'Barlow Condensed 700 caps · names',css:"font-family:'Barlow Condensed';font-weight:700;text-transform:uppercase;letter-spacing:.06em",sample:'Platform 2'},{name:'JetBrains Mono 400 · dates, notes',css:"font-family:'JetBrains Mono';font-size:12px",sample:'1840s–1960s · board ›'}],
    voice:{empty:'Nothing visited yet. All 16 are boarding.',next:'Departing from Existentialism',been:'Visited 4 of 16 over 3 days'},
    sig:`<div style="background:#11120f;padding:8px 12px;display:flex;gap:12px;align-items:center;width:250px"><span style="font:700 24px 'JetBrains Mono';color:#ffb224">2</span><span style="font:700 20px 'Barlow Condensed';letter-spacing:.06em;color:#fff;text-transform:uppercase">Absurdism</span><span style="margin-left:auto;font:500 11px 'JetBrains Mono';color:#ffb224">BOARD ›</span></div>`,
    sigText:'The lit amber row; go-next reads as numbered departures.',
    axis:'a table instead of a graph, highest density, dark',
    seed:true,
  },
};
