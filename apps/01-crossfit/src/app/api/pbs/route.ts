import { z } from "zod";
import { findMovement } from "@/lib/movements";
import { currentPbs, isBetter, pbKey } from "@/lib/pb";
import { guard, serverError } from "@/lib/server/access";
import { type Pb, uid } from "@/lib/types";

const Body = z.object({
  movement: z.string().trim().min(1).max(80),
  kind: z.enum(["load", "reps", "time", "rounds"]),
  repMax: z.number().int().min(1).max(20).nullable(),
  value: z.number().positive().max(1_000_000),
  unit: z.enum(["kg", "lb"]).nullable(),
  rx: z.boolean().nullable(),
  achievedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Record a PB by hand (e.g. the PBs you already know on day one). */
export async function POST(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That PB doesn't look right." }, { status: 400 });

  try {
    const pb: Pb = {
      ...parsed.data,
      id: uid(),
      movement: findMovement(parsed.data.movement).name,
      repMax: parsed.data.kind === "load" ? (parsed.data.repMax ?? 1) : null,
      sessionId: null,
    };
    const { pbs } = await g.store.load();
    const previous = currentPbs(pbs).get(pbKey(pb)) ?? null;
    await g.store.addPb(pb);
    return Response.json({ pb, previous, isBest: !previous || isBetter(pb, previous) });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "Missing id." }, { status: 400 });
  try {
    await g.store.deletePb(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
