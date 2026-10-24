import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const BAKE = process.argv[2], OUT = process.argv[3];
const files = ["01","02","03","04","05"].map(n=>`lyria/${n}.mp3`);
const html = `<!doctype html><script>
(async()=>{for(const f of ${JSON.stringify(files)}){const b=await (await fetch('/audio/'+f)).arrayBuffer();
const ctx=new OfflineAudioContext(2,1,44100);const ab=await ctx.decodeAudioData(b);
const n=ab.length,ch=ab.numberOfChannels;const out=new Float32Array(n*2);
const L=ab.getChannelData(0),R=ch>1?ab.getChannelData(1):L;for(let i=0;i<n;i++){out[2*i]=L[i];out[2*i+1]=R[i];}
await fetch('/save/'+f.replace(/\\//g,'_')+'?sr='+ab.sampleRate+'&ch='+ch,{method:'POST',body:out.buffer});}
await fetch('/done',{method:'POST'});})().catch(e=>fetch('/err',{method:'POST',body:String(e)}));
</script>`;
const srv = http.createServer((req,res)=>{
  const u = new URL(req.url,"http://x");
  if (u.pathname==="/") { res.end(html); return; }
  if (u.pathname.startsWith("/audio/")) { res.setHeader("content-type","audio/mpeg"); res.end(fs.readFileSync(path.join(BAKE,u.pathname.slice(7)))); return; }
  const chunks=[]; req.on("data",c=>chunks.push(c)); req.on("end",()=>{
    const body=Buffer.concat(chunks);
    if (u.pathname.startsWith("/save/")) { const name=u.pathname.slice(6); fs.writeFileSync(path.join(OUT,name+".f32"),body); fs.writeFileSync(path.join(OUT,name+".json"),JSON.stringify({sr:+u.searchParams.get("sr"),ch:+u.searchParams.get("ch"),interleaved:2})); console.log("saved",name,body.length); }
    if (u.pathname==="/err") console.log("ERR",body.toString());
    res.end("ok");
    if (u.pathname==="/done"||u.pathname==="/err") { console.log("done"); setTimeout(()=>process.exit(0),200); }
  });
});
srv.listen(8765,()=>console.log("listening"));
