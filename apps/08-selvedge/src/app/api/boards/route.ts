import { UUID, cleanName, parseDoc } from "@/lib/library";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// My boards: GET lists them (or loads one with ?id=), PUT ?id= creates or updates one (the
// editor autosaves), DELETE ?id= removes one. Pattern from Six AM's tracks.
const idOf = (request: Request) => new URL(request.url).searchParams.get("id") ?? "";

export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  try {
    if (!id) return Response.json({ boards: await g.store.listBoards() });
    if (!UUID.test(id)) return Response.json({ error: "That board doesn't exist." }, { status: 404 });
    const board = await g.store.getBoard(id);
    return board ? Response.json({ board }) : Response.json({ error: "That board doesn't exist." }, { status: 404 });
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
  if (!UUID.test(id) || !name || !doc) return Response.json({ error: "That board couldn't be saved." }, { status: 400 });
  try {
    return Response.json({ board: await g.store.saveBoard(id, name, doc) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!UUID.test(id)) return Response.json({ error: "That board doesn't exist." }, { status: 404 });
  try {
    await g.store.removeBoard(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
