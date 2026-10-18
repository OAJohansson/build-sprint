import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { UUID, cleanName, parseDoc } from "@/lib/tracks";

// My tracks: GET lists them (or loads one with ?id=), PUT creates or updates one, DELETE removes it.
const idOf = (request: Request) => new URL(request.url).searchParams.get("id") ?? "";

export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  try {
    if (!id) return Response.json({ tracks: await g.store.list() });
    if (!UUID.test(id)) return Response.json({ error: "That track doesn't exist." }, { status: 404 });
    const track = await g.store.get(id);
    return track ? Response.json({ track }) : Response.json({ error: "That track doesn't exist." }, { status: 404 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  const body = (await request.json().catch(() => null)) as { name?: unknown; doc?: unknown } | null;
  const name = cleanName(body?.name), doc = parseDoc(body?.doc);
  if (!UUID.test(id) || !name || !doc) return Response.json({ error: "That track couldn't be saved." }, { status: 400 });
  try {
    return Response.json({ track: await g.store.save(id, name, doc) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!UUID.test(id)) return Response.json({ error: "That track doesn't exist." }, { status: 404 });
  try {
    await g.store.remove(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
