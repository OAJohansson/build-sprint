#!/usr/bin/env python3
"""Skeleton round 3. The owner picked round 2's "The knot opens". Two independent axes:
A1-A3: three forms of the opening knot (same plain panel).  B1-B3: three panels beside the radial knot (+ idea 3 picked).
Built on ../../round-4/field-existentialism.html (approved globe). Run: python3 build.py && ./shoot.sh"""
import re, math, pathlib, html
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
BASE = (OUT.parent / 'round-4' / 'field-existentialism.html').read_text()
C = (500, 456); S = 1.7
e = html.escape

REAL = dict(
    name='Existentialism', span='1843–1949', q='If nothing hands me a purpose, how do I live?',
    # title, one-line summary, thinkers: straight from each theme's `thinkers` list in the pilot JSON
    ideas=[
        ('Existence before essence', 'Your choices shape who you become, within real limits.', ['Sartre']),
        ('Freedom and anxiety', 'You alone answer for your choices, and that can feel dizzying.', ['Kierkegaard', 'Sartre']),
        ('Authenticity versus the crowd', 'Going along with everyone feels comforting, but it lets us dodge our own choices.', ['Kierkegaard', 'Nietzsche', 'Sartre', 'Beauvoir']),
        ('Meaning without guarantees', 'As the old religious answers faded, three thinkers asked how life can still mean something.', ['Nietzsche', 'Camus', 'Beauvoir']),
        ('My freedom needs yours', 'Other people can trap us as objects, yet my freedom depends on theirs.', ['Sartre', 'Beauvoir']),
        ('Faith and the leap', "For religious existentialists, faith is a personal commitment reason can't justify.", ['Kierkegaard', 'Nietzsche', 'Sartre']),
    ],
    people=['Kierkegaard', 'Nietzsche', 'Sartre', 'Beauvoir', 'Camus'],   # the five thinker cards in the JSON, in its order
    places=[('Denmark', '1843', ['Kierkegaard']), ('Germany', '1882–1927', ['Nietzsche']), ('France', '1942–1949', ['Sartre', 'Beauvoir', 'Camus'])],
    works=7, mins=10, pick=2)
WORST = dict(REAL, name='Post-structuralism', span='1857–1994',
    q='If every meaning depends on other meanings, can anything I say ever be settled once and for all?',
    ideas=[
        ('The individual against the crowd and its expectations', 'Going along with everyone feels comforting, but it lets us dodge our own choices, again and again.', ['Kierkegaard', 'Sartre']),
        ('Power', 'It is everywhere.', ['Wollstonecraft']),
        ('Deconstruction and the instability of meaning', 'Texts undo their own claims, and every reading leaves something over that the next reading has to deal with.', ['Merleau-Ponty', 'Wittgenstein', 'Schopenhauer', 'Kierkegaard', 'Beauvoir', 'Jo']),
        ('Knowledge, discipline and the making of the self', 'What counts as true is shaped by who gets to speak.', ['Schopenhauer']),
        ('Difference', 'Not sameness.', []),
        ('The death of the author', 'A text belongs to its readers.', ['Jo', 'Beauvoir']),
        ('Meaning without guarantees', 'Nothing underwrites it.', ['Camus']),
        ('Language games and forms of life', 'Words get their meaning from use.', ['Wittgenstein']),
    ],
    people=['Merleau-Ponty', 'Wollstonecraft', 'Schopenhauer', 'Wittgenstein', 'Kierkegaard', 'Jo', 'Beauvoir', 'Camus', 'Sartre'],
    places=[('United Kingdom', '1792', ['Wollstonecraft']), ('Germany and Austria', '1818–1953', ['Schopenhauer', 'Wittgenstein']),
            ('Denmark', '1843', ['Kierkegaard']), ('France and the United States', '1942–1994', ['Merleau-Ponty', 'Camus', 'Sartre', 'Beauvoir', 'Jo'])],
    works=14, mins=23)
ONE = dict(REAL, ideas=REAL['ideas'][:1], people=REAL['people'][:1], places=REAL['places'][:1], works=1, mins=1, span='1843', pick=0)

def pl(n, w): return f'{n} {w}' + ('' if n == 1 else 's')
def size(d):
    parts = [pl(len(d['ideas']), 'idea'), pl(len(d['people']), 'thinker'), pl(d['works'], 'key work')]
    return ' '.join(f'<span class="nw">{x}{" ·" if i < len(parts) - 1 else ""}</span>' for i, x in enumerate(parts))
