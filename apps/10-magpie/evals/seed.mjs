// Seeds the graders' sandbox library (decision 0028 #10), never the owner's: every call uses
// SANDBOX_ACCESS_CODE. Real saves through the API, so stickers are drawn too (about $0.04 each).
//
//   node --env-file=.env.local evals/seed.mjs [--clear] [--empty] [--base http://localhost:3110]
//
// --clear takes every sandbox yum off the shelf first (soft remove, as the app's Remove does).
// --empty stops after clearing: a fresh library for R12 and the first-run checks.

import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const base = args.includes("--base") ? args[args.indexOf("--base") + 1] : "http://localhost:3110";
const code = process.env.SANDBOX_ACCESS_CODE;
if (!code) throw new Error("SANDBOX_ACCESS_CODE is not set (pnpm env-bootstrap 10-magpie).");
const headers = { "x-access-code": code };
const photos = new URL("./photos/", import.meta.url);

if (args.includes("--clear") || args.includes("--empty")) {
  const { yums } = await (await fetch(`${base}/api/yums`, { headers })).json();
  for (const y of yums) {
    await fetch(`${base}/api/yums/${y.id}`, { method: "PATCH", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ removed: true }) });
  }
  console.log(`cleared ${yums.length} sandbox yums`);
  if (args.includes("--empty")) process.exit(0);
}

// A believable book: mostly London, a trip to Taipei, wines and cocktails loved most.
const YUMS = [
  { photo: "01-red-wine.jpg", name: "Barolo 2016", kind: "drink", subKind: "wine", place: "Noble Rot", city: "London", country: "United Kingdom", hearts: 5, note: "tar and roses, ask for the 2016" },
  { photo: "02-negroni.jpg", name: "Mezcal negroni", kind: "drink", subKind: "cocktail", place: "Satan's Whiskers", city: "London", country: "United Kingdom", hearts: 5, note: "smoky, bitter orange" },
  { photo: "03-margarita.jpg", name: "Spicy margarita", kind: "drink", subKind: "cocktail", place: "Kol Mezcaleria", city: "London", country: "United Kingdom", hearts: 4, note: null },
  { photo: "04-xiaolongbao.jpg", name: "Xiao long bao", kind: "food", subKind: "dishes", place: "Din Tai Fung Xinyi", city: "Taipei", country: "Taiwan", hearts: 5, note: "18 folds, soup burns, worth it" },
  { photo: "05-dal.jpg", name: "Black daal", kind: "food", subKind: "dishes", place: "Dishoom Shoreditch", city: "London", country: "United Kingdom", hearts: 5, note: "cooked for 24 hours" },
  { photo: "06-comte.jpg", name: "Comté 24 months", kind: "food", subKind: "dishes", place: "Neal's Yard Dairy", city: "London", country: "United Kingdom", hearts: 4, note: "crunchy crystals, nutty" },
  { photo: "07-gelato.jpg", name: "Pistachio gelato", kind: "dessert", subKind: null, place: "Gelupo", city: "London", country: "United Kingdom", hearts: 4, note: null },
  { photo: "08-flat-white.jpg", name: "Flat white", kind: "drink", subKind: "coffee-tea", place: "Prufrock", city: "London", country: "United Kingdom", hearts: 3, note: null },
  { photo: "09-ramen.jpg", name: "Tonkotsu ramen", kind: "food", subKind: "dishes", place: "Ichiran Shibuya", city: "Tokyo", country: "Japan", hearts: 5, note: "extra rich broth, firm noodles" },
  { photo: "11-pint.jpg", name: "Plum hot shot", kind: "drink", subKind: "cocktail", place: "Raohe Night Market", city: "Taipei", country: "Taiwan", hearts: 5, note: "sweet, sour, warm. ask for it again!" },
  { photo: null, name: "Orange wine", kind: "drink", subKind: "wine", place: "Sager + Wilde", city: "London", country: "United Kingdom", hearts: 5, note: "skin contact, apricot" },
  { photo: "12-tiramisu.jpg", name: "Tiramisu", kind: "dessert", subKind: null, place: "Trattoria da Enzo", city: "Rome", country: "Italy", hearts: 4, note: null },
];

for (const y of YUMS) {
  const body = new FormData();
  body.set("id", randomUUID());
  for (const [k, v] of Object.entries(y)) if (k !== "photo" && v !== null) body.set(k, String(v));
  if (y.photo) body.set("photo", new Blob([await readFile(new URL(y.photo, photos))], { type: "image/jpeg" }), y.photo);
  const r = await fetch(`${base}/api/yums`, { method: "POST", headers, body });
  console.log(`${r.status} ${y.name}`);
}
