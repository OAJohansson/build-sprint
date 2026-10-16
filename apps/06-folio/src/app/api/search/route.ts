import { browseGenres } from "@/lib/browse";
import { checkAccess } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { browseGenre, searchBooks } from "@/lib/server/openlibrary";

// Title or author search (?q=), or a genre chip (?genre=label).
export async function GET(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim().slice(0, 200);
  const genre = browseGenres.find((g) => g.label === params.get("genre"));
  if (!q && !genre) return Response.json({ error: "Nothing to search for." }, { status: 400 });
  try {
    return Response.json({ results: q ? await searchBooks(q) : await browseGenre(genre!.q) });
  } catch (error) {
    return serverError(error);
  }
}