def about(d): return f"about {pl(d['mins'], 'minute')}"
def where(d): return f'<span class="nw">{d["span"]} ·</span> ' + ', '.join(p[0] for p in d['places'])
def names(xs):
    xs = list(xs)
    return '' if not xs else xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' and ' + xs[-1]
def speak(t): return (names(t[2]) + (' speaks in it' if len(t[2]) == 1 else ' speak in it')) if t[2] else ''

SHARED = """
.nw{white-space:nowrap}
main{display:none}
svg.threads{transform-origin:0 0;transform:translate(%(tx).1fpx,%(ty).1fpx) scale(%(s)s);overflow:visible}
svg.threads path{vector-effect:non-scaling-stroke}
svg.threads path.th.focus{stroke-opacity:.3;stroke-width:1.1}svg.threads path.th{stroke-opacity:.18}svg.threads path.far{stroke-opacity:.09}
svg.ov{position:absolute;inset:0;width:1440px;height:900px;pointer-events:none;overflow:visible}
svg.ov path{fill:none;stroke:var(--brass);stroke-width:1.3;stroke-opacity:.85}
svg.ov circle.bead{fill:var(--bone);stroke:#131d1b;stroke-width:3}
.pool{position:absolute;left:500px;top:456px;width:920px;height:820px;transform:translate(-50%%,-50%%);border-radius:50%%;background:radial-gradient(closest-side,rgba(16,25,24,.88) 0%%,rgba(16,25,24,.8) 55%%,rgba(16,25,24,0) 100%%)}
.knot{position:absolute;width:18px;height:18px;border-radius:50%%;background:var(--brass);transform:translate(-50%%,-50%%);box-shadow:0 0 0 9px rgba(211,166,108,.16),0 0 60px 20px rgba(211,166,108,.12)}
.idea{position:absolute;font:400 22px/1.2 Fraunces,serif;letter-spacing:-.005em;max-width:250px;text-wrap:balance;padding:6px 8px;border-radius:10px;transition:opacity 160ms ease}
.idea i{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;margin-right:10px;vertical-align:.2em}
.idea small{display:block;font:400 13.5px/1.3 'Hanken Grotesk',sans-serif;color:var(--quiet);margin-top:4px}
.idea.l{transform:translate(12px,-50%%)}.idea.r{transform:translate(calc(-100%% - 12px),-50%%);text-align:right}
.idea.t{transform:translate(-50%%,calc(-100%% - 10px));text-align:center}.idea.b{transform:translate(-50%%,10px);text-align:center}
.picked .idea:not(.on){opacity:.42}.picked svg.ov path:not(.on){stroke-opacity:.28}.picked svg.ov circle.bead:not(.on){fill:rgba(233,226,212,.45)}
.picked svg.ov path.on{stroke-width:2;stroke-opacity:1}.picked svg.ov circle.bead.on{fill:var(--brass)}
.nb{position:absolute;width:0;height:0}
.nb i{position:absolute;width:9px;height:9px;border-radius:50%%;background:rgba(233,226,212,.6);transform:translate(-50%%,-50%%)}
.nb span{position:absolute;white-space:nowrap;font-size:13.5px;color:rgba(233,226,212,.6);top:-9px}
.nb b{font-weight:400;color:rgba(233,226,212,.8)}
.nb.l span{left:13px}.nb.r span{right:13px}
.card{padding:30px 30px 22px;max-height:868px;overflow-y:auto;scrollbar-width:thin}
.card h1{font:300 44px/1.02 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144;overflow-wrap:break-word}
.asks{font:300 23px/1.22 Fraunces,serif;font-style:italic;letter-spacing:-.01em;margin-top:14px;text-wrap:balance;color:rgba(233,226,212,.92)}
.card hr{margin:22px 0 16px}
.meta{font-size:15px;line-height:1.5;color:rgba(233,226,212,.86);text-wrap:pretty}
.size{font-size:13.5px;color:var(--quiet);text-wrap:balance}
.go{display:flex;align-items:center;justify-content:center;width:100%%;background:var(--brass);color:#1a1408;font:600 15.5px/1.2 'Hanken Grotesk',sans-serif;padding:15px 20px;border-radius:13px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.link{font:500 15.5px/1.2 'Hanken Grotesk',sans-serif;color:var(--brass);padding:10px 0;border-radius:8px}
.back{font-size:13.5px;color:var(--quiet);padding:8px 0;border-radius:8px}
@media (hover:hover){.idea:hover{background:rgba(233,226,212,.07)}.go:hover{background:#dfb57e}.link:hover{text-decoration:underline;text-underline-offset:5px}.back:hover{color:var(--bone)}}
""" % dict(tx=C[0] - C[0] * S, ty=C[1] - C[1] * S, s=S)

