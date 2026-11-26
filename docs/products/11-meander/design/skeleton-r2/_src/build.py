#!/usr/bin/env python3
"""Skeleton round 2: ten directions on top of the approved round-4 globe.
Reads ../../round-4/field-existentialism.html (the approved screen), drops its card and adds each direction.
Run: python3 build.py   (then ./shoot.sh)"""
import re, math, pathlib, html
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent
BASE = (OUT.parent / 'round-4' / 'field-existentialism.html').read_text()
C = (500, 456)

REAL = dict(
    name='Existentialism', span='1843–1949',
    q='If nothing hands me a purpose, how do I live?',
    ideas=[
        ('Existence before essence', 'Your choices shape who you become, within real limits.', ['Sartre']),
        ('Freedom and anxiety', 'You alone answer for your choices, and that can feel dizzying.', ['Kierkegaard', 'Sartre']),
        ('Authenticity versus the crowd', 'Going along with everyone feels comforting, but it lets us dodge our own choices.', ['Kierkegaard', 'Nietzsche', 'Heidegger', 'Sartre', 'Beauvoir']),
        ('Meaning without guarantees', 'As the old religious answers faded, three thinkers asked how life can still mean something.', ['Nietzsche', 'Camus', 'Beauvoir']),
        ('My freedom needs yours', 'Other people can trap us as objects, yet my freedom depends on theirs.', ['Sartre', 'Beauvoir']),
        ('Faith and the leap', "For religious existentialists, faith is a personal commitment reason can't justify.", ['Kierkegaard', 'Nietzsche', 'Sartre']),
    ],
    # short name, initials, place, year(s) of key work
    people=[('Kierkegaard', 'SK', 'Denmark', '1843'), ('Nietzsche', 'FN', 'Germany', '1882'), ('Heidegger', 'MH', 'Germany', '1927'),
            ('Camus', 'AC', 'France', '1942'), ('Sartre', 'JS', 'France', '1943'), ('Beauvoir', 'SB', 'France', '1949')],
    places=[('Denmark', '1843', ['Kierkegaard']), ('Germany', '1882–1927', ['Nietzsche', 'Heidegger']), ('France', '1942–1949', ['Camus', 'Sartre', 'Beauvoir'])],
    works=7, mins=10, pick='Beauvoir', open=2,
    lede='Existentialism is a loose family of ideas, not a tidy school. It starts from life as a person lives it, not from the detached, objective standpoint that much earlier philosophy preferred.',
    body=["Being authentic means being true to yourself. Existentialists criticise our habit of living by the rules and expectations of everyone around us. Heidegger's name for this crowd was 'the They': we enjoy, read and judge things as 'they' do. It feels like living well, but it hides our freedom from us.",
          "Sartre and Beauvoir call this kind of self-deception 'bad faith'. It comes in two forms:"],
    items=["Treating yourself as a fixed thing: 'I am what I am', and nothing can change me.", 'Pretending you have no limits, as if your past and your situation did not constrain your choices.'],
)
# break-ui: a plausible busiest school. Long names, eight ideas, nine people, four places, a long question.
WORST = dict(REAL,
    name='Post-structuralism', span='1857–1994',
    q='If every meaning depends on other meanings, can anything I say ever be settled once and for all?',
    ideas=[
        ('The individual against the crowd and its expectations', 'Going along with everyone feels comforting, but it lets us dodge our own choices, again and again.', ['Kierkegaard', 'Sartre']),
        ('Power', 'It is everywhere.', ['Wollstonecraft']),
        ('Deconstruction and the instability of meaning', 'Texts undo their own claims.', ['Merleau-Ponty', 'Wittgenstein', 'Schopenhauer', 'Kierkegaard', 'Beauvoir', 'Jo']),
        ('Knowledge, discipline and the making of the self', 'What counts as true is shaped by who gets to speak.', ['Schopenhauer']),
        ('Difference', 'Not sameness.', []),
        ('The death of the author', 'A text belongs to its readers.', ['Jo', 'Beauvoir']),
        ('Meaning without guarantees', 'Nothing underwrites it.', ['Camus']),
        ('Language games and forms of life', 'Words get their meaning from use.', ['Wittgenstein']),
    ],
    people=[('Merleau-Ponty', 'MM', 'France', '1945'), ('Wollstonecraft', 'MW', 'United Kingdom', '1792'), ('Schopenhauer', 'AS', 'Germany', '1818'),
            ('Wittgenstein', 'LW', 'Austria', '1921–1953'), ('Kierkegaard', 'SK', 'Denmark', '1843'), ('Jo', 'J', 'United States', '1994'),
            ('Beauvoir', 'SB', 'France', '1949'), ('Camus', 'AC', 'France', '1942'), ('Sartre', 'JS', 'France', '1943')],
    places=[('United Kingdom', '1792', ['Wollstonecraft']), ('Germany and Austria', '1818–1953', ['Schopenhauer', 'Wittgenstein']),
            ('Denmark', '1843', ['Kierkegaard']), ('France and the United States', '1942–1994', ['Merleau-Ponty', 'Camus', 'Sartre', 'Beauvoir', 'Jo'])],
    works=14, mins=23, pick='Merleau-Ponty',
)
ONE = dict(REAL, ideas=REAL['ideas'][:1], people=REAL['people'][:1], places=REAL['places'][:1], works=1, mins=1, span='1843', pick='Kierkegaard', open=0)

e = html.escape
def pl(n, w): return f'{n} {w}' + ('' if n == 1 else 's')
def size(d, mins=True):
    parts = [pl(len(d['ideas']), 'idea'), pl(len(d['people']), 'thinker'), pl(d['works'], 'key work')] + ([f"about {pl(d['mins'], 'minute')} to read"] if mins else [])
    return ' '.join(f'<span class="nw">{x}{" ·" if i < len(parts) - 1 else ""}</span>' for i, x in enumerate(parts))
