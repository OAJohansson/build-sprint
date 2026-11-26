#!/usr/bin/env python3
"""Skeleton round 4. Knot form fixed to A1 radial (L28). Six clickable prototypes, each a different way
to present the school's information around the open knot. Built on ../../round-4/field-existentialism.html
(the approved globe) and ../../../content/pilot/existentialism.json (real copy).
Run: python3 build.py && ./shoot.sh"""
import re, json, pathlib
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
BASE = (OUT.parent / 'round-4' / 'field-existentialism.html').read_text()
J = json.loads((OUT.parents[1] / 'content' / 'pilot' / 'existentialism.json').read_text())

# ---- data: straight from the pilot JSON --------------------------------------------------------
sur = lambda n: n.split()[-1]
works = next(s for s in J['sections'] if s['id'] == 'origins')['works']
years = sorted(int(w['year']) for w in works)
REAL = dict(
    name=J['name'], tagline=J['tagline']['text'], q=J['questions'][0]['text'],
    ideas=[dict(t=t['title'], s=t['summary'], who=[sur(n) for n in t['thinkers']]) for t in J['themes']],
    people=[sur(t['name']) for t in J['thinkers']],
    span=f'{years[0]}–{years[-1]}',
    places=['Denmark', 'Germany', 'France'],  # same reading of the overview as round 3
    works=len(works), mins=round(J['word_count'] / 200))
# break-ui: long question, one long idea title with 7 thinkers, a very short idea, an idea with nobody
WORST = dict(REAL, name='Post-structuralism', span='1857–1994',
    tagline='A loose family of French thinkers who doubted that language, knowledge or the self ever rest on a fixed foundation.',
    q='If every meaning depends on other meanings, can anything I say ever be settled once and for all?',
    places=['United Kingdom', 'Germany and Austria', 'Denmark', 'France and the United States'],
    people=['Merleau-Ponty', 'Wollstonecraft', 'Schopenhauer', 'Wittgenstein', 'Kierkegaard', 'Jo', 'Beauvoir', 'Camus', 'Sartre'],
    ideas=[
        dict(t='The individual against the crowd and its expectations', s='Going along with everyone feels comforting, but it lets us dodge our own choices, again and again.', who=['Kierkegaard', 'Sartre']),
        dict(t='Power', s='It is everywhere.', who=['Wollstonecraft']),
        dict(t='Deconstruction and the instability of meaning in every text', s='Texts undo their own claims, and every reading leaves something over that the next reading has to deal with, which is why no reading is ever the last one.', who=['Merleau-Ponty', 'Wittgenstein', 'Schopenhauer', 'Kierkegaard', 'Beauvoir', 'Wollstonecraft', 'Jo']),
        dict(t='Knowledge, discipline and the making of the self', s='What counts as true is shaped by who gets to speak.', who=['Schopenhauer']),
        dict(t='Difference', s='Not sameness.', who=[]),
        dict(t='The death of the author', s='A text belongs to its readers.', who=['Jo', 'Beauvoir']),
    ], works=14, mins=23)

# ---- pieces of the approved globe ---------------------------------------------------------------
base_css = re.search(r'<style>(.*?)</style>', BASE, re.S).group(1)
svg = re.search(r'<svg class="threads".*?</svg>', BASE, re.S).group(0)
main = re.search(r'<main>(.*?)</main>', BASE, re.S).group(1)
main = re.sub(r'<em>.*?</em>', '', main)  # relation words differ from the live app (r3 critic); the globe is not this round's subject
main = re.sub(r'<div class="title solid"(.*?)><i class="here"></i><h1>Existentialism</h1><p>.*?</p></div>',
              r'<button class="title solid" id="enter"\1><i class="here"></i><span class="h1">Existentialism</span><span class="p">__SPAN__ · step inside</span></button>', main)
placer = re.search(r'<script>\s*\(function\(\)\{.*?</script>', BASE, re.S).group(0)
placer = placer.replace(".then(()=>setTimeout(run,60))", ".then(()=>setTimeout(()=>{run();window.__ready&&window.__ready()},60))")
placer = '<script>window.WEB={"c":[500,456],"R":410,"w":1440,"h":900};</script>' + placer
assert '__ready' in placer and 'id="enter"' in main

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
         '<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..500;1,9..144,300..500&family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">')