# T26: the neighbour is the subject, name first
NB = [(374.7, 310.3, 'Phenomenology', 'inspired it'), (291.3, 294.4, 'Absurdism', 'grew from it'), (559.2, 256.7, 'German Idealism', 'provoked it'),
      (686.1, 403.6, 'Romanticism', 'inspired it'), (313.5, 627.1, 'Post-structuralism', 'pushed back on it'), (474.1, 681.8, 'Feminist philosophy', 'grew from it')]
def neighbours():
    out = ''
    for x, y, nm, rel in NB:
        X, Y = C[0] + (x - C[0]) * S, C[1] + (y - C[1]) * S
        al = 'r' if 260 < X < C[0] - 60 else 'l'
        out += f'<button class="nb {al}" style="left:{X:.0f}px;top:{Y:.0f}px"><i></i><span><b>{nm}</b> {rel}</span></button>'
    return out

# ---------- knots ----------
def knot_radial(d, pick=None):
    n = len(d['ideas']); rx, ry = 196, 178; paths = labels = ''
    for i, t in enumerate(d['ideas']):
        a = math.radians(-90 + 180 / n + 360 / n * i) if n > 1 else math.radians(-90)
        c, s = math.cos(a), math.sin(a); x, y = C[0] + rx * c, C[1] + ry * s
        mx, my = C[0] + rx * .55 * c - 14 * s, C[1] + ry * .55 * s + 14 * c
        on = ' on' if i == pick else ''
        paths += f'<path class="{on}" d="M{C[0]} {C[1]} Q{mx:.0f} {my:.0f} {x:.0f} {y:.0f}"/><circle class="bead{on}" cx="{x:.0f}" cy="{y:.0f}" r="{5.5 if on else 4.5}"/>'
        al = 'l' if c > .3 else 'r' if c < -.3 else ('t' if s < 0 else 'b')
        labels += f'<button class="idea {al}{on}" aria-pressed="{str(i == pick).lower()}" style="left:{x:.0f}px;top:{y:.0f}px"><i>{i+1}</i>{e(t[0])}</button>'
    return '', f'<div class="pool"></div><svg class="ov" aria-hidden="true">{paths}</svg><i class="knot" style="left:{C[0]}px;top:{C[1]}px"></i>{neighbours()}{labels}'

def knot_unspooled(d, pick=None):
    n = len(d['ideas']); K = (330, 150); y0, y1 = 250, 770
    step = (y1 - y0) / max(n - 1, 1) if n > 1 else 0
    f = lambda y: 330 + 86 * math.sin((y - 150) / 640 * 2 * math.pi)
    pts = [(f(y), y) for y in range(150, 961, 10)]
    dpath = 'M' + ' L'.join(f'{x:.1f} {y}' for x, y in pts)
    beads = labels = ''
    for i, t in enumerate(d['ideas']):
        y = y0 + step * i if n > 1 else 420; x = f(y)
        beads += f'<circle class="bead" cx="{x:.0f}" cy="{y:.0f}" r="5"/>'
        labels += f'<button class="idea l" style="left:{x + 10:.0f}px;top:{y:.0f}px;max-width:420px"><i>{i+1}</i>{e(t[0])}</button>'
    css = """
svg.threads path{display:none}.yarn{opacity:1.6}
.pool{display:none}
svg.ov path{stroke-width:1.5;stroke-linejoin:round}
.idea{font-size:24px}
.un.many .idea{font-size:19px}
"""
    return css, f'<div class="un{" many" if n > 6 else ""}"><svg class="ov" aria-hidden="true"><path d="{dpath}"/>{beads}</svg><i class="knot" style="left:{K[0]}px;top:{K[1]}px"></i>{labels}</div>'

