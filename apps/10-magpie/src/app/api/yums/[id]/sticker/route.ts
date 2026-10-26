import { after } from "next/server";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { makeSticker } from "@/lib/server/sticker";

export const maxDuration = 60;

/** The sticker. Pages add ?v=<state> so a redrawn sticker isn't served from cache. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    const image = await g.store.readSticker(g.library, (await params).id);
    if (!image) return new Response(null, { status: 404 });
    return new Response(Buffer.from(image.bytes), { headers: { "Content-Type": image.type, "Cache-Control": "private, max-age=31536000, immutable" } });
  } catch (error) {
    return serverError(error);
  }
}

/** Draw it again (after a failed drawing). */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    const yum = await g.store.get(g.library, (await params).id);
    if (!yum) return Response.json({ error: "Not in your book." }, { status: 404 });
    if (yum.sticker === "drawing") return Response.json({ yum });
    await g.store.setSticker(g.library, yum.id, "drawing");
    const { store, library } = g;
    after(() => makeSticker(store, library, yum));
    return Response.json({ yum: { ...yum, sticker: "drawing" } });
  } catch (error) {
    return serverError(error);
  }
}