def about(d): return f"about {pl(d['mins'], 'minute')}"
def where(d): return f'<span class="nw">{d["span"]} ·</span> ' + ', '.join(p[0] for p in d['places'])
def names(xs):
    xs = list(xs)
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' and ' + xs[-1]
def meet(d): return names(p[0] for p in d['people'])
NUM = ['', 'One idea', 'Two ideas', 'Three ideas', 'Four ideas', 'Five ideas', 'Six ideas', 'Seven ideas', 'Eight ideas', 'Nine ideas']
def nideas(d): return NUM[len(d['ideas'])]
def six(d, cls='sk-six', cur=None):
    return f'<ol class="{cls}">' + ''.join(f'<li{" class=cur" if i == cur else ""}><button><i>{i+1}</i><span>{e(t[0])}</span></button></li>' for i, t in enumerate(d['ideas'])) + '</ol>'

SHARED = """
.sk-q{font:300 30px/1.14 Fraunces,serif;letter-spacing:-.02em;font-variation-settings:'opsz' 144;text-wrap:balance}
.sk-six button{display:flex;gap:14px;align-items:baseline;width:100%;font:400 19px/1.25 Fraunces,serif;padding:7px 12px;border-radius:10px;text-wrap:balance}
.sk-six{margin:0 -12px}
.sk-six i{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;width:10px;flex-shrink:0}
.sk-six span{min-width:0;overflow-wrap:anywhere}
.sk-meta{font-size:15px;line-height:1.5;color:rgba(233,226,212,.86);text-wrap:pretty}
.sk-size{font-size:13.5px;color:var(--quiet);text-wrap:balance}
.sk-go{display:flex;align-items:center;justify-content:center;width:100%;background:var(--brass);color:#1a1408;font:600 15.5px/1.2 'Hanken Grotesk',sans-serif;padding:15px 20px;border-radius:13px;transition:transform 160ms cubic-bezier(.23,1,.32,1),background-color 160ms ease}
.sk-link{font:500 15.5px/1.2 'Hanken Grotesk',sans-serif;color:var(--brass);padding:10px 0;border-radius:8px}
.nw{white-space:nowrap}
.card{max-height:868px;overflow-y:auto;scrollbar-width:thin}
svg.ov{position:absolute;inset:0;width:1440px;height:900px;pointer-events:none;overflow:visible}
@media (hover:hover){.sk-six button:hover{background:rgba(233,226,212,.07)}.sk-go:hover{background:#dfb57e}.sk-link:hover{text-decoration:underline;text-underline-offset:5px}}
"""

def globe_css(s=1, cx=500, cy=456, hide_main=False, dim=1):
    if s == 1 and (cx, cy) == C and not hide_main and dim == 1: return ''
    t = f"transform-origin:0 0;transform:translate({cx - C[0]*s:.1f}px,{cy - C[1]*s:.1f}px) scale({s})"
    css = f"svg.threads,main{{{t}}}svg.threads{{overflow:visible}}"
    if hide_main: css += "main{display:none}svg.threads path{vector-effect:non-scaling-stroke}"
    if dim != 1: css += f"svg.threads,main{{opacity:{dim}}}"
    return css

def page(title, d, css, body, **g):
    h = BASE
    if g.get('s', 1) != 1: body = body.replace(' solid', '')
    h = re.sub(r'<aside class="card solid".*?</aside>', lambda m: body, h, flags=re.S)
    h = h.replace('</style></head>', SHARED + globe_css(**g) + css + '</style></head>')
    h = re.sub(r'<title>.*?</title>', f'<title>Meander · skeleton r2 · {e(title)}</title>', h)
    h = h.replace('<h1>Existentialism</h1><p>1840s–1960s · you are here</p>', f"<h1>{e(d['name'])}</h1><p>{d['span']} · you are here</p>")
    return h

# ---------- 1 · The card, improved ----------
def d01(d):
    css = """
.card{padding:28px 30px 22px}
.card hr{margin:20px 0 14px}
.card .sk-meta{margin-bottom:4px}
.card .sk-go{margin-top:22px}
.card .sk-size{text-align:center;margin-top:11px}
"""
    body = f"""<aside class="card solid" aria-label="{e(d['name'])}"><h2>It asks</h2><p class="sk-q">{e(d['q'])}</p>
<hr><h2>{nideas(d)}</h2>{six(d)}
<hr><h2>You'll meet</h2><p class="sk-meta">{meet(d)}</p><p class="sk-size" style="margin-top:6px">{where(d)}</p>
<button class="sk-go">Read it · {about(d)}</button><p class="sk-size">{size(d, False)}</p></aside>"""
    return css, body, {}

# ---------- 2 · The knot opens ----------
NB = [('phe', 374.7, 310.3, 'built on', 'Phenomenology'), ('abs', 291.3, 294.4, 'grew from it', 'Absurdism'), ('ide', 559.2, 256.7, 'pushed against', 'German Idealism'),
      ('rom', 686.1, 403.6, 'built on', 'Romanticism'), ('pos', 313.5, 627.1, 'pushed back', 'Post-structuralism'), ('fem', 474.1, 681.8, 'grew from it', 'Feminist philosophy')]
