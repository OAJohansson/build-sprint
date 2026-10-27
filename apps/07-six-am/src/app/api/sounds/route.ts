import { libraryGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { parseNewSound, parseSoundPatch } from "@/lib/make/library";

// The sound library (Lab S4, L158), behind the access code. Settings and numbers only: a sound
// (preset + macros) linked to its loop (note pattern), tags and a name; never audio.
// GET [?source=<SoundCloud URL>&part=bass&tag=sub] → { sounds } newest first.
// POST { sound } → { sound } (name and tags suggested when missing).
// PATCH ?id=<uuid> { name?, tags?, preset?, macros? } → { sound } (rename, retag, re-tune).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const g = libraryGuard(request);
  if ("error" in g) return g.error;
  const q = new URL(request.url).searchParams;
  const f = { sourceUrl: q.get("source")?.slice(0, 600) || undefined, part: q.get("part")?.slice(0, 20) || undefined, tag: q.get("tag")?.toLowerCase().slice(0, 32) || undefined };
  try {
    return Response.json({ sounds: await g.store.list(f) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const g = libraryGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { sound?: unknown } | null;
  const sound = parseNewSound(body?.sound);
  if (!sound) return Response.json({ error: "That sound couldn't be saved: it needs a part, a preset, a key, a tempo and a 1, 2 or 4-bar pattern." }, { status: 400 });
  try {
    return Response.json({ sound: await g.store.add(sound) }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PATCH(request: Request) {
  const g = libraryGuard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ error: "Say which sound: ?id=<id>." }, { status: 400 });
  try {
    const cur = await g.store.get(id);
    if (!cur) return Response.json({ error: "No such sound." }, { status: 404 });
    const patch = parseSoundPatch(await request.json().catch(() => null), cur);
    if (!Object.keys(patch).length) return Response.json({ error: "Nothing to change." }, { status: 400 });
    return Response.json({ sound: await g.store.update(id, patch) });
  } catch (error) {
    return serverError(error);
  }
}
