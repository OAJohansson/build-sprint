#!/usr/bin/env python3
"""P7: the owner's pick (P6 first page), mirrored, with the critic's fixes. Reuses build.py's shared pieces
without rebuilding P1-P6. Run: python3 build_p7.py && ./shoot.sh P7"""
import pathlib
HERE = pathlib.Path(__file__).resolve().parent
src = (HERE / 'build.py').read_text()
ns = {'__file__': str(HERE / 'build.py')}
exec(compile(src[:src.index('# ============ P1')], 'build.py', 'exec'), ns)

def rep(key, a, b):
    assert a in ns[key], a
    ns[key] = ns[key].replace(a, b)

# threads: slightly uneven lengths, curves and angles, so the knot reads as thread, not a diagram
rep('JS', "const a=(-90+i*360/n)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);",
    "const V=CFG.vary||{},pick_=(k,d)=>V[k]&&V[k][i%V[k].length]!=null?V[k][i%V[k].length]:d;const a=(-90+i*360/n+pick_('a',0))*Math.PI/180,c=Math.cos(a),s=Math.sin(a),Ri=R*pick_('l',1);")
rep('JS', "x1=cx+R*c,y1=cy+R*s,k=(i%2?1:-1)*.1*(R-r0);", "x1=cx+Ri*c,y1=cy+Ri*s,k=pick_('k',(i%2?1:-1)*.1)*(Ri-r0);")
rep('JS', "el.style.left=(cx+(R+g)*c).toFixed(1)+'px';el.style.top=(cy+(R+g)*s).toFixed(1)+'px';",
    "el.style.left=(cx+(Ri+g)*c).toFixed(1)+'px';el.style.top=(cy+(Ri+g)*s).toFixed(1)+'px';")
# nothing looks picked at the start: no 'first' styling, equal beads
rep('JS', "r:i?3.5:4.5", "r:3.5")
rep('JS', "'sp'+(i?'':' first')", "'sp'")
rep('JS', "'bead'+(i?'':' first')", "'bead'")
rep('JS', "el.className='idea '+side+(i?'':' first');", "el.className='idea '+side;")
# numeral in its own column so title and people share one left edge
rep('JS', """'<button aria-pressed="false"><span class="tt"><span class="no">'+(i+1)+'</span>'+esc(t.t)+'</span>'""",
    """'<button aria-pressed="false"><span class="no">'+(i+1)+'</span><span class="tt">'+esc(t.t)+'</span>'""")

# shrink-wrap each label to its wrapped text, so the gap between label and bead is the same everywhere
rep('JS', "set(s,i,true);fit();", "if(CFG.shrink){const k=KW.getBoundingClientRect().width/1440||1;ideas.forEach(o=>{const b=o.btn,w=Math.max(...[...b.querySelectorAll('.tt,small')].map(e=>{const r=document.createRange();r.selectNodeContents(e);return r.getBoundingClientRect().width/k}));const no=b.querySelector('.no').getBoundingClientRect().width/k;o.el.style.width=Math.ceil(no+9+w+26)+'px'})}set(s,i,true);fit();")
READ, PART, BACK = ns['READ'], ns['PART'], ns['BACK']
ns['page']('P7-first-page-mirrored', 'P7 first page, mirrored',
    dict(c=[486, 458], R=178, poolX=330, poolY=350, shrink=True,
         vary=dict(a=[0, -5, 4, 0, -4, 5], l=[1.0, .88, 1.1, .9, 1.08, .86], k=[.16, -.07, .2, -.13, .06, -.18])), r"""
.veil{left:640px;top:0;width:800px;height:900px;background:linear-gradient(90deg,rgba(15,24,23,0) 0%,rgba(15,24,23,.95) 32%,rgba(15,24,23,.95) 100%)}
/* knot: plain dot, no halo; all threads equal until one is picked */
.knot{width:11px;height:11px;box-shadow:none}
svg.ov .sp{stroke-opacity:.72;stroke-width:1.3}
.screen[data-state="3"] svg.ov .sp:not(.on){stroke-opacity:.38}
.screen[data-state="3"] svg.ov .bead:not(.on){opacity:.65}
/* labels: one alignment everywhere (left), numeral hangs in its own column */
.idea{max-width:238px}
.idea.r,.idea.t,.idea.b{text-align:left}
.idea>button{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:9px;align-items:baseline}
.idea .no{font-size:14.5px;margin:0;vertical-align:baseline}
.idea .tt{color:var(--bone)}
.idea small{grid-column:2;font-size:14.5px;line-height:1.35;color:rgba(233,226,212,.76);text-wrap:pretty}
.screen[data-state="3"] .idea:not(.on){opacity:.74}
.screen[data-state="3"] .idea.on .no{font-weight:600}
/* the first page, now on the right */
.info{left:908px;top:0;width:456px;height:900px;text-align:center}
.school,.picked{position:absolute;inset:0}
.mid{position:absolute;left:0;right:0;top:452px;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center}
.info h1{font-size:58px;line-height:1.03;letter-spacing:-.014em;max-width:100%;overflow-wrap:break-word}
.rule{width:44px;border-top:1px solid var(--brass);opacity:.7;margin:26px 0 24px}
.ask{font-size:26px;line-height:1.24;color:var(--bone);max-width:410px}
.ask.long{font-size:21px}
.facts{margin-top:24px;font-size:14.5px;line-height:1.6;text-wrap:balance}
.mid .lnk{margin-top:10px}
.picked .kick{font-size:14.5px}
.picked h2{font-size:40px;line-height:1.08;letter-spacing:-.012em;margin-top:14px;max-width:440px;overflow-wrap:break-word}
.picked .rule{margin:22px 0 20px}
.picked .sum{font-size:22px;line-height:1.3;color:var(--bone);max-width:410px}
.picked .sum.long{font-size:19px}
.picked .with{margin-top:20px;font-size:14.5px;text-wrap:balance}
.picked .row{display:flex;flex-wrap:wrap;justify-content:center;gap:0 26px;margin-top:10px}
.picked .mid .lnk{margin-top:0}
.lnk.back{color:rgba(233,226,212,.82)}
""", '<div class="veil"></div>', f"""<section class="info" aria-label="Existentialism">
<div class="school"><div class="mid"><h1 class="d" data-f="name" tabindex="-1"></h1><i class="rule"></i><p class="ask d it" data-f="q" data-long="70"></p><p class="quiet facts"><span data-f="size"></span><br><span data-f="when"></span></p>{READ}</div></div>
<div class="picked"><div class="mid"><p class="kick" data-p="n"></p><h2 class="d" data-p="title"></h2><i class="rule"></i><p class="sum d it" data-p="summary" data-plong="100"></p><p class="quiet with" data-p="who"></p><p class="row">{PART}{BACK}</p></div></div>
</section>""")