def d02(d):
    S = 1.7
    n = len(d['ideas']); rx, ry = 196, 178
    paths, labels = '', ''
    for i, t in enumerate(d['ideas']):
        a = math.radians(-90 + 180 / n + 360 / n * i) if n > 1 else math.radians(-90)
        c, s = math.cos(a), math.sin(a)
        x, y = C[0] + rx * c, C[1] + ry * s
        mx, my = C[0] + rx * .55 * c - 14 * s, C[1] + ry * .55 * s + 14 * c
        paths += f'<path d="M{C[0]} {C[1]} Q{mx:.0f} {my:.0f} {x:.0f} {y:.0f}"/><circle cx="{x:.0f}" cy="{y:.0f}" r="4.5"/>'
        al = 'l' if c > .3 else 'r' if c < -.3 else ('t' if s < 0 else 'b')
        labels += f'<button class="idea {al}" style="left:{x:.0f}px;top:{y:.0f}px"><i>{i+1}</i>{e(t[0])}</button>'
    nb = ''
    for _, x, y, rel, nm in NB:
        X, Y = C[0] + (x - C[0]) * S, C[1] + (y - C[1]) * S
        al = 'r' if 260 < X < C[0] - 60 else 'l'
        nb += f'<button class="nb {al}" style="left:{X:.0f}px;top:{Y:.0f}px"><i></i><span>{rel} <b>{nm}</b></span></button>'
    css = """
svg.threads path.th.focus{stroke-opacity:.34;stroke-width:1.1}
svg.threads path.th{stroke-opacity:.2}svg.threads path.far{stroke-opacity:.1}
.pool{position:absolute;left:500px;top:456px;width:900px;height:800px;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(16,25,24,.86) 0%,rgba(16,25,24,.8) 55%,rgba(16,25,24,0) 100%)}
svg.ov path{fill:none;stroke:var(--brass);stroke-width:1.3;stroke-opacity:.85}
svg.ov circle{fill:var(--bone);stroke:#131d1b;stroke-width:3}
.knot{position:absolute;left:500px;top:456px;width:18px;height:18px;border-radius:50%;background:var(--brass);transform:translate(-50%,-50%);box-shadow:0 0 0 9px rgba(211,166,108,.16),0 0 60px 20px rgba(211,166,108,.12)}
.idea{position:absolute;font:400 22px/1.2 Fraunces,serif;letter-spacing:-.005em;max-width:250px;text-wrap:balance;padding:6px 8px;border-radius:10px}
.idea i{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;margin-right:10px;vertical-align:.2em}
.idea.l{transform:translate(12px,-50%)}.idea.r{transform:translate(calc(-100% - 12px),-50%);text-align:right}
.idea.t{transform:translate(-50%,calc(-100% - 10px));text-align:center}.idea.b{transform:translate(-50%,10px);text-align:center}
.nb{position:absolute;width:0;height:0}
.nb i{position:absolute;width:9px;height:9px;border-radius:50%;background:rgba(233,226,212,.6);transform:translate(-50%,-50%)}
.nb span{position:absolute;white-space:nowrap;font-size:13.5px;color:rgba(233,226,212,.6);top:-9px}
.nb b{font-weight:400;color:rgba(233,226,212,.78)}
.nb.l span{left:13px}.nb.r span{right:13px}
.card{padding:30px 30px 22px}
.card h1{font:300 44px/1.02 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144;overflow-wrap:anywhere}
.card .asks{font:300 23px/1.22 Fraunces,serif;font-style:italic;letter-spacing:-.01em;margin-top:14px;text-wrap:balance;color:rgba(233,226,212,.92)}
.card hr{margin:22px 0 16px}
.card .sk-go{margin-top:22px}.card .sk-size{margin-top:11px;text-align:center}
@media (hover:hover){.idea:hover{background:rgba(233,226,212,.07)}}
"""
    body = f"""<div class="pool"></div><svg class="ov" aria-hidden="true">{paths}</svg><i class="knot"></i>{nb}{labels}
<aside class="card solid" aria-label="{e(d['name'])}"><h1>{e(d['name'])}</h1><p class="asks">{e(d['q'])}</p>
<hr><h2>You'll meet</h2><p class="sk-meta">{meet(d)}</p><p class="sk-size" style="margin-top:6px">{where(d)}</p>
<button class="sk-go">Read it · {about(d)}</button><p class="sk-size">{size(d, False)}</p></aside>"""
    return css, body, dict(s=S, hide_main=True)

# ---------- 3 · The spine ----------
def d03(d):
    n = len(d['ideas'])
    css = """
.spine{position:absolute;left:1000px;top:50%;transform:translateY(-50%);width:396px}
.spine .lab{font-size:13.5px;color:var(--quiet);margin-bottom:10px}
.spine .sk-q{font-size:32px;margin-bottom:34px}
.spine ol{position:relative;padding-left:40px}
.spine ol:before{content:"";position:absolute;left:10px;top:-22px;bottom:-400px;border-left:1.4px solid var(--brass);opacity:.85}
.spine ol:after{content:"";position:absolute;left:3.5px;top:-34px;width:14px;height:14px;border-radius:50%;background:var(--brass);box-shadow:0 0 0 7px rgba(211,166,108,.16)}
.spine li{position:relative}
.spine li button{font:400 23px/1.2 Fraunces,serif;letter-spacing:-.005em;padding:11px 10px;margin-left:-10px;border-radius:10px;text-wrap:balance;display:block;max-width:100%;overflow-wrap:anywhere}
.spine li:before{content:"";position:absolute;left:-35px;top:19px;width:11px;height:11px;border-radius:50%;background:var(--bone);box-shadow:0 0 0 4px #121c1a}
.spine.many .sk-q{font-size:25px;margin-bottom:30px}.spine.many li button{font-size:19px;padding:7px 10px}.spine.many li:before{top:13px}
.spine .tail{padding-left:40px;margin-top:22px;position:relative}
.spine .tail .sk-link{display:inline-block;margin-top:10px}
@media (hover:hover){.spine li button:hover{background:rgba(233,226,212,.07)}}
"""
    body = f"""<aside class="spine solid{' many' if n > 6 or len(d['q']) > 70 else ''}" aria-label="{e(d['name'])}"><p class="lab">{e(d['name'])} asks</p><p class="sk-q">{e(d['q'])}</p>
<ol>{''.join(f'<li><button>{e(t[0])}</button></li>' for t in d['ideas'])}</ol>
<div class="tail"><p class="sk-meta">With {meet(d)}</p><p class="sk-size" style="margin-top:4px">{where(d)}</p>
<button class="sk-link">Follow the thread · {about(d)} ↓</button><p class="sk-size">{size(d, False)}</p></div></aside>"""
    return css, body, {}