SHARED_CSS = r"""
/* ---------- round 4 shared: the fixed A1 knot ---------- */
html,body{width:100%;height:100%;overflow:hidden;background:#0c1413}
.screen{position:absolute;left:0;top:0;transform-origin:0 0;opacity:0;--ease-out:cubic-bezier(.23,1,.32,1);--ease-move:cubic-bezier(.6,.04,.25,1)}
.screen.ready{opacity:1}
.nw{white-space:nowrap}
a{color:inherit;text-decoration:none}
/* display serif: sturdier cut (low optical size, regular weight) and opened tracking; r3's was thin and tight */
.d{font-family:Fraunces,serif;font-weight:400;font-optical-sizing:none;font-variation-settings:'opsz' 40;letter-spacing:-.008em;text-wrap:balance}
.d i,.d.it{font-style:italic;font-weight:380}
/* globe layer */
.globe{position:absolute;inset:0;transform-origin:500px 456px;transform:translate(220px,-6px);transition:transform 560ms var(--ease-move);will-change:transform}
.globe svg.threads{transition:opacity 400ms ease}
.globe svg.threads path,.globe .yarn ellipse,.globe .yarn circle{vector-effect:non-scaling-stroke}
.globe .nodes{transition:opacity 240ms ease,visibility 0s}
.title{cursor:pointer}
.title .h1{font:400 37px/1.04 Fraunces,serif;font-optical-sizing:none;font-variation-settings:'opsz' 40;letter-spacing:-.012em}
.title .p{font-size:13.5px;color:rgba(233,226,212,.84);margin-top:9px;white-space:nowrap}
.title .here{transition:box-shadow 200ms ease}
.title:active{transform:translate(-50%,-50%) scale(.98)}
.screen:not([data-state="1"]) .globe{transform:translate(var(--dx),var(--dy)) scale(1.9)}
.screen:not([data-state="1"]) .globe .nodes{opacity:0;visibility:hidden;transition:opacity 200ms ease,visibility 0s 200ms}
.screen:not([data-state="1"]) .globe svg.threads{opacity:.5}
.screen:not([data-state="1"]) .globe svg.threads path.focus{stroke-opacity:.3;stroke-width:1;stroke-dasharray:none}
/* the pool and veils: globe lines dim to nothing behind any text */
.pool,.veil{position:absolute;pointer-events:none;opacity:0;transition:opacity 400ms ease}
.pool{transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(15,24,23,.96) 0%,rgba(15,24,23,.94) 70%,rgba(15,24,23,0) 100%)}
.screen:not([data-state="1"]) .pool,.screen:not([data-state="1"]) .veil{opacity:1}
/* the knot */
.knotwrap{position:absolute;inset:0;opacity:0;visibility:hidden;transform:scale(.9);transition:opacity 200ms ease,transform 200ms ease,visibility 0s 200ms}
.screen:not([data-state="1"]) .knotwrap{opacity:1;visibility:visible;transform:none;transition:opacity 360ms ease,transform 420ms var(--ease-out),visibility 0s}
.screen.entering .knotwrap{transition-delay:180ms,180ms,0s}
svg.ov{position:absolute;inset:0;width:1440px;height:900px;pointer-events:none;overflow:visible}
svg.ov path{fill:none;stroke:var(--brass);stroke-linecap:round}
svg.ov .sp{stroke-width:1.25;stroke-opacity:.62;transition:stroke-opacity 200ms ease}
svg.ov .sp.first{stroke-opacity:1;stroke-width:1.7}
svg.ov .bead{fill:var(--bone);transition:opacity 200ms ease}
svg.ov .bead.first{fill:var(--brass)}
svg.ov .loop{stroke-width:1.2;stroke-opacity:.55}
.screen[data-state="3"] svg.ov .sp:not(.on){stroke-opacity:.2;stroke-width:1.25}
.screen[data-state="3"] svg.ov .bead:not(.on){opacity:.4}
.screen[data-state="3"] svg.ov .sp.on{stroke-opacity:1;stroke-width:2}
.screen[data-state="3"] svg.ov .bead.on{fill:var(--brass)}
.knot{position:absolute;width:16px;height:16px;border-radius:50%;background:var(--brass);transform:translate(-50%,-50%);box-shadow:0 0 0 8px rgba(211,166,108,.16),0 0 50px 16px rgba(211,166,108,.1)}
.idea{position:absolute;width:max-content;max-width:256px;transition:opacity 200ms ease}
.idea.l{transform:translate(0,-50%)}
.idea.r{transform:translate(-100%,-50%);text-align:right}
.idea.t{transform:translate(-50%,-100%);text-align:center}
.idea.b{transform:translate(-50%,0);text-align:center}
.idea>button{display:block;padding:8px 10px;border-radius:10px;text-align:inherit;transition:transform 160ms var(--ease-out)}
.idea .tt{font:400 23px/1.2 Fraunces,serif;font-optical-sizing:none;font-variation-settings:'opsz' 36;letter-spacing:0;color:rgba(233,226,212,.9);text-wrap:balance;overflow-wrap:break-word}
.idea .no{font:500 13px/1 'Hanken Grotesk',sans-serif;color:var(--brass);margin-right:9px;vertical-align:.22em}
.idea small{display:block;font:400 13.5px/1.35 'Hanken Grotesk',sans-serif;color:var(--quiet);margin-top:5px;text-wrap:balance}
.idea.first .tt{color:var(--bone)}
.idea.first .no{font-weight:600}
.screen[data-state="3"] .idea:not(.on){opacity:.45}
.screen[data-state="3"] .idea.on .tt{color:var(--bone)}
.idea .note{display:none}
/* information blocks */
.info{position:absolute;opacity:0;visibility:hidden;transition:opacity 200ms ease,visibility 0s 200ms}
.screen:not([data-state="1"]) .info{opacity:1;visibility:visible;transition:opacity 280ms ease,visibility 0s}
.screen.entering .info{transition-delay:300ms,0s}
.school,.picked{transition:opacity 220ms ease,visibility 0s 220ms}
.screen[data-state="2"] .picked,.screen[data-state="3"] .school{opacity:0;visibility:hidden;pointer-events:none}
.screen[data-state="3"] .picked,.screen[data-state="2"] .school{opacity:1;visibility:visible;transition:opacity 260ms ease 80ms,visibility 0s}
.picked.swap{animation:swap 240ms ease}
@keyframes swap{from{opacity:.25}to{opacity:1}}
.quiet{color:var(--quiet);font-size:14px;line-height:1.45}
.kick{font:500 13.5px/1.3 'Hanken Grotesk',sans-serif;color:var(--brass)}
.lnk{display:inline-block;font:500 15px/1.2 'Hanken Grotesk',sans-serif;color:var(--brass);padding:11px 0;border-radius:8px;transition:transform 160ms var(--ease-out)}
.lnk u{text-decoration:none;border-bottom:1px solid rgba(211,166,108,.45);padding-bottom:2px;transition:border-color 160ms ease}
.lnk.back{color:var(--quiet);font-weight:400}
.lnk.back u{border-color:var(--faint)}
.lnk:active{transform:scale(.97)}
.cta{display:inline-flex;align-items:center;background:var(--brass);color:#1a1408;font:600 15.5px/1 'Hanken Grotesk',sans-serif;padding:16px 24px;border-radius:13px;transition:transform 160ms var(--ease-out),background-color 160ms ease}
.cta:active{transform:scale(.97)}
a:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--brass);outline-offset:4px}
[tabindex="-1"]:focus{outline:none}
.say{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);font-size:13.5px;color:var(--bone);background:rgba(12,20,19,.92);border:1px solid var(--faint);padding:9px 14px;border-radius:10px;opacity:0;transition:opacity 200ms ease;pointer-events:none;white-space:nowrap}
.say.show{opacity:1}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
@media (hover:hover){
  .title:hover .here{box-shadow:0 0 0 11px rgba(211,166,108,.22)}
  .title:hover .h1,.idea>button:hover .tt{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:6px;text-decoration-color:rgba(233,226,212,.5)}
  .lnk:hover u{border-color:var(--brass)}.lnk.back:hover{color:var(--bone)}
  .cta:hover{background:#dfb57e}
}
@media (prefers-reduced-motion:reduce){.knotwrap,.screen:not([data-state="1"]) .knotwrap{transform:none}.picked.swap,.idea.on .note.swap{animation:none}}
"""

