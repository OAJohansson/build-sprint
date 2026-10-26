// Pixel checks on each sticker + the contact sheet on cream #FFF4E0.
// Checks: corners transparent; share of the cut edge (opaque pixels touching transparency) that is
// dark (outline kept) vs light (white halo / border eaten); opaque light pixels left in the outer
// 3% frame (leftover background).
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";
const here = new URL("./", import.meta.url);
const { results } = JSON.parse(await readFile(new URL("results.json", here), "utf8"));
const rows = [];
for (const r of results) {
  if (r.final !== "ready") continue;
  const file = new URL(`out/${r.key}-sticker.webp`, here).pathname;
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const a = (x, y) => data[(y * w + x) * 4 + 3];
  const corners = [a(0, 0), a(w - 1, 0), a(0, h - 1), a(w - 1, h - 1)].every((v) => v === 0);
  let edge = 0, dark = 0, light = 0, opaque = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * 4;
    if (data[i + 3] < 200) continue;
    opaque++;
    if (!(a(x - 1, y) < 50 || a(x + 1, y) < 50 || a(x, y - 1) < 50 || a(x, y + 1) < 50)) continue;
    edge++;
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum < 110) dark++; else if (lum > 200) light++;
  }
  rows.push({ key: r.key, size: `${w}x${h}`, cornersTransparent: corners, opaqueShare: +(opaque / (w * h)).toFixed(2), edgeDark: +(dark / edge).toFixed(2), edgeLight: +(light / edge).toFixed(2) });
}
console.table(rows);
await writeFile(new URL("pixel-checks.json", here), JSON.stringify(rows, null, 2));

// Contact sheet: each column = photo over sticker, label under.
const cell = 260, pad = 20, lab = 28;
const cols = 5, list = results.filter((r) => r.final === "ready");
const rowsN = Math.ceil(list.length / cols);
const W = cols * (cell + pad) + pad, H = rowsN * (cell * 2 + lab + pad * 2) + pad;
const comps = [];
for (const [n, r] of list.entries()) {
  const x = pad + (n % cols) * (cell + pad), y = pad + Math.floor(n / cols) * (cell * 2 + lab + pad * 2);
  if (r.photoStatus === 200) comps.push({ input: await sharp(new URL(`out/${r.key}-photo.webp`, here).pathname).resize(cell, cell, { fit: "cover" }).toBuffer(), left: x, top: y });
  else comps.push({ input: Buffer.from(`<svg width="${cell}" height="${cell}"><rect width="100%" height="100%" fill="#EADBC0"/><text x="50%" y="50%" font-family="sans-serif" font-size="18" text-anchor="middle" fill="#3B1F1A">no photo</text></svg>`), left: x, top: y });
  comps.push({ input: await sharp(new URL(`out/${r.key}-sticker.webp`, here).pathname).resize(cell, cell, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer(), left: x, top: y + cell + pad / 2 });
  comps.push({ input: Buffer.from(`<svg width="${cell}" height="${lab}"><text x="0" y="20" font-family="sans-serif" font-size="16" fill="#3B1F1A">${r.key} · ${r.seconds}s</text></svg>`), left: x, top: y + cell * 2 + pad / 2 });
}
const sheet = new URL(`../../../../docs/products/10-magpie/design/sticker-eval/${process.env.SHEET ?? "contact-sheet.webp"}`, here).pathname;
await sharp({ create: { width: W, height: H, channels: 3, background: "#FFF4E0" } }).composite(comps).webp({ quality: 85 }).toFile(sheet);
console.log("sheet", sheet, W, H);
