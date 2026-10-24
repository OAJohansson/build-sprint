import { mentorGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { parseMap } from "@/lib/map/context";

// Arrangement maps (Phase 3, S1): numbers only, measured in the browser; no audio ever reaches the
// server. GET ?id= one track's map (404 if none), PUT ?id= { map } saves it. Behind the access code.
const idOf = (request: Request) => new URL(request.url).searchParams.get("id") ?? "";

export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!id || id.length > 600) return Response.json({ error: "Say which track: ?id=<SoundCloud URL>." }, { status: 400 });
  try {
    const map = await g.store.getMap(id);
    return map ? Response.json({ map }) : Response.json({ error: "No map for that track yet." }, { status: 404 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { map?: unknown } | null;
  const map = parseMap(body?.map);
  if (!map || map.id !== idOf(request)) return Response.json({ error: "That map couldn't be saved." }, { status: 400 });
  try {
    return Response.json({ map: await g.store.putMap(map) });
  } catch (error) {
    return serverError(error);
  }
}
