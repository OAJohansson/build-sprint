import { mentorGuard } from "@/lib/server/access";
import { MentorError } from "@/lib/server/claude";
import { serverError } from "@/lib/server/failure";
import { ask, isFail, mentorErrorResponse } from "@/lib/server/mentor-run";
import type { Group } from "@/lib/server/mentor-store";
import { cleanGenre } from "@/lib/ears/my-genre";
import { cleanTzOffset } from "@/lib/mentor/periods";

// Genre groups that grow from the library (M12). GET lists them; POST asks the Mentor to propose
// new ones from tagged tracks; PATCH { id, action: accept | rename | split | dismiss, … } changes one.
export const maxDuration = 60;

export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ groups: await g.store.listGroups() });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = ((await request.json().catch(() => null)) ?? {}) as { tz?: unknown };
  try {
    const reply = await ask(g.store, { job: "propose_groups" }, new Date(), cleanTzOffset(body.tz));
    if (isFail(reply)) return Response.json({ error: reply.error, ...reply.extra }, { status: reply.status });
    return Response.json(reply);
  } catch (error) {
    if (error instanceof MentorError) return mentorErrorResponse(error);
    return serverError(error);
  }
}

type Patch = { id?: unknown; action?: unknown; name?: unknown; parts?: unknown };
const bad = (error: string) => Response.json({ error }, { status: 400 });

export async function PATCH(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = ((await request.json().catch(() => null)) ?? {}) as Patch;
  const id = typeof body.id === "string" ? body.id : "";
  try {
    const group = (await g.store.listGroups()).find((x) => x.id === id);
    if (!group) return Response.json({ error: "That group doesn't exist." }, { status: 404 });
    const name = typeof body.name === "string" ? cleanGenre(body.name)?.slice(0, 80) : undefined;
    switch (body.action) {
      case "accept":
        return Response.json({ group: await g.store.updateGroup(id, { status: "accepted", ...(name ? { name } : {}) }) });
      case "rename":
        if (!name) return bad("Give the group a name.");
        return Response.json({ group: await g.store.updateGroup(id, { name }) });
      case "dismiss":
        return Response.json({ group: await g.store.updateGroup(id, { status: "dismissed" }) });
      case "split": {
        // parts: [{ name, trackIds }] — every part a named subset of this group's tracks, 2+ parts.
        const own = new Set(group.trackIds);
        const parts = (Array.isArray(body.parts) ? body.parts : [])
          .map((p) => {
            const o = (p ?? {}) as Record<string, unknown>;
            const n = typeof o.name === "string" ? cleanGenre(o.name)?.slice(0, 80) : undefined;
            const ids = (Array.isArray(o.trackIds) ? o.trackIds : []).filter((t): t is string => typeof t === "string" && own.has(t));
            return n && ids.length ? { name: n, trackIds: [...new Set(ids)] } : null;
          })
          .filter((p): p is { name: string; trackIds: string[] } => p !== null);
        if (parts.length < 2) return bad("Split into at least two named parts, each with tracks from this group.");
        const created: Group[] = await g.store.addGroups(
          parts.map((p) => ({ name: p.name, trackIds: p.trackIds, reason: `Split from "${group.name}": ${group.reason}`, status: group.status === "dismissed" ? "proposed" : group.status })),
        );
        await g.store.deleteGroup(id);
        return Response.json({ groups: created });
      }
      default:
        return bad("Unknown action.");
    }
  } catch (error) {
    return serverError(error);
  }
}
