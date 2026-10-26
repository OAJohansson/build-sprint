import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

/** The original photo, as saved. Never replaced, so it can be cached for long. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    const image = await g.store.readPhoto(g.library, (await params).id);
    if (!image) return new Response(null, { status: 404 });
    return new Response(Buffer.from(image.bytes), { headers: { "Content-Type": image.type, "Cache-Control": "private, max-age=31536000, immutable" } });
  } catch (error) {
    return serverError(error);
  }
}
