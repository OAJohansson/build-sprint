import { checkAccess } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { newReleases, trending } from "@/lib/server/openlibrary";

// Home's two browse rows. Both are popularity lists, the same for everyone; cached for a day.
export async function GET(request: Request) {
  const denied = checkAccess(request);
  if (denied) return denied;
  try {
    const [popular, fresh] = await Promise.all([trending(), newReleases(new Date().getFullYear())]);
    return Response.json({ popular, newReleases: fresh });
  } catch (error) {
    return serverError(error);
  }
}