def d03b(d):
    cur = min(d['open'], len(d['ideas']) - 1); t = d['ideas'][cur]
    css = """
main,.title{display:none}
.mini{position:absolute;left:170px;top:236px;width:14px;height:14px;border-radius:50%;background:var(--brass);transform:translate(-50%,-50%);box-shadow:0 0 0 6px rgba(211,166,108,.16)}
.minil{position:absolute;left:44px;top:372px;width:270px;font:300 26px/1.1 Fraunces,serif;letter-spacing:-.02em;overflow-wrap:anywhere}
.rail{position:absolute;left:44px;top:440px;width:290px;padding-left:28px}
.rail:before{content:"";position:absolute;left:6px;top:-12px;bottom:-500px;border-left:1.3px solid var(--brass);opacity:.7}
.rail li{position:relative}
.rail button{font-size:15px;line-height:1.3;color:var(--quiet);padding:8px 8px;margin-left:-8px;border-radius:8px;display:block;text-wrap:balance}
.rail li:before{content:"";position:absolute;left:-26px;top:14px;width:9px;height:9px;border-radius:50%;background:#121c1a;border:1.3px solid rgba(233,226,212,.7)}
.rail li.done:before{background:var(--bone);border-color:var(--bone)}
.rail li.cur:before{left:-29px;top:12px;width:13px;height:13px;background:var(--brass);border:0;box-shadow:0 0 0 5px rgba(211,166,108,.18)}
.rail li.cur button{color:var(--bone);font:400 19px/1.2 Fraunces,serif}
.rail li.cur small{display:block;font:400 13px/1.2 'Hanken Grotesk',sans-serif;color:var(--brass);margin-top:4px}
.art{position:absolute;left:470px;top:0;width:640px;padding-top:112px}
.art .k{font-size:13.5px;color:var(--brass)}
.art h1{font:300 46px/1.06 Fraunces,serif;letter-spacing:-.025em;font-variation-settings:'opsz' 144;margin:10px 0 12px}
.art .sum{font:300 22px/1.35 Fraunces,serif;color:rgba(233,226,212,.9);margin-bottom:26px}
.art p.b,.art li{font-size:17.5px;line-height:1.62;color:rgba(233,226,212,.9)}
.art p.b+p.b{margin-top:16px}
.art ul{margin-top:10px;padding-left:22px}.art li{list-style:disc;margin-top:6px}
"""
    rail = ''.join(f'<li class="{"cur" if i == cur else "done" if i < cur else ""}"><button>{e(x[0])}{"<small>you are here</small>" if i == cur else ""}</button></li>' for i, x in enumerate(d['ideas']))
    body = f"""<i class="mini"></i><p class="minil">{e(d['name'])}</p><ol class="rail" aria-label="{nideas(d)}">{rail}</ol>
<article class="art"><p class="k">Idea {cur+1} of {len(d['ideas'])}</p><h1>{e(t[0])}</h1><p class="sum">{e(t[1])}</p>
{''.join(f'<p class="b">{e(p)}</p>' for p in d['body'])}<ul>{''.join(f'<li>{e(x)}</li>' for x in d['items'])}</ul></article>"""
    return css, body, dict(s=.3, cx=170, cy=236, hide_main=True)

# ---------- 4 · The journey ----------
def d04(d):
    n = len(d['places'])
    css = f"""
.card{{left:890px;width:506px;padding:30px 32px 24px}}
.card .sk-q{{font-size:27px;margin-bottom:26px}}
.route{{display:grid;grid-template-columns:repeat({min(n, 3)},1fr);gap:44px 18px;position:relative;padding-top:26px;margin:0 -32px;padding-left:32px;padding-right:32px}}
.route li:after{{content:"";position:absolute;left:-32px;right:-18px;top:-20px;border-top:1.4px solid var(--brass);opacity:.85}}.route li:nth-child(3n):after,.route li:last-child:after{{right:-32px}}.route li:not(:nth-child(3n+1)):after{{left:0}}
.route li{{position:relative;min-width:0}}
.route li:before{{content:"";position:absolute;z-index:1;left:0;top:-26px;width:13px;height:13px;border-radius:50%;background:var(--bone);box-shadow:0 0 0 4px var(--lift)}}
.route b{{display:block;font:400 25px/1.1 Fraunces,serif;letter-spacing:-.01em;overflow-wrap:break-word;text-wrap:balance}}
.route time{{display:block;font-size:13.5px;color:var(--brass);margin:6px 0 8px}}
.route span{{display:block;font-size:15px;line-height:1.5;color:rgba(233,226,212,.86);overflow-wrap:anywhere}}
.route.many b{{font-size:20px}}
.card hr{{margin:24px 0 14px}}
.two{{columns:2;column-gap:24px;margin:0 -10px}}
.two li{{break-inside:avoid}}
.two button{{display:flex;gap:12px;align-items:baseline;font:400 17px/1.25 Fraunces,serif;padding:6px 10px;border-radius:10px;text-wrap:balance;width:100%}}
.two i{{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;flex-shrink:0;width:10px}}
.two span{{min-width:0;overflow-wrap:anywhere}}
.foot{{display:flex;align-items:center;gap:18px;margin-top:22px}}
.foot .sk-go{{width:auto;flex-shrink:0;padding:14px 22px}}
"""
    route = ''.join(f'<li><b>{e(p[0])}</b><time>{p[1]}</time>{"".join(f"<span>{e(x)}</span>" for x in p[2])}</li>' for p in d['places'])
    body = f"""<aside class="card solid" aria-label="{e(d['name'])}"><h2>It asks</h2><p class="sk-q">{e(d['q'])}</p>
<ol class="route{' many' if n > 3 else ''}" aria-label="Where and when">{route}</ol>
<hr><h2>{nideas(d)}</h2>{six(d, 'two')}
<div class="foot"><button class="sk-go">Read it · {about(d)}</button><p class="sk-size">{size(d, False)}</p></div></aside>"""
    return css, body, dict(s=.9, cx=446, cy=456)

