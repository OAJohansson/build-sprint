import { SOURCES, UUID, cleanText, firstLink, sourceOf, type Source } from "@/lib/library";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// My saves: GET lists them, newest first; POST adds one (a picture, a link, or both; multipart);
// DELETE ?id= removes one with its picture. The id comes from the browser, so a share that's
// retried after a dropped connection lands once.
const TYPES = ["image/webp", "image/jpeg", "image/png"];
const MAX_BYTES = 4 * 1024 * 1024; // pictures are shrunk in the browser first; Vercel takes 4.5 MB

export async function GET(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ saves: await g.store.listSaves() });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const form = await request.formData().catch(() => null);
  if (!form) return Response.json({ error: "That save couldn't be read." }, { status: 400 });

  const id = String(form.get("id") ?? "");
  const file = form.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;
  if (!UUID.test(id)) return Response.json({ error: "That save couldn't be read." }, { status: 400 });
  if (image && !TYPES.includes(image.type)) return Response.json({ error: "Only photos and screenshots can be saved." }, { status: 415 });
  if (image && image.size > MAX_BYTES) return Response.json({ error: "That picture is too big." }, { status: 413 });

  const text = cleanText(form.get("text"), 2000);
  const link = cleanText(form.get("url"), 2000) ?? firstLink(text);
  if (!image && !link) return Response.json({ error: "There's nothing to save." }, { status: 400 });
  const aspectIn = Number(form.get("aspect"));
  const aspect = image && Number.isFinite(aspectIn) && aspectIn > 0 && aspectIn < 20 ? aspectIn : null;
  const given = String(form.get("source") ?? "");
  const source: Source = (SOURCES as readonly string[]).includes(given) ? (given as Source) : sourceOf(link, !!image);
  const title = cleanText(form.get("title"), 300);

  try {
    const save = await g.store.addSave({
      id, link, source, title, aspect,
      image: image ? { bytes: new Uint8Array(await image.arrayBuffer()), type: image.type } : null,
    });
    return Response.json({ save });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ error: "That save doesn't exist." }, { status: 404 });
  try {
    await g.store.removeSave(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
