import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import type { PieceInput } from "@/lib/types";

// A personal writing log is small enough to load whole.
export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ pieces: await g.store.list() });
  } catch (error) {
    return serverError(error);
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parse(body: unknown): PieceInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.prompt !== "string" || typeof b.body !== "string") return null;
  if (b.status !== "draft" && b.status !== "done") return null;
  const f = b.feedback as Record<string, unknown> | null | undefined;
  const feedback =
    f && typeof f.strength === "string" && typeof f.tryNext === "string" ? { strength: f.strength, tryNext: f.tryNext } : null;
  return { prompt: b.prompt.slice(0, 500), body: b.body.slice(0, 50_000), status: b.status, feedback };
}

// Create or update one piece (autosave, set down, feedback). The id comes from the device.
export async function PUT(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const input = parse(await request.json().catch(() => null));
  if (!UUID.test(id) || !input) return Response.json({ error: "That piece couldn't be saved." }, { status: 400 });
  try {
    return Response.json({ piece: await g.store.save(id, input) });
  } catch (error) {
    return serverError(error);
  }
}