# ---------- 5 · Index cards ----------
def d05(d, opened=None):
    n = len(d['ideas'])
    css = """
.deck{position:absolute;left:1010px;top:50%;transform:translateY(-50%);width:386px}
.deck .front{position:relative;z-index:2;background:var(--lift);border:1px solid var(--faint);border-radius:22px;padding:28px 30px 24px;box-shadow:0 30px 60px -30px rgba(0,0,0,.7)}
.deck h2{font-size:13.5px;color:var(--quiet);margin-bottom:12px}
.deck .sk-q{font-size:31px}
.deck .front .sk-meta{margin-top:20px}.deck .front .sk-size{margin-top:6px}
.deck .front h3{font:300 34px/1.08 Fraunces,serif;letter-spacing:-.02em;font-variation-settings:'opsz' 144;overflow-wrap:anywhere}
.deck .front .sum{font:300 20px/1.35 Fraunces,serif;color:rgba(233,226,212,.9);margin-top:12px}
.deck .front .sk-link{display:inline-block;margin-top:14px}
.tabs li{position:relative;margin-top:-16px}
.tabs button{display:flex;gap:14px;align-items:baseline;width:100%;background:var(--lift);border:1px solid var(--faint);border-radius:0 0 18px 18px;padding:26px 30px 11px;font:400 18px/1.25 Fraunces,serif;box-shadow:0 14px 24px -18px rgba(0,0,0,.8)}
.tabs.up li{margin-top:0;margin-bottom:-16px}
.tabs.up button{border-radius:18px 18px 0 0;padding:11px 30px 26px;box-shadow:none}
.tabs i{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;width:10px;flex-shrink:0}
.tabs span{min-width:0;overflow-wrap:anywhere;text-wrap:balance}
.deck .end{margin-top:22px;padding:0 30px}.deck .end .sk-link{display:block;white-space:nowrap;margin-bottom:2px}
@media (hover:hover){.tabs button:hover{background:#1e2b27}}
"""
    def tab(i, z): return f'<li style="z-index:{z}"><button><i>{i+1}</i><span>{e(d["ideas"][i][0])}</span></button></li>'
    def shade(i): return ''
    if opened is None:
        tabs = ''.join(tab(i, n - i) for i in range(n))
        body = f"""<aside class="deck solid" aria-label="{e(d['name'])}"><div class="front"><h2>It asks</h2><p class="sk-q">{e(d['q'])}</p>
<p class="sk-meta">With {meet(d)}</p><p class="sk-size">{where(d)}</p></div>
<ol class="tabs" aria-label="{nideas(d)}">{tabs}</ol>
<div class="end"><button class="sk-link">Read it · {about(d)} ↓</button><p class="sk-size">{size(d, False)}</p></div></aside>"""
    else:
        o = min(opened, n - 1); t = d['ideas'][o]
        up = '<li style="z-index:0"><button><i></i><span style="color:var(--quiet)">' + e(d['q']) + '</span></button></li>' + ''.join(tab(i, i + 1) for i in range(o))
        down = ''.join(tab(i, n - i) for i in range(o + 1, n))
        who = f'<p class="sk-meta" style="margin-top:16px">{names(t[2])}</p>' if t[2] else ''
        body = f"""<aside class="deck solid" aria-label="{e(d['name'])}"><ol class="tabs up">{up}</ol>
<div class="front"><h2>Idea {o+1} of {n}</h2><h3>{e(t[0])}</h3><p class="sum">{e(t[1])}</p>{who}
<button class="sk-link">Read this part ↓</button></div>
<ol class="tabs" start="{o+2}">{down}</ol></aside>"""
    return css, body, {}

