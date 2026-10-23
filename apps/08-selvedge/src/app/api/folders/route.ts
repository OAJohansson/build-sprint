import { UUID, cleanName } from "@/lib/library";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// My inbox folders (owner, 23 Oct): GET lists them, PUT ?id= creates or updates one (its name and
// colour notes), DELETE ?id= removes one and sends its saves back to their day pages.
const idOf = (request: Request) => new URL(request.url).searchParams.get("id") ?? "";

export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ folders: await g.store.listFolders() });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  const body = (await request.json().catch(() => null)) as { name?: unknown; colourNotes?: unknown } | null;
  const name = cleanName(body?.name);
  if (!UUID.test(id) || !name) return Response.json({ error: "Give the folder a name." }, { status: 400 });
  try {
    return Response.json({ folder: await g.store.saveFolder(id, name, body?.colourNotes === true) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!UUID.test(id)) return Response.json({ error: "That folder doesn't exist." }, { status: 404 });
  try {
    await g.store.removeFolder(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