def knot_clew(d, pick=None):
    n = len(d['ideas']); cx, cy, r = 214, 456, 122
    step = min(104, 660 / n)
    wound = ''.join(f'<ellipse cx="{cx}" cy="{cy}" rx="{r}" ry="{ry}" transform="rotate({rot} {cx} {cy})" class="{k}"/>' for ry, rot, k in
                    [(104, -18, ''), (78, 34, ''), (52, -52, ''), (30, 12, ''), (92, 71, ''), (64, -84, ''), (18, -31, 'br'), (40, 58, ''), (112, 8, ''), (70, -6, 'br')])
    paths = labels = ''
    for i, t in enumerate(d['ideas']):
        y = cy + (i - (n - 1) / 2) * step
        a = math.radians((i - (n - 1) / 2) * (100 / max(n - 1, 1)))
        sx, sy = cx + r * math.cos(a) * .96, cy + r * math.sin(a) * .96
        paths += f'<path d="M{sx:.0f} {sy:.0f} C{sx + 130:.0f} {sy + (y - sy) * .1:.0f} 400 {y:.0f} 520 {y:.0f}"/><circle class="bead" cx="520" cy="{y:.0f}" r="4.5"/>'
        who = f'<small>{e(names(t[2]))}</small>' if t[2] else ''
        labels += f'<button class="idea l" style="left:522px;top:{y:.0f}px;max-width:430px"><i>{i+1}</i>{e(t[0])}{who}</button>'
    css = """
svg.threads{display:none}.pool{display:none}
svg.ov ellipse,svg.ov circle.rim{fill:none;stroke:var(--bone);stroke-opacity:.3;stroke-width:1}
svg.ov ellipse.br{stroke:var(--brass);stroke-opacity:.8}
svg.ov circle.glow{fill:url(#clewlit);stroke:none}
.cl.many .idea{font-size:19px}.cl.many .idea small{display:inline;margin-left:10px}
"""
    return css, f"""<div class="cl{' many' if n > 6 else ''}"><svg class="ov" aria-hidden="true"><defs><radialGradient id="clewlit" cx="36%" cy="30%" r="75%"><stop offset="0" stop-color="#e9e2d4" stop-opacity=".13"/><stop offset="1" stop-color="#e9e2d4" stop-opacity="0"/></radialGradient></defs>
<circle class="glow" cx="{cx}" cy="{cy}" r="{r}"/>{wound}<circle class="rim" cx="{cx}" cy="{cy}" r="{r}"/>{paths}</svg>{labels}</div>"""

# ---------- panels ----------
def panel_plain(d, pick=None):
    return '', f"""<aside class="card solid" aria-label="{e(d['name'])}"><h1>{e(d['name'])}</h1><p class="asks">{e(d['q'])}</p>
<hr><h2>You'll meet</h2><p class="meta">{names(d['people'])}</p><p class="size" style="margin-top:6px">{where(d)}</p>
<button class="go" style="margin-top:22px">Read it · {about(d)}</button><p class="size" style="margin-top:11px;text-align:center">{size(d)}</p></aside>"""

def panel_line(d, pick=None):
    css = """
.ln{position:absolute;left:1000px;top:50%;transform:translateY(-50%);width:400px}
.ln .who{font:400 22px/1.2 Fraunces,serif;color:rgba(233,226,212,.82);margin-bottom:14px;overflow-wrap:break-word}
.ln .who i{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;margin-right:10px;vertical-align:.2em}
.ln .big{font:300 54px/1.04 Fraunces,serif;letter-spacing:-.03em;font-variation-settings:'opsz' 144;text-wrap:balance}
.ln .big.m{font-size:38px;line-height:1.1;letter-spacing:-.022em}.ln .big.s{font-size:29px;line-height:1.16;letter-spacing:-.015em}
.ln .rest{margin-top:30px;padding-top:18px;border-top:1px solid var(--faint)}
.ln .go{margin-top:20px}.ln .size{margin-top:6px}
.ln .row{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-top:12px}
"""
    if pick is None:
        k = 's' if len(d['q']) > 80 else 'm' if len(d['q']) > 50 else ''
        body = f"""<aside class="ln solid" aria-label="{e(d['name'])}"><h1 class="who">{e(d['name'])} asks</h1><p class="big {k}">{e(d['q'])}</p>
<div class="rest"><p class="meta">You'll meet {names(d['people'])}</p><p class="size">{where(d)}</p>
<button class="go">Read it · {about(d)}</button><p class="size" style="text-align:center;margin-top:11px">{size(d)}</p></div></aside>"""
    else:
        t = d['ideas'][pick]; k = 's' if len(t[1]) > 95 else 'm'
        sp = f'<p class="meta">{e(speak(t))}</p>' if t[2] else ''
        body = f"""<aside class="ln solid" aria-label="{e(t[0])}"><h1 class="who"><i>{pick+1}</i>{e(t[0])}</h1><p class="big {k}">{e(t[1])}</p>
<div class="rest">{sp}<div class="row"><button class="link">Read this part ↓</button><button class="back">Back to {e(d['name'])}</button></div></div></aside>"""
    return css, body

