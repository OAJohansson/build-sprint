import { SOURCES, UUID, cleanText, firstLink, sourceOf, type Source } from "@/lib/library";
import { guard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { imageSize } from "@/lib/server/image-size";
import { fetchLinkPicture } from "@/lib/server/link-picture";

// My saves: GET lists them, newest first; POST adds one (a picture, a link, or both; multipart).
// A link without a picture gets one from its page (og:image), kept as a copy; if that fails the
// save is kept as a link and the inbox asks for a screenshot.
// DELETE ?id= removes one with its picture; PATCH moves saves between folders. The id comes from the browser, so a share that's
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
  let picture: { bytes: Uint8Array; type: string } | null = image ?{ bytes: new Uint8Array(await image.arrayBuffer()), type: image.type } : null;
  if (!picture && link) picture = await fetchLinkPicture(link);
  // The picture's own header is the truth about its shape; the browser's number is a fallback.
  const size = picture ? imageSize(picture.bytes) : null;
  const aspectIn = Number(form.get("aspect"));
  const aspect = size && size.h > 0 ? size.w / size.h : picture && Number.isFinite(aspectIn) && aspectIn > 0 && aspectIn < 20 ? aspectIn : null;
  const given = String(form.get("source") ?? "");
  const source: Source = (SOURCES as readonly string[]).includes(given) ? (given as Source) : sourceOf(link, !!image);
  const title = cleanText(form.get("title"), 300);

  try {
    const save = await g.store.addSave({ id, link, source, title, aspect, image: picture });
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

// PATCH { ids, folderId } moves saves into a folder, or back to the inbox with null.
export async function PATCH(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { ids?: unknown; folderId?: unknown } | null;
  const ids = Array.isArray(body?.ids) ? body.ids.filter((x): x is string => typeof x === "string" && UUID.test(x)) : [];
  const folderId = body?.folderId === null ? null : typeof body?.folderId === "string" && UUID.test(body.folderId) ? body.folderId : undefined;
  if (!ids.length || ids.length > 500 || folderId === undefined) return Response.json({ error: "Those saves couldn't be moved." }, { status: 400 });
  try {
    await g.store.moveSaves(ids, folderId);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
