import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { parseFields } from "@/lib/yum";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    const yum = await g.store.get(g.library, (await params).id);
    return yum ? Response.json({ yum }) : Response.json({ error: "Not in your book." }, { status: 404 });
  } catch (error) {
    return serverError(error);
  }
}

/** Edit the details (JSON), or { removed: true | false } to remove or undo. The saved date never changes. */
export async function PATCH(request: Request, { params }: Ctx) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "Nothing arrived." }, { status: 400 });
  try {
    if (typeof body.removed === "boolean") {
      const yum = await g.store.setRemoved(g.library, id, body.removed);
      return yum ? Response.json({ yum }) : Response.json({ error: "Not in your book." }, { status: 404 });
    }
    const fields = parseFields(body);
    if ("problem" in fields) return Response.json({ error: fields.problem }, { status: 400 });
    const yum = await g.store.update(g.library, id, fields);
    return yum ? Response.json({ yum }) : Response.json({ error: "Not in your book." }, { status: 404 });
  } catch (error) {
    return serverError(error);
  }
}
