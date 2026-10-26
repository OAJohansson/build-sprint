// Outer-edge check: 32 rays from the centre; on each, find the outermost opaque pixel (alpha>=200)
// and look up to 4 px inward. "dark" = a pixel with luminance < 90 there (the bold outline is the
// edge). Otherwise record the darkest luminance in that band: what keeps the cut-out from eating
// the white border is a pixel <= 225 (the flood fill's threshold).
import sharp from "sharp";
const dir = process.argv[2] ?? "out";
const keys = ["01","02","03","04","05","06","07","08","09","10","11","12","E1","E2","E3"];
const rows = [];
for (const k of keys) {
  const { data, info } = await sharp(new URL(`${dir}/${k}-sticker.webp`, import.meta.url).pathname).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info, cx = w / 2, cy = h / 2;
  let dark = 0, minLight = 255;
  for (let r = 0; r < 32; r++) {
    const t = (r / 32) * 2 * Math.PI, dx = Math.cos(t), dy = Math.sin(t);
    let last = -1;
    for (let s = 0; s < w; s++) { const x = Math.round(cx + dx * s), y = Math.round(cy + dy * s); if (x < 0 || y < 0 || x >= w || y >= h) break; if (data[(y * w + x) * 4 + 3] >= 200) last = s; }
    let lo = 255;
    for (let s = last; s > last - 5 && s >= 0; s--) { const x = Math.round(cx + dx * s), y = Math.round(cy + dy * s), i = (y * w + x) * 4; lo = Math.min(lo, 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]); }
    if (lo < 90) dark++; else minLight = Math.min(minLight, Math.round(lo));
  }
  rows.push({ key: k, darkOuterEdge: `${dark}/32`, darkestInLightRays: dark === 32 ? "-" : minLight });
}
console.table(rows);
