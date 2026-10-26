import { after } from "next/server";
import sharp from "sharp";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { makeSticker } from "@/lib/server/sticker";
import { parseFields } from "@/lib/yum";

// The sticker is drawn after the response (decision 0029), within this route's time limit.
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every yum in this device's book, newest first. */
export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ yums: await g.store.list(g.library) });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * Saves a yum: multipart with the fields, an optional `photo` and the client's `id` (so a retry
 * can't save it twice). Responds as soon as the yum and photo are stored; the sticker follows.
 */
export async function POST(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "Nothing arrived." }, { status: 400 });
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return Response.json({ error: "Missing id." }, { status: 400 });
  const fields = parseFields(Object.fromEntries([...form.entries()].filter(([, v]) => typeof v === "string")));
  if ("problem" in fields) return Response.json({ error: fields.problem }, { status: 400 });
  try {
    const existing = await g.store.get(g.library, id);
    if (existing) return Response.json({ yum: existing });
    const file = form.get("photo");
    let photo = null;
    if (file instanceof File && file.size > 0) {
      // Keep the original as it came (already shrunk on the phone), only re-encoded to WebP.
      const bytes = await sharp(Buffer.from(await file.arrayBuffer())).rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
      photo = { bytes: new Uint8Array(bytes), type: "image/webp" };
    }
    const yum = await g.store.create(g.library, id, fields, photo, true);
    const { store, library } = g;
    after(() => makeSticker(store, library, yum));
    return Response.json({ yum }, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