# ---------- 6 · One sentence ----------
def d06(d):
    ideas = [f'<button>{e(t[0][0].lower() + t[0][1:])}</button>' for t in d['ideas']]
    il = ideas[0] if len(ideas) == 1 else ', '.join(ideas[:-1]) + ' and ' + ideas[-1]
    places = names(p[0] for p in d['places'])
    when = f"between {d['span'].split('–')[0]} and {d['span'].split('–')[1]}" if '–' in d['span'] else f"in {d['span']}"
    css = """
.say{position:absolute;left:968px;top:50%;transform:translateY(-50%);width:428px}
.say p.s{font:300 29px/1.36 Fraunces,serif;letter-spacing:-.015em;font-variation-settings:'opsz' 100;color:rgba(233,226,212,.62);text-wrap:pretty}
.say p.s+p.s{margin-top:.62em}
.say em{font-style:italic;color:var(--bone)}
.say b{font-weight:300;color:var(--bone)}
.say p.s button{color:var(--bone);display:inline;font:inherit;text-decoration:underline;text-decoration-color:rgba(211,166,108,.75);text-decoration-thickness:1px;text-underline-offset:6px;border-radius:4px;overflow-wrap:anywhere}
.say .end{margin-top:26px;display:flex;align-items:baseline;gap:18px;flex-wrap:wrap}
.say.long p.s{font-size:22px}
@media (hover:hover){.say p.s button:hover{text-decoration-color:var(--bone);text-decoration-thickness:2px}}
"""
    long = sum(len(t[0]) for t in d['ideas']) + len(d['q']) > 260
    body = f"""<aside class="say solid{' long' if long else ''}" aria-label="{e(d['name'])}">
<p class="s"><b>{e(d['name'])}</b> asks: <em>{e(d['q'][0].lower() + d['q'][1:])}</em></p>
<p class="s">{nideas(d)}: {il}.</p>
<p class="s">You'll meet <b>{meet(d)}</b>, {when}, in {places}.</p>
<div class="end"><button class="sk-link">Read on · {about(d)} ↓</button><p class="sk-size">{size(d, False)}</p></div></aside>"""
    return css, body, {}

# ---------- 7 · The page ----------
def d07(d):
    css = """
.sheet{position:absolute;left:944px;top:44px;width:452px;min-height:960px;background:#e9e2d4;color:#18211f;border-radius:6px 6px 0 0;padding:46px 44px 0;box-shadow:0 50px 90px -30px rgba(0,0,0,.75),0 0 0 1px rgba(0,0,0,.2)}
.sheet .k{font-size:13.5px;color:rgba(24,33,31,.7)}
.sheet h1{font:300 50px/1 Fraunces,serif;letter-spacing:-.03em;font-variation-settings:'opsz' 144;margin:8px 0 16px;overflow-wrap:anywhere}
.sheet .asks{font:300 23px/1.25 Fraunces,serif;font-style:italic;letter-spacing:-.01em;text-wrap:balance}
.sheet hr{border:0;border-top:1px solid rgba(24,33,31,.22);margin:24px 0 14px}
.sheet ol{margin:0 -10px}
.sheet ol button{display:flex;gap:14px;align-items:baseline;width:100%;font:400 19px/1.25 Fraunces,serif;padding:6px 10px;border-radius:8px;text-wrap:balance}
.sheet ol i{font:600 12.5px/1 'Hanken Grotesk',sans-serif;color:#7d5a26;font-style:normal;width:10px;flex-shrink:0}
.sheet ol span{min-width:0;overflow-wrap:anywhere}
.sheet .m{font-size:15px;line-height:1.5;color:rgba(24,33,31,.86)}
.sheet .z{font-size:13.5px;color:rgba(24,33,31,.7);margin-top:5px}
.sheet h2{font:400 22px/1.2 Fraunces,serif;margin:0 0 8px}
.sheet .b{font-size:16.5px;line-height:1.6;color:rgba(24,33,31,.9)}
.sheet button:focus-visible{outline-color:#7d5a26}
@media (hover:hover){.sheet ol button:hover{background:rgba(24,33,31,.07)}}
"""
    body = f"""<article class="sheet solid" aria-label="{e(d['name'])}"><p class="k">{where(d)}</p><h1>{e(d['name'])}</h1><p class="asks">{e(d['q'])}</p>
<hr><ol aria-label="{nideas(d)}">{''.join(f'<li><button><i>{i+1}</i><span>{e(t[0])}</span></button></li>' for i, t in enumerate(d['ideas']))}</ol>
<hr><p class="m">With {meet(d)}</p><p class="z">{size(d)}</p>
<hr style="margin-bottom:22px"><h2>In one minute</h2><p class="b">{e(d['lede'])}</p></article>"""
    return css, body, {}

# ---------- 8 · The cast ----------
def d08(d, picked=None):
    css = """
.card{padding:28px 30px 22px}
.card .sk-q{font-size:24px;margin-bottom:24px}
.cast{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 6px;margin:4px -8px 0}
.cast button{display:flex;flex-direction:column;align-items:center;text-align:center;width:100%;padding:6px 2px;border-radius:12px;min-width:0}
.cast i{width:62px;height:62px;border-radius:50%;border:1.3px solid var(--brass);display:grid;place-items:center;font:300 23px/1 Fraunces,serif;font-style:normal;letter-spacing:.01em;color:var(--bone);margin-bottom:10px;background:radial-gradient(circle at 34% 28%,rgba(233,226,212,.1),rgba(233,226,212,0) 70%)}
.cast b{font:400 16.5px/1.2 Fraunces,serif;max-width:100%;overflow-wrap:break-word;hyphens:auto}
.cast.many{gap:12px 6px}.cast.many i{width:44px;height:44px;font-size:17px;margin-bottom:7px}.cast.many b{font-size:14.5px}.cast.many small{font-size:12.5px}
.cast small{font-size:13px;color:var(--quiet);margin-top:3px;line-height:1.3}
.cast .on i{background:var(--brass);color:#1a1408;box-shadow:0 0 0 6px rgba(211,166,108,.16)}
.cast.pick li:not(.on){opacity:.5}
.card hr{margin:20px 0 12px}
.card .sk-six button{font-size:16.5px;padding:5px 12px}
.sk-six.pick li:not(.cur){opacity:.34}
.sk-six.pick li:not(.cur) i{color:var(--bone)}
.card .sk-go{margin-top:18px}.card .sk-size{text-align:center;margin-top:10px}
@media (hover:hover){.cast button:hover i{box-shadow:0 0 0 5px rgba(233,226,212,.1)}}
"""
    cast = ''.join(f'<li class="{"on" if p[0] == picked else ""}"><button aria-pressed="{str(p[0] == picked).lower()}"><i aria-hidden="true">{p[1]}</i><b>{e(p[0])}</b><small>{e(p[2])} · {p[3]}</small></button></li>' for p in d['people'])
    if picked:
        hit = [i for i, t in enumerate(d['ideas']) if picked in t[2]]
        ideas = '<ol class="sk-six pick">' + ''.join(f'<li{" class=cur" if i in hit else ""}><button><i>{i+1}</i><span>{e(t[0])}</span></button></li>' for i, t in enumerate(d['ideas'])) + '</ol>'
        head = f"{e(picked)} speaks in {len(hit)} of the {len(d['ideas'])} ideas" if len(d['ideas']) > 1 else f"{e(picked)} speaks in this idea"
    else:
        ideas, head = six(d), f"On {nideas(d).lower()}"
    body = f"""<aside class="card solid" aria-label="{e(d['name'])}"><h2>It asks</h2><p class="sk-q">{e(d['q'])}</p>
<h2>You'll meet</h2><ul class="cast{' pick' if picked else ''}{' many' if len(d['people']) > 6 else ''}">{cast}</ul>
<hr><h2>{head}</h2>{ideas}
<button class="sk-go">Read it · {about(d)}</button><p class="sk-size">{where(d)} · {pl(d['works'], 'key work')}</p></aside>"""
    return css, body, {}

