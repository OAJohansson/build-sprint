import { UUID } from "@/lib/library";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// The picture of a save, streamed from the private bucket (the access cookie rides along on
// <img> requests). A save's picture never changes, so the browser may keep it.
export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return new Response(null, { status: 404 });
  try {
    const image = await g.store.readImage(id);
    if (!image) return new Response(null, { status: 404 });
    return new Response(image.bytes as BodyInit, { headers: { "Content-Type": image.type, "Cache-Control": "private, max-age=31536000, immutable" } });
  } catch (error) {
    return serverError(error);
  }
}