JS = r"""
(function(){
const ALL=__DATA__,CFG=__CFG__;
const qs=new URLSearchParams(location.search);
const D=ALL[qs.get('data')]||ALL.real;
const S=document.querySelector('.screen'),KW=S.querySelector('.knotwrap'),OV=S.querySelector('svg.ov');
const [cx,cy]=CFG.c,R=CFG.R,r0=CFG.r0||0,n=D.ideas.length;
const NUM=['no','one','two','three','four','five','six','seven','eight','nine','ten'];
const word=k=>k<NUM.length?NUM[k]:String(k);
const cap=s=>s[0].toUpperCase()+s.slice(1);
const pl=(k,w)=>word(k)+' '+w+(k===1?'':'s');
const names=xs=>xs.length<2?xs.join(''):xs.slice(0,-1).join(', ')+' and '+xs[xs.length-1];
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const F={name:D.name,q:D.q,tagline:D.tagline,span:D.span,places:D.places.join(', '),
  when:D.span+' · '+D.places.join(', '),read:'Read it · about '+D.mins+' minute'+(D.mins===1?'':'s'),
  people:names(D.people),withpeople:'With '+names(D.people),
  size:cap(pl(n,'idea'))+', '+pl(D.people.length,'thinker')+', '+pl(D.works,'key work'),back:'Back to '+D.name};
S.style.setProperty('--dx',(cx-500)+'px');S.style.setProperty('--dy',(cy-456)+'px');
S.style.setProperty('--cx',cx+'px');S.style.setProperty('--cy',cy+'px');
KW.style.transformOrigin=cx+'px '+cy+'px';
const pool=S.querySelector('.pool');pool.style.cssText+=';left:'+cx+'px;top:'+cy+'px;width:'+2*(R+(CFG.poolX||330))+'px;height:'+2*(R+(CFG.poolY||250))+'px';
const NS='http://www.w3.org/2000/svg',mk=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);OV.appendChild(e);return e};
if(r0)mk('circle',{class:'loop',cx,cy,r:r0,fill:'none',stroke:'#d3a66c'});
if(CFG.strand)mk('path',{class:'sp strand',d:CFG.strand});
const ideas=D.ideas.map((t,i)=>{
  const a=(-90+i*360/n)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
  const x0=cx+r0*c,y0=cy+r0*s,x1=cx+R*c,y1=cy+R*s,k=(i%2?1:-1)*.1*(R-r0);
  const p=mk('path',{class:'sp'+(i?'':' first'),d:`M${x0.toFixed(1)} ${y0.toFixed(1)}Q${((x0+x1)/2-s*k).toFixed(1)} ${((y0+y1)/2+c*k).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`});
  const b=mk('circle',{class:'bead'+(i?'':' first'),cx:x1.toFixed(1),cy:y1.toFixed(1),r:i?3.5:4.5});
  const side=c>.3?'l':c<-.3?'r':s<0?'t':'b',g=side==='t'||side==='b'?10:8;
  const el=document.createElement('div');el.className='idea '+side+(i?'':' first');
  el.style.left=(cx+(R+g)*c).toFixed(1)+'px';el.style.top=(cy+(R+g)*s).toFixed(1)+'px';
  el.innerHTML='<button aria-pressed="false"><span class="tt"><span class="no">'+(i+1)+'</span>'+esc(t.t)+'</span>'+(t.who.length?'<small>'+esc(t.who.join(', '))+'</small>':'')+'</button>'+
    (CFG.inplace?'<div class="note"><p class="d it">'+esc(t.s)+'</p><p class="m"><span class="kick">Idea '+(i+1)+' of '+n+'</span><a class="lnk" href="#read" data-read><u>Read this part</u></a><button class="lnk back" data-back><u>Back</u></button></p></div>':'');
  KW.appendChild(el);
  const btn=el.querySelector('button');btn.addEventListener('click',()=>set(state===3&&pick===i?2:3,i));
  return {el,btn,p,b};
});
S.querySelectorAll('[data-f]').forEach(e=>{if(F[e.dataset.f]!=null)e.textContent=F[e.dataset.f]});
S.querySelectorAll('[data-long]').forEach(e=>{if(e.textContent.length>+e.dataset.long)e.classList.add('long')});
const P=S.querySelector('.picked'),say=S.querySelector('.say'),live=S.querySelector('.sr');
let state=1,pick=null,sayT=0,entT=0;
function fill(i){const t=D.ideas[i],m={n:'Idea '+(i+1)+' of '+n,no:String(i+1),of:'of '+n,title:t.t,summary:t.s,who:names(t.who),withwho:t.who.length?'With '+names(t.who):''};
  if(!P)return;P.querySelectorAll('[data-p]').forEach(e=>{const v=m[e.dataset.p];e.textContent=v;e.hidden=!v;if(e.dataset.plong)e.classList.toggle('long',v.length>+e.dataset.plong)})}
function set(s,i,instant){
  const from=state,was=pick;state=s;pick=s===3?i:null;
  if(instant){S.style.transition='none';S.classList.add('still')}
  clearTimeout(entT);S.classList.toggle('entering',from===1&&s===2&&!instant);if(from===1&&s===2)entT=setTimeout(()=>S.classList.remove('entering'),700);
  if(s===3){fill(i);const nt=ideas[i].el.querySelector('.note');if(nt)nt.classList.toggle('swap',!instant);if(P&&from===3&&was!==i){P.classList.remove('swap');void P.offsetWidth;P.classList.add('swap')}}
  S.dataset.state=s;S.dataset.pick=pick==null?'':pick+1;
  ideas.forEach((o,j)=>{const on=pick===j;o.el.classList.toggle('on',on);o.p.classList.toggle('on',on);o.b.classList.toggle('on',on);o.btn.setAttribute('aria-pressed',on)});
  live.textContent=s===1?'The whole field':s===2?D.name+', '+n+' ideas':'Idea '+(i+1)+' of '+n+': '+D.ideas[i].t+'. '+D.ideas[i].s;
  try{history.replaceState(null,'',location.pathname+'?state='+s+(s===3?'&idea='+(i+1):'')+(qs.get('data')?'&data='+qs.get('data'):''))}catch(e){}
  if(!instant){if(from===1&&s===2)ideas[0].btn.focus({preventScroll:true});if(s===1)S.querySelector('#enter').focus({preventScroll:true});if(from===3&&s===2&&was!=null&&!S.contains(document.activeElement.closest&&document.activeElement.closest('.idea')))ideas[was].btn.focus({preventScroll:true})}
  if(instant)requestAnimationFrame(()=>requestAnimationFrame(()=>{S.classList.remove('still');S.style.transition=''}));
}
S.querySelector('#enter').addEventListener('click',()=>set(2));
S.querySelector('.wm').addEventListener('click',()=>set(1));
S.addEventListener('click',e=>{
  if(e.target.closest('[data-back]')){set(2);return}
  const r=e.target.closest('[data-read]');if(r){e.preventDefault();say.textContent='The article opens here. It is not part of this prototype.';say.classList.add('show');clearTimeout(sayT);sayT=setTimeout(()=>say.classList.remove('show'),2400)}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(state===3)set(2);else if(state===2)set(1)}});
function fit(){const k=Math.min(innerWidth/1440,innerHeight/900);S.style.transform='translate('+((innerWidth-1440*k)/2).toFixed(1)+'px,'+((innerHeight-900*k)/2).toFixed(1)+'px) scale('+k.toFixed(4)+')'}
window.__ready=function(){
  const s=Math.min(3,Math.max(1,+qs.get('state')||1)),i=Math.min(n,Math.max(1,+qs.get('idea')||Math.min(3,n)))-1;
  set(s,i,true);fit();addEventListener('resize',fit);S.classList.add('ready');
};
})();
"""