# ---------- 9 · Unfold ----------
def d09(d, step=0):
    css = """
.fold{position:absolute;left:968px;top:50%;transform:translateY(-50%);width:428px}
.fold .lab{font-size:13.5px;color:var(--quiet);margin-bottom:14px}
.fold .sk-q{font-size:50px;line-height:1.06;letter-spacing:-.03em}
.fold.long .sk-q{font-size:34px}
.fold.open .sk-q{font-size:27px;line-height:1.14;letter-spacing:-.02em}
.fold .next{display:flex;align-items:center;gap:12px;margin-top:34px;font:500 15.5px/1.2 'Hanken Grotesk',sans-serif;color:var(--brass);padding:10px 0;border-radius:8px}
.fold .next i{width:9px;height:9px;border-radius:50%;background:var(--brass);box-shadow:0 0 0 5px rgba(211,166,108,.16)}
.fold .pips{display:flex;gap:7px;margin-top:20px}
.fold .pips i{width:22px;border-top:1.5px solid rgba(233,226,212,.28)}.fold .pips i.on{border-color:var(--bone)}
.fold section{border-top:1px solid var(--faint);margin-top:20px;padding-top:14px}
.fold section h2{font-size:13.5px;color:var(--quiet);margin-bottom:6px}
.fold .sk-six button{font-size:19px;padding:6px 12px}
.fold .sk-size{margin-top:4px}
"""
    long = len(d['q']) > 70
    if step == 0:
        body = f"""<aside class="fold solid{' long' if long else ''}" aria-label="{e(d['name'])}"><p class="lab">{e(d['name'])} asks</p><p class="sk-q">{e(d['q'])}</p>
<button class="next"><i></i>Its {nideas(d).lower()}</button><div class="pips" aria-label="Step 1 of 3"><i class="on"></i><i></i><i></i></div></aside>"""
    else:
        body = f"""<aside class="fold open solid" aria-label="{e(d['name'])}"><p class="lab">{e(d['name'])} asks</p><p class="sk-q">{e(d['q'])}</p>
<section><h2>{nideas(d)}</h2>{six(d)}</section>
<section><h2>You'll meet</h2><p class="sk-meta">{meet(d)}</p><p class="sk-size">{where(d)}</p></section>
<button class="next" style="margin-top:22px"><i></i>Read it · {about(d)}</button><p class="sk-size">{size(d, False)}</p></aside>"""
    return css, body, {}

# ---------- 10 · The horizon ----------
def d10(d):
    css = """
.ask{position:absolute;left:800px;top:120px;width:560px;height:440px;display:flex;flex-direction:column;justify-content:center}
.ask .lab{font-size:13.5px;color:var(--quiet);margin-bottom:14px}
.ask .sk-q{font-size:52px;line-height:1.05;letter-spacing:-.03em}
.ask.long .sk-q{font-size:36px}
.hz{position:absolute;left:0;right:0;bottom:0;background:var(--lift);border-top:1px solid var(--faint);border-radius:28px 28px 0 0;padding:26px 44px 0;box-shadow:0 -40px 80px -30px rgba(0,0,0,.6);display:grid;grid-template-columns:1.9fr 1fr 1fr;gap:0 48px}
.hz h2{font-size:13.5px;color:var(--quiet);margin-bottom:8px}
.hz .two{columns:2;column-gap:28px;margin:0 -12px}
.hz .two li{break-inside:avoid}
.hz .two button{display:flex;gap:14px;align-items:baseline;width:100%;font:400 20px/1.25 Fraunces,serif;padding:7px 12px;border-radius:10px;text-wrap:balance}
.hz .two i{font:500 12.5px/1 'Hanken Grotesk',sans-serif;color:var(--brass);font-style:normal;width:10px;flex-shrink:0}
.hz .two span{min-width:0;overflow-wrap:anywhere}
.hz .sk-meta{font-size:16px;line-height:1.55}
.hz .sk-go{margin-top:6px}.hz .sk-size{margin-top:10px}
.hz .peek{grid-column:1/-1;border-top:1px solid var(--faint);margin-top:20px;padding:14px 0 0;height:50px;overflow:hidden;font:400 22px/1.2 Fraunces,serif;color:rgba(233,226,212,.5);-webkit-mask-image:linear-gradient(#000 30%,transparent)}
@media (hover:hover){.hz .two button:hover{background:rgba(233,226,212,.07)}}
"""
    body = f"""<div class="ask solid{' long' if len(d['q']) > 70 else ''}"><p class="lab">{e(d['name'])} asks</p><p class="sk-q">{e(d['q'])}</p></div>
<aside class="hz solid" aria-label="{e(d['name'])} at a glance"><div><h2>{nideas(d)}</h2>{six(d, 'two')}</div>
<div><h2>You'll meet</h2><p class="sk-meta">{meet(d)}</p><p class="sk-size">{where(d)}</p></div>
<div><h2>{size(d, False)}</h2><button class="sk-go">Read it · {about(d)}</button></div>
<p class="peek">In one minute</p></aside>"""
    return css, body, dict(s=.76, cx=400, cy=326)

