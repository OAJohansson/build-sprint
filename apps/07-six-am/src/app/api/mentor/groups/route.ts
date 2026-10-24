import { mentorGuard } from "@/lib/server/access";
import { MentorError } from "@/lib/server/claude";
import { serverError } from "@/lib/server/failure";
import { ask, isFail, mentorErrorResponse } from "@/lib/server/mentor-run";
import type { Group } from "@/lib/server/mentor-store";
import { cleanGenre } from "@/lib/ears/my-genre";
import { sharedTraits } from "@/lib/mentor/group-traits";
import { cleanTzOffset } from "@/lib/mentor/periods";

// Genre groups that grow from the library (M12). GET lists them; POST asks the Mentor to propose
// new ones from tagged tracks; PATCH { id, action: accept | rename | split | dismiss, … } changes one.
export const maxDuration = 60;

export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  try {
    // One-time repair: groups split before split reasons were derived still carry their old
    // parent's reason ("Split from …"); recompute those from their own tracks.
    let groups = await g.store.listGroups();
    const stale = groups.filter((x) => x.reason.startsWith("Split from \""));
    if (stale.length) {
      const library = await g.store.listAnalyses();
      for (const x of stale) {
        const reason = sharedTraits(library.filter((a) => x.trackIds.includes(a.id)));
        if (reason) await g.store.updateGroup(x.id, { reason });
      }
      groups = await g.store.listGroups();
    }
    return Response.json({ groups });
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
        // Each part's reason comes from its own tracks' numbers (F7), not the old group's.
        const library = await g.store.listAnalyses();
        const reasonOf = (ids: string[]) => sharedTraits(library.filter((a) => ids.includes(a.id))) || `Split from "${group.name}"`;
        const created: Group[] = await g.store.addGroups(
          parts.map((p) => ({ name: p.name, trackIds: p.trackIds, reason: reasonOf(p.trackIds), status: group.status === "dismissed" ? "proposed" : group.status })),
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