STILL = ".screen.still *{transition:none!important;animation:none!important}"

def page(slug, title, cfg, css, veil, info):
    html = f"""<!doctype html>
<html lang="en" style="color-scheme:dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#101918">
<title>Meander · skeleton r4 · {title}</title>
{FONTS}
<style>{base_css}{SHARED_CSS}{STILL}
/* ---------- {title} ---------- */
{css}
</style></head><body>
<div class="screen" data-state="1" data-dir="{slug}">
<div class="globe">{svg}<div class="nodes">{main.replace('__SPAN__', REAL['span'])}</div></div>
<div class="pool"></div>{veil}
<div class="knotwrap"><svg class="ov" aria-hidden="true"></svg>{'' if cfg.get('r0') else '<i class="knot" style="left:%dpx;top:%dpx"></i>' % tuple(cfg['c'])}</div>
<header class="solid"><button class="wm" translate="no" title="Back to the whole field"><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="#e9e2d4" stroke-width="1.1"><circle cx="12" cy="12" r="10.5"/><ellipse cx="12" cy="12" rx="10.5" ry="4.2" transform="rotate(-28 12 12)"/><ellipse cx="12" cy="12" rx="10.5" ry="7.4" transform="rotate(48 12 12)" stroke="#d3a66c"/></g></svg>Meander</button><button class="yt" aria-expanded="false"><i></i>Your thread</button></header>
{info}
<p class="say" aria-hidden="true"></p><p class="sr" aria-live="polite"></p>
</div>
<script>{JS.replace('__DATA__', json.dumps(dict(real=REAL, worst=WORST), ensure_ascii=False)).replace('__CFG__', json.dumps(cfg))}</script>
{placer}
</body></html>"""
    (OUT / f'{slug}.html').write_text(html)
    print('built', slug)

