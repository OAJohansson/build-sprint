import { UUID } from "@/lib/library";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// A save's cut-out: its picture with the background removed. It's made in the browser (an
// in-browser model, decision 0025) and kept beside the original in the private bucket, so the
// original is never touched. GET streams it, PUT stores one (WebP with transparency), DELETE
// removes it.
const MAX_BYTES = 4 * 1024 * 1024;
const idOf = (request: Request) => new URL(request.url).searchParams.get("id") ?? "";

export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!UUID.test(id)) return new Response(null, { status: 404 });
  try {
    const image = await g.store.readCutout(id);
    if (!image) return new Response(null, { status: 404 });
    // A cut-out can be redone, so the browser checks back rather than keeping it forever.
    return new Response(image.bytes as BodyInit, { headers: { "Content-Type": image.type, "Cache-Control": "private, no-cache" } });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!UUID.test(id)) return Response.json({ error: "That save doesn't exist." }, { status: 404 });
  if (request.headers.get("content-type") !== "image/webp") return Response.json({ error: "A cut-out must be a WebP picture." }, { status: 415 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return Response.json({ error: "That cut-out is too big." }, { status: 413 });
  try {
    await g.store.writeCutout(id, { bytes, type: "image/webp" });
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  if (!UUID.test(id)) return Response.json({ error: "That save doesn't exist." }, { status: 404 });
  try {
    await g.store.removeCutout(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
