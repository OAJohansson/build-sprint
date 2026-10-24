import { loopGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// One stored AI loop's audio (S4): GET /api/loops/<id> → the file's bytes, behind the access code.
export async function GET(request: Request, ctx: RouteContext<"/api/loops/[id]">) {
  const g = loopGuard(request);
  if ("error" in g) return g.error;
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "Not found." }, { status: 404 });
  try {
    const found = await g.store.getAudio(id);
    if (!found) return Response.json({ error: "Not found." }, { status: 404 });
    return new Response(found.audio.slice().buffer, {
      headers: { "content-type": found.meta.mime, "cache-control": "private, max-age=31536000, immutable" },
    });
  } catch (error) {
    return serverError(error);
  }
}