READ = '<a class="lnk" href="#read" data-read><u data-f="read"></u></a>'
READ_CTA = '<a class="cta" href="#read" data-read data-f="read"></a>'
PART = '<a class="lnk" href="#read" data-read><u>Read this part</u></a>'
BACK = '<button class="lnk back" data-back><u data-f="back"></u></button>'

# ============ P1  everything in the knot: the knot opens into a loop, and you read inside it ============
page('P1-open-loop', 'P1 open loop', dict(c=[720, 455], R=272, r0=174, poolX=380, poolY=230), r"""
.info{left:var(--cx);top:var(--cy);width:262px;height:0;margin-left:-131px}
.school,.picked{position:absolute;left:0;width:100%;top:0;transform:translateY(-50%);text-align:center;display:flex;flex-direction:column;align-items:center}
.school h1{font-size:25px;line-height:1.1}
.school .q{font-size:21px;line-height:1.24;margin-top:12px;color:var(--bone)}
.school .q.long{font-size:17.5px}
.school .quiet{margin-top:12px;font-size:13.5px;text-wrap:balance}
.school .lnk{margin-top:3px}
.picked .kick{margin-bottom:9px}
.picked .sum{font-size:20px;line-height:1.26}
.picked .sum.long{font-size:16.5px}
.picked .row{display:flex;gap:20px;margin-top:6px}
""", '', f"""<section class="info" aria-label="Existentialism">
<div class="school"><h1 class="d" data-f="name" tabindex="-1"></h1><p class="q d it" data-f="q" data-long="60"></p><p class="quiet" data-f="when"></p>{READ}</div>
<div class="picked"><p class="kick" data-p="n"></p><p class="sum d" data-p="summary" data-plong="100"></p><p class="row">{PART}<button class="lnk back" data-back><u>Back</u></button></p></div>
</section>""")

