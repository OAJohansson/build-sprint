// 05 Wall text. Axis: type as the map, lowest density; links appear only around the school you are on.
export default {
  name:'Wall text',
  fonts:['Instrument+Serif:ital@0;1','Schibsted+Grotesk:wght@400;500;700'],
  css:`
.screen{background:#f4f2ed;color:#1a1a18;font:400 13.5px/1.5 'Schibsted Grotesk',sans-serif;--wall:#f4f2ed;--ink:#1a1a18;--dim:#bdb9ae;--red:#d8432a;--rule:#d9d5cb}
.top{position:absolute;left:56px;top:34px;right:520px;display:flex;justify-content:space-between;align-items:baseline}
.wm{font:400 26px/1 'Instrument Serif'}
.top p{font-size:12px;color:#77736a}
.run{position:absolute;left:56px;top:96px;width:890px;font:400 58px/1.56 'Instrument Serif';letter-spacing:-.015em;color:var(--dim)}
.run span{position:relative;white-space:nowrap}
.run .era{font:500 10.5px/1 'Schibsted Grotesk';letter-spacing:.12em;text-transform:uppercase;color:#77736a;vertical-align:top;position:relative;top:14px;margin-right:6px;letter-spacing:.1em}
.run .v{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:9px;text-decoration-color:var(--ink)}
.run .v:after,.run .rel:before{position:absolute;left:0;font:500 10.5px/1 'Schibsted Grotesk';letter-spacing:.02em;white-space:nowrap}
.run .v:after{content:attr(data-v);bottom:-12px;color:#77736a;background:var(--wall);padding-right:5px}
.run .rel{color:var(--ink)}
.run .rel:before{content:attr(data-rel);top:-2px;color:var(--ink);text-transform:uppercase;letter-spacing:.1em}
.run .rel.ag:before{color:var(--red)}
.run .here{color:var(--red);font-style:italic}
.run .here.v{text-decoration-color:var(--red)}
.run .here:after{color:var(--red);left:auto;right:0;padding:0 0 0 5px}
.label{position:absolute;left:988px;top:34px;width:400px;height:832px;background:#fff;border:1px solid var(--rule);padding:26px 30px 0}
.label .back{font-size:11.5px;color:#77736a;display:flex;justify-content:space-between;margin-bottom:16px}
.label h2{font:italic 400 38px/1 'Instrument Serif';color:var(--red);letter-spacing:-.01em}
.label .meta{font-weight:700;font-size:12.5px;margin:8px 0 2px}
.label .lede{font-size:13.5px;margin-bottom:6px}
.label h3{font:500 10.5px/1 'Schibsted Grotesk';letter-spacing:.1em;text-transform:uppercase;color:#77736a;margin:13px 0 5px}
.d-q li{font:400 19px/1.2 'Instrument Serif';margin-bottom:3px}
.d-themes li{display:inline}.d-themes li:not(:last-child):after{content:" · "}
.d-thinkers .t-row{display:flex;gap:8px;align-items:baseline;padding:1px 0}
.d-thinkers b{font-weight:500}.d-thinkers i{font-style:normal;color:#77736a;font-size:12px}.d-thinkers span{display:none}
.d-against a{font-weight:700}
.d-next ul{border-top:1px solid var(--ink)}
.d-next li{display:grid;grid-template-columns:1fr auto;gap:0 8px;padding:6px 0;border-bottom:1px solid var(--rule);align-items:baseline}
.d-next b{font:400 23px/1 'Instrument Serif'}
.d-next em{font:500 10.5px/1 'Schibsted Grotesk';font-style:normal;letter-spacing:.1em;text-transform:uppercase;grid-column:2;grid-row:1}
.d-next li.against em{color:var(--red)}
.d-next span{grid-column:1/3;font-size:12.5px;color:#55524a}
`,
  html({schools,eras,detail,exi}){
    const rel={phe:['built on',''],abs:['grew from it',''],pos:['pushed back','ag'],ide:['pushed against','ag']};
    let last='';
    const run=schools.map((s,i)=>{let pre='';if(s.era!==last){last=s.era;pre=`<i class="era">${eras.find(e=>e.id===s.era).name.replace(' to now','')}</i>`}
      const c=[s.visited?'v':'',rel[s.id]?'rel '+rel[s.id][1]:'',s.id==='exi'?'here':''].join(' ');
      return `<span style="white-space:nowrap">${pre}<span class="${c}" ${s.visited?`data-v="${s.id==='exi'?'you are here, 12 Nov':'seen '+s.visited}"`:''} ${rel[s.id]?`data-rel="${rel[s.id][0]}"`:''}>${s.name}</span>${i<schools.length-1?',':'.'}</span>`}).join(' ');
    return `<div class="top"><div class="wm">Meander</div><p>Western philosophy in sixteen names · seen 4, over 3 days</p></div>
<div class="run">${run}</div>
<div class="label"><div class="back"><span>← All sixteen</span><span>Esc</span></div><h2>Existentialism</h2><div class="meta">1840s–1960s. Seen today, 12 November.</div>${detail({q:'Key questions',themes:'Themes',thinkers:'Thinkers',against:'Reacted against',next:'See also',rel:{built:'built on',grew:'grew from it',against:'pushed back'},study:''},{})}</div>`;
  },
  brand:{
    wordmark:`<span style="font:400 44px/1 'Instrument Serif';color:#1a1a18">Meander<i style="color:#d8432a">.</i></span>`,
    personality:'A gallery wall text. Still, spacious, sure of itself.',
    palette:[['wall','#f4f2ed'],['ink','#1a1a18'],['dim','#bdb9ae'],['here','#d8432a'],['label','#ffffff'],['rule','#d9d5cb']],
    type:[{name:'Instrument Serif · names',css:"font-family:'Instrument Serif'",sample:'See also'},{name:'Schibsted Grotesk 400/500 · label text',css:"font-family:'Schibsted Grotesk'",sample:'Seen today, 12 November.'}],
    voice:{empty:'Sixteen names, in order. Start with any of them.',next:'See also',been:'Seen 4, over 3 days'},
    sig:`<span style="font:400 21px/1.1 'Instrument Serif';color:#bdb9ae;white-space:nowrap"><span style="color:#1a1a18">Phenomenology</span>, <i style="color:#d8432a">Existentialism</i></span>`,
    sigText:'One sentence of names; those connected to where you are turn black.',
    axis:'type as the map, no graph, lowest density',
  },
};
