// Makes the two edge-case photos with sharp: a dark, warm, low-light photo and a cluttered table.
import sharp from "sharp";
const p = (f) => new URL(f, import.meta.url).pathname;
await sharp(p("../photos/09-ramen.jpg")).modulate({ brightness: 0.28, saturation: 0.7 }).tint({ r: 255, g: 170, b: 90 }).blur(1.2).jpeg({ quality: 70 }).toFile(p("edge-dark-ramen.jpg"));
const tiles = await Promise.all(["02-negroni.jpg", "09-ramen.jpg", "10-croissant.jpg", "11-pint.jpg"].map((f) => sharp(p(`../photos/${f}`)).resize(512, 512, { fit: "cover" }).toBuffer()));
await sharp({ create: { width: 1024, height: 1024, channels: 3, background: "#806040" } })
  .composite(tiles.map((input, i) => ({ input, left: (i % 2) * 512, top: Math.floor(i / 2) * 512 })))
  .jpeg({ quality: 82 }).toFile(p("edge-cluttered-table.jpg"));
console.log("edges made");