# ============ P2  along the thread: one strand leaves the knot and the words sit on it ============
page('P2-along-the-thread', 'P2 along the thread', dict(c=[412, 455], R=178, strand='M412 455L1440 455', poolX=330, poolY=350), r"""
.veil{left:740px;top:0;width:700px;height:900px;background:linear-gradient(90deg,rgba(15,24,23,0) 0%,rgba(15,24,23,.95) 30%,rgba(15,24,23,.95) 100%)}
svg.ov .strand{stroke-opacity:.5;stroke-width:1.25}
.screen[data-state="3"] svg.ov .strand{stroke-opacity:1!important;stroke-width:1.25!important}
.info{left:872px;top:0;width:512px;height:900px}
.school,.picked{position:absolute;inset:0}
.on-top{position:absolute;left:0;right:0;bottom:463px}
.under{position:absolute;left:0;right:0;top:468px;display:flex;justify-content:space-between;align-items:baseline;gap:24px}
.on-top .kick{color:var(--quiet);font-weight:400;font-size:15px;margin-bottom:10px}
.on-top .kick b{color:var(--bone);font-weight:500}
.picked .on-top .kick{color:var(--brass);font-weight:500;font-size:13.5px}
.big{font-size:35px;line-height:1.14;color:var(--bone)}
.big.long{font-size:27px;line-height:1.2}
.under .quiet{min-width:0;padding-top:11px}
.under .lnk{flex-shrink:0;white-space:nowrap}
.under .links{display:flex;gap:22px;flex-shrink:0}
.tick{position:absolute;left:-1px;top:451px;width:9px;height:9px;border-radius:50%;background:var(--bone)}
""", '<div class="veil"></div>', f"""<section class="info" aria-label="Existentialism"><i class="tick"></i>
<div class="school"><div class="on-top"><h1 class="kick" tabindex="-1"><b data-f="name"></b> asks</h1><p class="big d" data-f="q" data-long="70"></p></div>
<div class="under"><p class="quiet" data-f="when"></p>{READ}</div></div>
<div class="picked"><div class="on-top"><p class="kick" data-p="n"></p><p class="big d" data-p="summary" data-plong="70"></p></div>
<div class="under"><p class="quiet" data-p="who"></p><p class="links">{PART}{BACK}</p></div></div>
</section>""")

