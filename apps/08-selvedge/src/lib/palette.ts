// A board's palette, read from its photos in the browser (no AI): every photo shrunk to a few
// dozen pixels, the colours counted in coarse buckets, then the most common ones that are clearly
// different from each other. Greys, near-white, near-black and the edges of each photo count for
// less, so the clothes win over walls, pavements and studio backdrops (first try picked only
// greys, 22 Oct).

type RGB = [number, number, number];
const hex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const dist = (a: RGB, b: RGB) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function load(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function paletteFrom(srcs: string[], count = 6, fallback: string[] = []): Promise<string[]> {
  const size = 36;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback.slice(0, count);
  const buckets = new Map<number, { n: number; sum: RGB }>();
  for (const img of await Promise.all(srcs.map(load))) {
    if (!img) continue;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
    const d = ctx.getImageData(0, 0, size, size).data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const light = (r + g + b) / 3, chroma = Math.max(r, g, b) - Math.min(r, g, b);
      // The outfit is usually in the middle; walls, pavements and backdrops are grey or at the edges.
      const px = (i / 4) % size, py = Math.floor(i / 4 / size);
      const centre = 1 - Math.min(1, Math.hypot(px - size / 2, py - size / 2) / (size * 0.6));
      const weight = (light > 235 || light < 18 ? 0.2 : 1) * (chroma < 16 ? 0.15 : chroma < 32 ? 0.6 : 1) * (0.25 + centre);
      const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
      const cell = buckets.get(key) ?? { n: 0, sum: [0, 0, 0] as RGB };
      cell.n += weight; cell.sum[0] += r * weight; cell.sum[1] += g * weight; cell.sum[2] += b * weight;
      buckets.set(key, cell);
    }
  }
  const picked: RGB[] = [];
  for (const c of [...buckets.values()].sort((a, b) => b.n - a.n)) {
    const rgb: RGB = [c.sum[0] / c.n, c.sum[1] / c.n, c.sum[2] / c.n];
    if (picked.every((p) => dist(p, rgb) > 48)) picked.push(rgb);
    if (picked.length === count) break;
  }
  const colours = picked.map(hex);
  for (const f of fallback) if (colours.length < count && !colours.includes(f)) colours.push(f);
  return colours;
}
