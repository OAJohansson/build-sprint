// Only reached when the service worker wasn't running yet (the very first share after
// installing). A photo can be bigger than a server request allows, so nothing is kept here:
// capture opens and says to pick the photo again. A share is never lost silently.
export async function POST(request: Request) {
  return Response.redirect(new URL("/new?missed=1", request.url), 303);
}