# ============ P3  editorial column: a magazine opener set beside the knot ============
page('P3-editorial-column', 'P3 editorial column', dict(c=[440, 462], R=185, poolX=330, poolY=350), r"""
.veil{left:760px;top:0;width:680px;height:900px;background:linear-gradient(90deg,rgba(15,24,23,0) 0%,rgba(15,24,23,.95) 32%,rgba(15,24,23,.95) 100%)}
.info{left:936px;top:0;width:432px;height:900px}
.school,.picked{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%)}
.info .kick{color:var(--quiet);font-weight:400;font-size:14px}
.picked .kick{color:var(--brass);font-weight:500}
.info h1{font-size:60px;line-height:1.02;letter-spacing:-.014em;margin:12px 0 0 -3px;overflow-wrap:break-word}
.info h2{font-size:38px;line-height:1.08;letter-spacing:-.01em;margin-top:12px}
.stand{font-size:17px;line-height:1.5;color:rgba(233,226,212,.86);margin-top:18px;max-width:400px}
.info hr{border:0;border-top:1px solid var(--faint);margin:28px 0 24px;width:56px}
.ask{font-size:29px;line-height:1.18;color:var(--bone)}
.ask.long{font-size:23px}
.with{margin-top:18px}
.info .cta{margin-top:30px}
.picked .sum{font-size:27px;line-height:1.22;margin-top:22px;color:var(--bone)}
.picked .sum.long{font-size:21px}
.picked .row{display:flex;gap:24px;margin-top:20px}
""", '<div class="veil"></div>', f"""<section class="info" aria-label="Existentialism">
<div class="school"><p class="kick" data-f="when"></p><h1 class="d" data-f="name" tabindex="-1"></h1><p class="stand" data-f="tagline"></p><hr><p class="ask d it" data-f="q" data-long="70"></p><p class="quiet with" data-f="withpeople"></p>{READ_CTA}</div>
<div class="picked"><p class="kick" data-p="n"></p><h2 class="d" data-p="title"></h2><p class="sum d it" data-p="summary" data-plong="110"></p><p class="quiet with" data-p="withwho"></p><p class="row">{PART}{BACK}</p></div>
</section>""")

# ============ P4  caption strip: the knot is the picture, the words are its caption ============
page('P4-caption-strip', 'P4 caption strip', dict(c=[720, 366], R=166, poolX=460, poolY=200), r"""
.veil{left:0;top:570px;width:1440px;height:330px;background:linear-gradient(180deg,rgba(13,21,20,0) 0%,rgba(13,21,20,.96) 38%,rgba(13,21,20,.96) 100%)}
.info{left:56px;top:722px;width:1328px;height:150px;border-top:1px solid var(--faint)}
.school,.picked{position:absolute;inset:26px 0 0 0;display:grid;grid-template-columns:290px minmax(0,1fr) max-content;column-gap:64px;align-items:start}
.info h1{font-size:34px;line-height:1.08;overflow-wrap:break-word}
.info h2{font-size:25px;line-height:1.14;margin-top:7px}
.c1 .quiet{margin-top:9px}
.mid{font-size:31px;line-height:1.17;color:var(--bone);max-width:640px}
.mid.long{font-size:23px;line-height:1.24}
.c3{display:flex;flex-direction:column;align-items:flex-end;gap:2px}
.c3 .cta{margin-top:2px}
.picked .c3{margin-top:-6px}
""", '<div class="veil"></div>', f"""<section class="info" aria-label="Existentialism">
<div class="school"><div class="c1"><h1 class="d" data-f="name" tabindex="-1"></h1><p class="quiet" data-f="when"></p></div><p class="mid d it" data-f="q" data-long="80"></p><div class="c3">{READ_CTA}</div></div>
<div class="picked"><div class="c1"><p class="kick" data-p="n"></p><h2 class="d" data-p="title"></h2></div><p class="mid d" data-p="summary" data-plong="100"></p><div class="c3">{PART}{BACK}</div></div>
</section>""")

