// The spike's v1 sticker prompt and cut-out, kept as they were run on 26 Oct. The app's prompt
// (src/lib/server/sticker.ts) moved on to v2 (decision log L8); evals now run against the app.
import sharp from "sharp";

export const promptFor = (shape = "round") => `Turn the food or drink in this photo into one die-cut sticker for a cheerful sticker book.

Style: a flat cartoon illustration with bold, thick, even dark-brown outlines (#3B1F1A) around every shape. Flat colour fills, no gradients, no shading except one small white highlight, no texture, no photo detail. Simple, chunky, friendly shapes, like a cute vinyl sticker.

Draw only the main dish or drink with its glass, cup, plate or bowl, centred and filling most of the sticker. Keep what makes it recognisable: its colours, its garnish, the shape of its glass or dish.

${shape === "round" ? "The sticker is round: a soft pastel disc behind the item" : "The sticker is a rounded square with generous round corners: a soft pastel rounded square behind the item"}, in a light colour that suits it; a thick white border around it; a thin dark-brown outline around the white border. Outside the sticker the background is plain pure white.

No text, no letters, no logos, no labels, no hands, no table, no background scene.`;

/**
 * Makes the white outside the sticker transparent: a flood fill from the image's edges through
 * near-white pixels, so the white border inside the sticker's outline stays. Returns a PNG.
 */
export async function cutOut(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const light = (i) => data[i] > 225 && data[i + 1] > 225 && data[i + 2] > 225;
  const seen = new Uint8Array(w * h);
  const stack = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    if (!light(p * 4)) continue;
    data[p * 4 + 3] = 0;
    const x = p % w, y = (p - x) / w;
    if (x > 0) stack.push(p - 1);
    if (x < w - 1) stack.push(p + 1);
    if (y > 0) stack.push(p - w);
    if (y < h - 1) stack.push(p + w);
  }
  // Soften the cut edge by one pixel: a light pixel next to a cleared one goes half see-through.
  for (let p = 0; p < w * h; p++) {
    if (data[p * 4 + 3] === 0 || !light(p * 4)) continue;
    const x = p % w;
    if ((x > 0 && data[(p - 1) * 4 + 3] === 0) || (x < w - 1 && data[(p + 1) * 4 + 3] === 0) || (p >= w && data[(p - w) * 4 + 3] === 0) || (p < w * (h - 1) && data[(p + w) * 4 + 3] === 0)) data[p * 4 + 3] = 128;
  }
  return sharp(data, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 1 }).resize(768, 768, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9, palette: false }).toBuffer();
}

export const PROMPT = promptFor();
