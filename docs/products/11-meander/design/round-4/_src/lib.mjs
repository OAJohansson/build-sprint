// Page wrapper and the small runtime that places labels (greedy, eight candidates per school) and, with #check, reports collisions.
export const runtime = `
(function(){
const S=document.querySelector('.screen'),W=window.WEB;if(!S||!W)return;
function run(){
  const sb=S.getBoundingClientRect();
  const rectOf=e=>{const r=e.getBoundingClientRect();return{x:r.left-sb.left,y:r.top-sb.top,w:r.width,h:r.height,id:e.dataset.id||e.className}};
  const fixed=[...S.querySelectorAll('.solid')].map(rectOf);
  const nodes=[...S.querySelectorAll('.n')].map(e=>({e,id:e.dataset.id,lb:e.querySelector('.lb'),x:+e.dataset.x,y:+e.dataset.y,r:+e.dataset.r,pref:+e.dataset.pref,ord:+e.dataset.ord}));
  const pts=[];S.querySelectorAll('svg.threads path.th').forEach(p=>{const n=p.getTotalLength(),w=p.classList.contains('focus')?14:1;for(let s=0;s<=n;s+=4){const q=p.getPointAtLength(s);pts.push([q.x,q.y,w,p.dataset.a+'-'+p.dataset.b])}});
  const placed=[];
  const hit=(a,b,pad)=>a.x<b.x+b.w+pad&&b.x<a.x+a.w+pad&&a.y<b.y+b.h+pad&&b.y<a.y+a.h+pad;
  nodes.slice().sort((a,b)=>a.ord-b.ord).forEach(n=>{
    const w=n.lb.offsetWidth,h=n.lb.offsetHeight;let best=null;
    const cand=[];[9,20,32].forEach((gap,gi)=>[0,30,-30,60,-60,90,-90,120,-120,150,-150,180].forEach((d,i)=>cand.push([d,n.r+gap,i*2+gi*9])));
    cand.forEach(([d,g,base])=>{const i=base/2;
      const a=(n.pref+d)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),ax=n.x+g*c,ay=n.y+g*s;
      const x=c>.38?ax:c<-.38?ax-w:ax-w/2,y=s>.38?ay:s<-.38?ay-h:ay-h/2,R={x,y,w,h};
      let cost=base;
      placed.forEach(p=>{if(hit(R,p,6))cost+=5000});fixed.forEach(p=>{if(hit(R,p,8))cost+=5000});
      nodes.forEach(m=>{if(m!==n){const nx=Math.max(x,Math.min(m.x,x+w)),ny=Math.max(y,Math.min(m.y,y+h));const dm=Math.hypot(nx-m.x,ny-m.y);if(dm<m.r+8)cost+=4500;else if(dm<g+10)cost+=2500}});
      [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(k=>{if(Math.hypot(k[0]-W.c[0],k[1]-W.c[1])>W.R-4)cost+=450});
      if(x<8||y<8||x+w>W.w-8||y+h>W.h-8)cost+=3000;
      for(const q of pts){if(q[0]>x-3&&q[0]<x+w+3&&q[1]>y-3&&q[1]<y+h+3)cost+=7*q[2]}
      if(!best||cost<best.cost)best={cost,x,y,al:c>.38?'flex-start':c<-.38?'flex-end':'center',ta:c>.38?'left':c<-.38?'right':'center'}});
    n.lb.style.left=(best.x-n.x)+'px';n.lb.style.top=(best.y-n.y)+'px';n.lb.style.alignItems=best.al;n.lb.style.textAlign=best.ta;n.lb.style.visibility='visible';
    placed.push({x:best.x,y:best.y,w,h,id:n.id});
  });
  // a thread never draws through a label: labels knock out whatever passes behind them
  const ko=S.querySelector('#ko');if(ko)placed.concat([...S.querySelectorAll('.kox')].map(rectOf)).forEach(p=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',p.x-5);r.setAttribute('y',p.y-3);r.setAttribute('width',p.w+10);r.setAttribute('height',p.h+6);r.setAttribute('rx',6);r.setAttribute('fill','#000');ko.appendChild(r)});
  if(location.hash==='#check'){
    const out=[];
    placed.forEach(p=>{const t=new Set();pts.forEach(q=>{if(q[0]>p.x-1&&q[0]<p.x+p.w+1&&q[1]>p.y-1&&q[1]<p.y+p.h+1)t.add(q[3])});t.forEach(k=>out.push('THREAD '+k+' x LABEL '+p.id));
      fixed.forEach(f=>{if(hit(p,f,0))out.push('LABEL '+p.id+' x '+f.id)});
      if(p.x<8||p.y<8||p.x+p.w>W.w-8||p.y+p.h>W.h-8)out.push('OFFSCREEN '+p.id);
      if([[p.x,p.y],[p.x+p.w,p.y],[p.x,p.y+p.h],[p.x+p.w,p.y+p.h]].some(k=>Math.hypot(k[0]-W.c[0],k[1]-W.c[1])>W.R+2))out.push('OUTSIDE GLOBE '+p.id);
      nodes.forEach(m=>{if(m.id!==p.id){const nx=Math.max(p.x,Math.min(m.x,p.x+p.w)),ny=Math.max(p.y,Math.min(m.y,p.y+p.h));if(Math.hypot(nx-m.x,ny-m.y)<m.r+1)out.push('LABEL '+p.id+' x DOT '+m.id)}})});
    for(let i=0;i<placed.length;i++)for(let j=i+1;j<placed.length;j++)if(hit(placed[i],placed[j],0))out.push('LABEL '+placed[i].id+' x LABEL '+placed[j].id);
    fixed.filter(f=>!/title|sat/.test(f.id)).forEach(f=>{const t=new Set();pts.forEach(q=>{if(q[0]>f.x&&q[0]<f.x+f.w&&q[1]>f.y&&q[1]<f.y+f.h)t.add(q[3])});t.forEach(k=>out.push('THREAD '+k+' x '+f.id))});
    const pre=document.createElement('pre');pre.id='chk';pre.textContent='CHECK\\n'+out.join('\\n')+'\\nEND';document.body.appendChild(pre);
  }
}
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(run,60));
})();`;
export function page({ title, fonts, css, body, web, theme, w = 1440, h = 900 }) {
  return `<!doctype html>
<html lang="en" style="color-scheme:dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="${theme}">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?${fonts.map(x => 'family=' + x).join('&')}&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:${theme}}
ul,ol{list-style:none}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer;text-align:inherit;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
h1,h2,h3{font-weight:inherit;font-size:inherit;text-wrap:balance}
p{text-wrap:pretty}
.screen{width:${w}px;height:${h}px;position:relative;overflow:hidden;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
svg.threads{position:absolute;inset:0;width:${w}px;height:${h}px;pointer-events:none}
svg.threads path{fill:none;stroke-linecap:round;stroke-linejoin:round}
#chk{display:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
${css}
</style></head>
<body>
${body}
${web ? `<script>window.WEB=${web};</script><script>${runtime}</script>` : ''}
</body></html>`;
}