def panel_tag(d, pick=None):
    css = """
.tag{position:absolute;left:1034px;top:50%;width:334px;transform:translateY(-50%) rotate(1.6deg);transform-origin:38px 38px;background:#e9e2d4;color:#18211f;border-radius:10px;padding:68px 32px 26px;box-shadow:0 40px 70px -30px rgba(0,0,0,.8),0 0 0 1px rgba(0,0,0,.2)}
.tag:before{content:"";position:absolute;left:28px;top:26px;width:18px;height:18px;border-radius:50%;background:#131d1b;box-shadow:inset 0 0 0 1px rgba(0,0,0,.4),0 0 0 4px rgba(24,33,31,.12)}
.tag h1{font:300 40px/1.02 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144;overflow-wrap:break-word;hyphens:auto}
.tag h1.sm{font-size:31px;line-height:1.08}
.tag .k{font-size:13.5px;color:rgba(24,33,31,.72);margin-bottom:8px}
.tag .asks{color:#18211f;font-size:22px}
.tag .sum{font:400 19px/1.36 Fraunces,serif;margin-top:12px}
.tag hr{border:0;border-top:1px solid rgba(24,33,31,.24);margin:20px 0 14px}
.tag .meta{color:rgba(24,33,31,.9)}.tag .size{color:rgba(24,33,31,.72);margin-top:4px}
.tag .go{background:#18211f;color:#e9e2d4;margin-top:20px}
.tag .link{color:#6f4f1f;display:inline-block;margin-top:10px}.tag .back{color:rgba(24,33,31,.72);float:right;margin-top:12px}
.tag button:focus-visible{outline-color:#6f4f1f}
svg.ov path.tie{stroke:var(--bone);stroke-opacity:.75;stroke-width:1.2}
@media (hover:hover){.tag .go:hover{background:#26322f}.tag .back:hover{color:#18211f}}
"""
    if pick is None:
        body = f"""<aside class="tag" aria-label="{e(d['name'])}"><h1>{e(d['name'])}</h1><p class="asks">{e(d['q'])}</p>
<hr><p class="meta">You'll meet {names(d['people'])}</p><p class="size">{where(d)}</p>
<button class="go">Read it · {about(d)}</button><p class="size" style="text-align:center;margin-top:10px">{size(d)}</p></aside>"""
    else:
        t = d['ideas'][pick]; sp = f'<hr><p class="meta">{e(speak(t))}</p>' if t[2] else ''
        body = f"""<aside class="tag" aria-label="{e(t[0])}"><p class="k">{e(d['name'])} · idea {pick+1} of {len(d['ideas'])}</p><h1 class="sm">{e(t[0])}</h1><p class="sum">{e(t[1])}</p>
{sp}<button class="link">Read this part ↓</button><button class="back">Back</button></aside>"""
    # the tie runs from the knot to the punched hole; the hole's y is set after layout by a two-line script (static sketch only)
    body += """<svg class="ov" aria-hidden="true"><path class="tie" id="tie"/></svg><script>addEventListener('load',()=>{const t=document.querySelector('.tag'),r=t.getBoundingClientRect(),s=document.querySelector('.screen').getBoundingClientRect();const hx=r.left-s.left+40,hy=r.top-s.top+36;document.getElementById('tie').setAttribute('d',`M500 456 C690 ${hy+300} 960 ${hy+310} ${hx} ${hy}`)})</script>"""
    return css, body

