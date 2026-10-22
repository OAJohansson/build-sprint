// Only reached when the service worker wasn't running yet (the very first share after
// installing). Nothing can be kept here (a photo can be bigger than a server request allows),
// so say which fields arrived and send the person to the inbox to share again; a share is never
// lost silently.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const arrived = form ? [...form.entries()].map(([key, value]) => (typeof value === "string" ? key : `${key} (${value.type || "file"})`)) : [];
  const target = new URL("/inbox", request.url);
  target.searchParams.set("missed", arrived.join(", ") || "nothing");
  return Response.redirect(target, 303);
}
