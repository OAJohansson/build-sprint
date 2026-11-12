// Shared page wrapper and the small runtime that draws threads between nodes and (with #check) reports collisions.
export const runtime = `
(function(){
const W=window.WEB, scrEl=document.querySelector('.screen'), svg=document.querySelector('svg.threads');
if(!W||!svg) return;
const NS='http://www.w3.org/2000/svg';
const el=id=>scrEl.querySelector('[data-id="'+id+'"]');
function box(e){const s=scrEl.getBoundingClientRect(),r=e.getBoundingClientRect();return {x:r.left-s.left,y:r.top-s.top,w:r.width,h:r.height}}
function pathFor(a,b){
  const A=el(a),B=el(b);
  if(W.mode==='word'){
    const ra=box(A),rb=box(B);let L=ra,R=rb;if(ra.x>rb.x){L=rb;R=ra}
    const gap=R.x-(L.x+L.w);
    if(gap>24){const x1=L.x+L.w+7,y1=L.y+L.h*.56,x2=R.x-7,y2=R.y+R.h*.56,dx=(x2-x1)*.5;return 'M'+x1+' '+y1+'C'+(x1+dx)+' '+y1+' '+(x2-dx)+' '+y2+' '+x2+' '+y2}
    let T=ra,Bm=rb;if(ra.y>rb.y){T=rb;Bm=ra}
    // stacked words: a soft bracket down their left side
    const x1=T.x-7,y1=T.y+T.h*.56,x2=Bm.x-7,y2=Bm.y+Bm.h*.56,k=30+(y2-y1)*.12;
    return 'M'+x1+' '+y1+'C'+(x1-k)+' '+y1+' '+(x2-k)+' '+y2+' '+x2+' '+y2;
  }
  let x1=+A.dataset.x,y1=+A.dataset.y,x2=+B.dataset.x,y2=+B.dataset.y;const r1=+A.dataset.r+(W.pad||3),r2=+B.dataset.r+(W.pad||3);
  const dx=x2-x1,dy=y2-y1,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;
  const mx=(x1+x2)/2,my=(y1+y2)/2;let cx,cy;
  const key=a+'-'+b, ov=(W.bows||{})[key];
  if(W.mode==='sag'){const k=ov!==undefined?ov:.09;cx=mx;cy=my+len*k}
  else{const k=ov!==undefined?ov:.13;let nx=-uy,ny=ux;const C=W.centre;if((mx+nx-C[0])**2+(my+ny-C[1])**2<(mx-nx-C[0])**2+(my-ny-C[1])**2){nx=-nx;ny=-ny}cx=mx+nx*len*k;cy=my+ny*len*k}
  // trim at the node edges, heading towards the control point
  const a1=Math.atan2(cy-y1,cx-x1),a2=Math.atan2(cy-y2,cx-x2);
  x1+=Math.cos(a1)*r1;y1+=Math.sin(a1)*r1;x2+=Math.cos(a2)*r2;y2+=Math.sin(a2)*r2;
  return 'M'+x1.toFixed(1)+' '+y1.toFixed(1)+'Q'+cx.toFixed(1)+' '+cy.toFixed(1)+' '+x2.toFixed(1)+' '+y2.toFixed(1);
}
function draw(){
  svg.querySelectorAll('path.th').forEach(p=>p.remove());
  const made=[];
  W.links.forEach(l=>{const p=document.createElementNS(NS,'path');p.setAttribute('d',pathFor(l[0],l[1]));p.setAttribute('class','th '+l[2]);p.dataset.a=l[0];p.dataset.b=l[1];made.push(p)});
  // quiet threads first, the important ones on top
  made.sort((p,q)=>(/focus|walked/.test(p.getAttribute('class'))?1:0)-(/focus|walked/.test(q.getAttribute('class'))?1:0)).forEach(p=>svg.appendChild(p));
  if(W.after) W.after(box,el,svg);
  if(location.hash==='#check') check();
}
function check(){
  const out=[];const labels=[...scrEl.querySelectorAll('.lb,.solid')].map(e=>({e,b:box(e),id:(e.closest('[data-id]')||e).dataset.id||e.className}));
  const circs=[...scrEl.querySelectorAll('.circ')].map(e=>({id:e.dataset.id,x:+e.dataset.x,y:+e.dataset.y,r:+e.dataset.r}));
  for(let i=0;i<circs.length;i++)for(let j=i+1;j<circs.length;j++){const a=circs[i],b=circs[j];if(Math.hypot(a.x-b.x,a.y-b.y)<a.r+b.r+6)out.push('DISC '+a.id+' x DISC '+b.id)}
  circs.forEach(c=>labels.forEach(L=>{if(L.id===c.id)return;const b=L.b,nx=Math.max(b.x,Math.min(c.x,b.x+b.w)),ny=Math.max(b.y,Math.min(c.y,b.y+b.h));if(Math.hypot(nx-c.x,ny-c.y)<c.r+3)out.push('DISC '+c.id+' x LABEL '+L.id)}));
  svg.querySelectorAll('path').forEach(p=>{const n=p.getTotalLength();const hit=new Set();
    for(let s=0;s<=n;s+=3){const pt=p.getPointAtLength(s);labels.forEach(L=>{if(W.mode==='word'&&(L.id===p.dataset.a||L.id===p.dataset.b))return;if(p.dataset.skip&&p.dataset.skip.includes(L.id))return;const b=L.b,m=2;if(pt.x>b.x-m&&pt.x<b.x+b.w+m&&pt.y>b.y-m&&pt.y<b.y+b.h+m)hit.add(L.id)});circs.forEach(c=>{if(c.id===p.dataset.a||c.id===p.dataset.b)return;if(Math.hypot(pt.x-c.x,pt.y-c.y)<c.r+2)hit.add('disc '+c.id)})}
    hit.forEach(h=>out.push('THREAD '+(p.dataset.a||p.getAttribute('class'))+'-'+(p.dataset.b||'')+' x LABEL '+h))});
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i].b,b=labels[j].b;if(labels[i].e.contains(labels[j].e)||labels[j].e.contains(labels[i].e))continue;if(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h)out.push('LABEL '+labels[i].id+' x LABEL '+labels[j].id)}
  labels.forEach(L=>{const b=L.b;if(b.x<8||b.y<8||b.x+b.w>1432||b.y+b.h>892)out.push('OFFSCREEN '+L.id+' '+Math.round(b.x)+','+Math.round(b.y)+' '+Math.round(b.w)+'x'+Math.round(b.h))});
  scrEl.querySelectorAll('*').forEach(e=>{if(e.scrollWidth>e.clientWidth+1&&getComputedStyle(e).overflow!=='visible'&&e.clientWidth>0)out.push('OVERFLOW '+(e.className||e.tagName))});
  const pre=document.createElement('pre');pre.id='chk';pre.textContent='CHECK\\n'+out.join('\\n')+'\\nEND';document.body.appendChild(pre);
}
(document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>setTimeout(draw,60));
})();`;

export function page({ title, fonts, css, body, web, extra = '', theme, dark, w = 1440, h = 900 }) {
  return `<!doctype html>
<html lang="en"${dark ? ' style="color-scheme:dark"' : ''}><head><meta charset="utf-8">
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
svg.threads path{fill:none;stroke-linecap:round}
.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}
#chk{display:none}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
${css}
</style></head>
<body>
${body}
${web ? `<script>window.WEB=${web};${extra}</script><script>${runtime}</script>` : ''}
</body></html>`;
}
// class for a link given the focus and the visited set
export function linkClass([a, b, t], visited) {
  const c = [t];
  if (a === 'exi' || b === 'exi') c.push('focus');
  if (visited.has(a) && visited.has(b)) c.push('walked');
  return c.join(' ');
}
