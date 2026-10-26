import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { isEmptyDoc, mergeDocs, readDoc } from "@/lib/sync";

// POST { doc }: merge this device's document into the stored one (L28) and return the result,
// which the device merges back into whatever it logged meanwhile. One call both pushes and pulls.
// The save checks the revision it read (L29), so two devices syncing at once can't overwrite
// each other: the slower one re-reads and merges again.

// shortcut: the whole document travels each time; fine for a few habits over months (tens of
// KB), upgrade to per-day rows if it passes ~500 KB.
const MAX_BYTES = 1_000_000;

export async function POST(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const text = await request.text();
  if (text.length > MAX_BYTES) return Response.json({ error: "Too large." }, { status: 413 });
  let body: { doc?: unknown };
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const mine = readDoc(body.doc);
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const row = await g.store.read(g.space);
      const stored = readDoc(row?.doc ?? null);
      const merged = mergeDocs(stored, mine);
      // Nothing new and nothing stored: don't create an empty row.
      if (!row && isEmptyDoc(merged)) return Response.json({ doc: merged, space: g.space });
      if (await g.store.write(g.space, merged, row?.rev ?? null)) return Response.json({ doc: merged, space: g.space });
    }
    return Response.json({ error: "Busy, try again." }, { status: 409 });
  } catch (e) {
    return serverError(e);
  }
}