def panel_route(d, pick=None):
    n = len(d['places']); t = d['ideas'][pick] if pick is not None else None
    css = f"""
.card.rt{{padding-bottom:24px}}
.card h1.sm{{font-size:32px;line-height:1.08;letter-spacing:-.02em}}
.card .k{{font-size:13.5px;color:var(--quiet);margin-bottom:8px}}
.card .sum{{font:300 20px/1.35 Fraunces,serif;color:rgba(233,226,212,.92);margin-top:12px}}
.route{{display:grid;grid-template-columns:repeat({min(n, 3)},1fr);gap:40px 14px;position:relative;margin-top:44px}}
.route li{{position:relative;min-width:0}}
.route li:after{{content:"";position:absolute;left:0;right:-14px;top:-20px;border-top:1.3px solid var(--brass);opacity:.85}}
.route li:nth-child(3n+1):after{{left:-30px}}.route li:nth-child(3n):after,.route li:last-child:after{{right:-30px}}
.route li:before{{content:"";position:absolute;z-index:1;left:0;top:-25px;width:11px;height:11px;border-radius:50%;background:var(--bone);box-shadow:0 0 0 4px var(--lift)}}
.route b{{display:block;font:400 21px/1.12 Fraunces,serif;letter-spacing:-.01em;overflow-wrap:break-word;text-wrap:balance}}
.route.many b{{font-size:17px}}.route.many span{{font-size:13.5px}}
.route time{{display:block;font-size:13px;color:var(--brass);margin:5px 0 7px}}
.route span{{display:block;font-size:15px;line-height:1.5;color:rgba(233,226,212,.88);overflow-wrap:break-word;hyphens:auto}}
.route.pk span:not(.on){{opacity:.36}}.route.pk span.on:before{{content:"";display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--brass);margin-right:7px;vertical-align:.12em}}
.rt .go{{margin-top:24px}}.rt .row{{display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin-top:16px}}
"""
    route = ''.join(f'<li><b>{e(p[0])}</b><time>{p[1]}</time>' + ''.join(f'<span class="{"on" if t and x in t[2] else ""}">{e(x)}</span>' for x in p[2]) + '</li>' for p in d['places'])
    r = f'<ol class="route{" many" if n > 3 else ""}{" pk" if t else ""}" aria-label="Where and when, and who you will meet">{route}</ol>'
    if t is None:
        body = f"""<aside class="card rt solid" aria-label="{e(d['name'])}"><h1>{e(d['name'])}</h1><p class="asks">{e(d['q'])}</p>{r}
<button class="go">Read it · {about(d)}</button><p class="size" style="margin-top:11px;text-align:center">{size(d)}</p></aside>"""
    else:
        cnt = f'<p class="size" style="margin-top:14px">{len(t[2])} of the {len(d["people"])} speak in it</p>' if len(d['people']) > 1 else ''
        body = f"""<aside class="card rt solid" aria-label="{e(t[0])}"><p class="k">{e(d['name'])} · idea {pick+1} of {len(d['ideas'])}</p><h1 class="sm">{e(t[0])}</h1><p class="sum">{e(t[1])}</p>{r}{cnt}
<div class="row"><button class="link">Read this part ↓</button><button class="back">Back to {e(d['name'])}</button></div></aside>"""
    return css, body

def page(title, d, knot, panel, pick=None):
    kc, kb = knot(d, pick); pc, pb = panel(d, pick)
    h = re.sub(r'<aside class="card solid".*?</aside>', lambda m: f'<div class="{"picked" if pick is not None else ""}">{kb}</div>{pb}', BASE, flags=re.S)
    h = h.replace('</style></head>', SHARED + kc + pc + '</style></head>')
    return re.sub(r'<title>.*?</title>', f'<title>Meander · skeleton r3 · {e(title)}</title>', h)

A = [('A1-radial', 'A1 · Radial', 'Six threads fan out from the knot; names sit at the thread ends, all round. The zoomed globe and six quiet neighbours stay behind', knot_radial),
     ('A2-unspooled', 'A2 · Unspooled', 'One thread drawn out of the knot in a slow meander, six beads in reading order, names in one column. Only the globe\'s faint rim stays', knot_unspooled),
     ('A3-clew', 'A3 · The clew', 'The globe becomes a hand-wound ball; six thread ends are pulled out to a tidy column, each with who speaks in it. Nothing else stays', knot_clew)]