DIRS = [
    ('01-card-improved', 'The card, improved', 'Baseline: same globe, same card, re-ordered as question, six ideas, people, size', d01, None),
    ('02-knot-opens', 'The knot opens', 'On the globe: you zoom into the school and its knot opens into six threads, one per idea', d02, None),
    ('03-spine', 'The spine', 'A brass thread with six beads, no box; it stays beside the article as "you are here"', d03, ('03b-spine-reading', 'reading, idea 3', d03b)),
    ('04-journey', 'The journey', 'Where and when lead: three stops on a thread, Denmark, Germany, France', d04, None),
    ('05-index-cards', 'Index cards', 'A deck: the question on top, six idea cards peeking out below; pull one to the front', d05, ('05b-index-cards-open', 'idea 3 pulled', lambda d: d05(d, d['open']))),
    ('06-one-sentence', 'One sentence', 'Bold: no card, no list. The skeleton is three plain sentences in large type', d06, None),
    ('07-page', 'The page', 'Bold: a sheet of paper on the dark table. The skeleton is the title page of the article itself', d07, None),
    ('08-cast', 'The cast', 'People lead: six faces to meet; pick one and their ideas light up', d08, ('08b-cast-picked', 'Beauvoir picked', lambda d: d08(d, d['pick']))),
    ('09-unfold', 'Unfold', 'Staged in time, not space: the question alone first, then ideas, then people', d09, ('09b-unfold-open', 'unfolded', lambda d: d09(d, 1))),
    ('10-horizon', 'The horizon', 'A low sheet along the bottom; the question stands big beside the globe; the article rises from it', d10, None),
]

def write(path, title, d, fn):
    css, body, g = fn(d)
    path.write_text(page(title, d, css, body, **g))

if __name__ == '__main__':
    for slug, name, axis, fn, b in DIRS:
        write(OUT / f'{slug}.html', name, REAL, fn)
        write(HERE / 'checks' / f'{slug}-worst.html', name + ' worst', WORST, fn)
        write(HERE / 'checks' / f'{slug}-one.html', name + ' one', ONE, fn)
        if b:
            write(OUT / f'{b[0]}.html', name + ' · ' + b[1], REAL, b[2])
            write(HERE / 'checks' / f'{b[0]}-worst.html', name + ' worst', WORST, b[2])
    cells = ''
    for i, (slug, name, axis, fn, b) in enumerate(DIRS):
        inset = f'<a class="then" href="{b[0]}.html"><img src="{b[0]}.png" alt="{e(name)}: {e(b[1])}"><span>then: {e(b[1])}</span></a>' if b else ''
        cells += f'<figure><a href="{slug}.html"><img src="{slug}.png" alt="{e(name)}"></a>{inset}<figcaption><b>{i+1} · {e(name)}</b><span>{e(axis)}</span></figcaption></figure>'
    (OUT / 'contact-sheet.html').write_text(f"""<!doctype html><html lang="en" style="color-scheme:dark"><head><meta charset="utf-8"><title>Meander · skeleton round 2 · ten directions</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400&family=Hanken+Grotesk:wght@400;500&display=swap" rel="stylesheet">
<style>*{{box-sizing:border-box;margin:0}}body{{background:#0b1211;color:#e9e2d4;font:400 16px/1.45 'Hanken Grotesk',sans-serif;padding:44px 40px 60px;width:1760px;-webkit-font-smoothing:antialiased}}
h1{{font:300 40px/1.1 Fraunces,serif;letter-spacing:-.02em}}p.i{{color:rgba(233,226,212,.72);max-width:900px;margin:10px 0 34px;font-size:17px}}
.g{{display:grid;grid-template-columns:1fr 1fr;gap:40px 32px}}figure{{position:relative}}
figure>a>img{{display:block;width:100%;border-radius:14px;border:1px solid rgba(233,226,212,.14)}}
.then{{position:absolute;left:14px;top:calc(100% - 62px);transform:translateY(-100%);width:30%;text-decoration:none}}.then img{{display:block;width:100%;border-radius:8px;border:1px solid rgba(233,226,212,.3);box-shadow:0 14px 30px rgba(0,0,0,.6)}}
.then span{{position:absolute;left:8px;bottom:6px;font-size:12.5px;color:#e9e2d4;background:rgba(11,18,17,.8);padding:2px 7px;border-radius:5px}}
figcaption{{margin-top:12px;display:flex;gap:14px;align-items:baseline}}figcaption b{{font:400 23px/1.2 Fraunces,serif;white-space:nowrap}}figcaption span{{color:rgba(233,226,212,.76);font-size:16px}}</style></head>
<body><h1>Skeleton, round 2: ten directions</h1><p class="i">What you see after clicking Existentialism on the globe. The globe stays in every one. Real content from the pilot. Small insets show the second frame where a direction has one.</p>
<div class="g">{cells}</div></body></html>""")
    print('built')
