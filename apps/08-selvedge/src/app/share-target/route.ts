// Only reached when the service worker wasn't running yet (the very first share after
// installing). Nothing can be kept here, so say which fields arrived and send the person to the
// probe, where they can share again; a share is never lost silently.
export async function POST(request: Request) {
  const form = await request.formData();
  const arrived = [...form.entries()].map(([key, value]) =>
    typeof value === "string" ? key : `${key} (${value.type || "file"})`,
  );
  const target = new URL("/probe", request.url);
  target.searchParams.set("missed", arrived.join(", ") || "nothing");
  return Response.redirect(target, 303);
}