B = [('B1-one-big-line', 'B1 · One big line', 'No box. One sentence at a time in large type: the question, or the picked idea\'s one-liner', panel_line),
     ('B2-tag', 'B2 · The tag', 'A paper tag tied to the knot by a thread; pick an idea and the tag is rewritten for it', panel_tag),
     ('B3-route', 'B3 · The route', 'Where and when as three stops with the people under them; pick an idea and its speakers stay lit', panel_route)]

if __name__ == '__main__':
    for slug, name, axis, k in A:
        (OUT / f'{slug}.html').write_text(page(name, REAL, k, panel_plain))
        (HERE / 'checks' / f'{slug}-worst.html').write_text(page(name, WORST, k, panel_plain))
        (HERE / 'checks' / f'{slug}-one.html').write_text(page(name, ONE, k, panel_plain))
    for slug, name, axis, p in B:
        (OUT / f'{slug}.html').write_text(page(name, REAL, knot_radial, p))
        (OUT / f'{slug}b-picked.html').write_text(page(name + ' · idea 3 picked', REAL, knot_radial, p, REAL['pick']))
        for tag, dd, pk in [('worst', WORST, None), ('worst-picked', WORST, 2), ('worst-nobody', WORST, 4), ('one', ONE, None), ('one-picked', ONE, 0)]:
            (HERE / 'checks' / f'{slug}-{tag}.html').write_text(page(name, dd, knot_radial, p, pk))
    fig = lambda slug, name, axis, extra='': f'<figure><a href="{slug}.html"><img src="{slug}.png" alt="{e(name)}"></a><figcaption><b>{e(name)}</b><span>{e(axis)}</span></figcaption>{extra}</figure>'
    rowA = ''.join(fig(*x[:3]) for x in A)
    rowB = ''.join(fig(s, n, a, f'<a class="pk" href="{s}b-picked.html"><img src="{s}b-picked.png" alt="{e(n)}, idea 3 picked"><span>idea 3 picked</span></a>') for s, n, a, _ in B)
    (OUT / 'contact-sheet.html').write_text(f"""<!doctype html><html lang="en" style="color-scheme:dark"><head><meta charset="utf-8"><title>Meander · skeleton round 3</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<style>*{{box-sizing:border-box;margin:0}}body{{background:#0b1211;color:#e9e2d4;font:400 17px/1.45 'Hanken Grotesk',sans-serif;padding:48px 44px 70px;width:2400px;-webkit-font-smoothing:antialiased}}
h1{{font:300 44px/1.1 Fraunces,serif;letter-spacing:-.02em}}p.i{{color:rgba(233,226,212,.74);max-width:1100px;margin:10px 0 0;font-size:18px}}
h2{{font:300 34px/1.1 Fraunces,serif;letter-spacing:-.015em;margin:54px 0 6px}}h2 small{{font:400 17px/1.4 'Hanken Grotesk',sans-serif;color:rgba(233,226,212,.74);margin-left:14px;letter-spacing:0}}
.g{{display:grid;grid-template-columns:repeat(3,1fr);gap:30px;margin-top:20px}}figure{{position:relative}}
img{{display:block;width:100%;border-radius:14px;border:1px solid rgba(233,226,212,.14)}}
figcaption{{margin:12px 0 0;min-height:96px}}figcaption b{{display:block;font:400 24px/1.2 Fraunces,serif}}figcaption span{{display:block;color:rgba(233,226,212,.78);margin-top:4px}}
.pk{{display:block;position:relative;margin-top:8px;text-decoration:none}}.pk span{{position:absolute;left:14px;bottom:12px;font-size:14px;color:#e9e2d4;background:rgba(11,18,17,.85);padding:3px 9px;border-radius:6px}}</style></head>
<body><h1>Skeleton, round 3: the knot opens</h1><p class="i">Two separate picks. Row A changes only the knot (same plain panel). Row B changes only the panel (same radial knot), with a second frame showing idea 3 picked. Real content from the Existentialism pilot.</p>
<h2>A · How the knot opens <small>pick one</small></h2><div class="g">{rowA}</div>
<h2>B · What's beside it <small>pick one</small></h2><div class="g">{rowB}</div></body></html>""")
    print('built')