# ============ P5  margin note: a small note in the margin; a picked idea is annotated where it sits ============
page('P5-margin-note', 'P5 margin note', dict(c=[836, 452], R=198, inplace=True, poolX=400, poolY=350), r"""
.veil{left:0;top:0;width:520px;height:900px;background:linear-gradient(270deg,rgba(15,24,23,0) 0%,rgba(15,24,23,.93) 36%,rgba(15,24,23,.93) 100%)}
.info{left:60px;top:var(--cy);width:266px;height:0}
.school{position:absolute;left:0;right:0;top:0;transform:translateY(-50%);padding-left:18px;border-left:1px solid rgba(211,166,108,.5)}
.screen[data-state="3"] .school{opacity:1;visibility:visible;pointer-events:auto}
.school h1{font-size:23px;line-height:1.1}
.school .q{font-size:18.5px;line-height:1.3;margin-top:9px;color:var(--bone)}
.school .quiet{margin-top:12px;font-size:13.5px}
.school .lnk{margin-top:2px}
/* the note opens under the picked idea; side labels hang from their first line so the title never moves */
.idea.l{transform:translate(0,-24px)}.idea.r{transform:translate(-100%,-24px)}
.idea.on .note{display:block;padding:0 10px 4px}.idea.on .note.swap{animation:swap 240ms ease}
.note p.d{font-size:16.5px;line-height:1.36;color:var(--bone);margin-top:1px;text-wrap:pretty}
.note .m{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 16px;margin-top:2px}
.idea.r .note .m{justify-content:flex-end}.idea.t .note .m,.idea.b .note .m{justify-content:center}
.note .lnk{font-size:14px;padding:9px 0}
""", '<div class="veil"></div>', f"""<section class="info" aria-label="Existentialism">
<div class="school"><h1 class="d" data-f="name" tabindex="-1"></h1><p class="q d it" data-f="q"></p><p class="quiet" data-f="when"></p>{READ}</div>
</section>""")

# ============ P6  first page: a title page on the left, the knot as its frontispiece ============
page('P6-first-page', 'P6 first page', dict(c=[990, 458], R=182, poolX=330, poolY=350), r"""
.veil{left:0;top:0;width:780px;height:900px;background:linear-gradient(270deg,rgba(15,24,23,0) 0%,rgba(15,24,23,.95) 32%,rgba(15,24,23,.95) 100%)}
.info{left:96px;top:0;width:452px;height:900px;text-align:center}
.school,.picked{position:absolute;inset:0}
.mid{position:absolute;left:0;right:0;top:438px;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center}
.foot{position:absolute;left:0;right:0;bottom:64px;display:flex;flex-direction:column;align-items:center}
.info h1{font-size:58px;line-height:1.03;letter-spacing:-.014em;max-width:100%;overflow-wrap:break-word}
.rule{width:44px;border-top:1px solid var(--brass);opacity:.7;margin:26px 0 24px}
.ask{font-size:25px;line-height:1.24;color:var(--bone);max-width:400px}
.ask.long{font-size:20px}
.size{margin-top:22px}
.mid .lnk{margin-top:8px}
.foot .quiet{font-size:13.5px}
.info h2{font-size:36px;line-height:1.1;margin-top:14px}
.picked .rule{margin:22px 0 20px}
.picked .sum{font-size:22px;line-height:1.28;color:var(--bone);max-width:410px}
.picked .sum.long{font-size:18px}
.picked .with{margin-top:16px}
.picked .mid .lnk{margin-top:6px}
""", '<div class="veil"></div>', f"""<section class="info" aria-label="Existentialism">
<div class="school"><div class="mid"><h1 class="d" data-f="name" tabindex="-1"></h1><i class="rule"></i><p class="ask d it" data-f="q" data-long="70"></p><p class="quiet size" data-f="size"></p>{READ}</div>
<div class="foot"><p class="quiet"><span data-f="places"></span><br><span data-f="span"></span></p></div></div>
<div class="picked"><div class="mid"><p class="kick of" data-p="n"></p><h2 class="d" data-p="title"></h2><i class="rule"></i><p class="sum d it" data-p="summary" data-plong="110"></p><p class="quiet with" data-p="who"></p>{PART}</div>
<div class="foot">{BACK}</div></div>
</section>""")
