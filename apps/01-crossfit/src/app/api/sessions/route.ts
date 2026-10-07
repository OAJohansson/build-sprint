import { z } from "zod";
import { findMovement } from "@/lib/movements";
import { detectPbs } from "@/lib/pb";
import { guard, serverError } from "@/lib/server/access";
import { type Session, uid } from "@/lib/types";

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().max(120),
  transcript: z.string().max(10000),
  entries: z
    .array(
      z.object({
        movement: z.string().trim().min(1).max(80),
        sets: z.number().int().positive().max(100).nullable(),
        reps: z.number().int().positive().max(1000).nullable(),
        weight: z.number().positive().max(1000).nullable(),
        unit: z.enum(["kg", "lb"]),
        score: z.string().trim().max(40).nullable(),
        rx: z.boolean().nullable(),
        note: z.string().max(300).nullable(),
      }),
    )
    .max(50),
});

/** Save a session. PBs are worked out here, against what's stored, and returned for the celebration. */
export async function POST(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That session doesn't look right." }, { status: 400 });

  try {
    const id = uid();
    const session: Session = {
      id,
      date: parsed.data.date,
      title: parsed.data.title.trim() || "Session",
      transcript: parsed.data.transcript,
      // Snap names onto the movement list so PBs group correctly.
      entries: parsed.data.entries.map((e) => ({ ...e, id: uid(), movement: findMovement(e.movement).name })),
      createdAt: new Date().toISOString(),
    };
    const { pbs } = await g.store.load();
    const found = detectPbs(session.entries, pbs, session.date, id).map((n) => ({ ...n, pb: { ...n.pb, id: uid() } }));
    await g.store.addSession(session, found.map((n) => n.pb));
    return Response.json({ session, newPbs: found });
  } catch (error) {
    return serverError(error);
  }
}

/** Edit a saved session: new details and entries; its PBs are worked out again. */
export async function PUT(request: Request) {
  const g = guard(request);
  if ("error" in g) return g.error;
  const id = new URL(request.url).searchParams.get("id");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!id || !parsed.success) return Response.json({ error: "That session doesn't look right." }, { status: 400 });

  try {
    const { sessions, pbs } = await g.store.load();
    const existing = sessions.find((s) => s.id === id);
    if (!existing) return Response.json({ error: "That session no longer exists." }, { status: 404 });
    const session: Session = {
      ...existing,
      date: parsed.data.date,
      title: parsed.data.title.trim() || "Session",
      transcript: parsed.data.transcript,
      entries: parsed.data.entries.map((e) => ({ ...e, id: uid(), movement: findMovement(e.movement).name })),
    };
    // Compare against every PB except the ones this session set before the edit.
    const others = pbs.filter((p) => p.sessionId !== id);
    const found = detectPbs(session.entries, others, session.date, id).map((n) => ({ ...n, pb: { ...n.pb, id: uid() } }));
    await g.store.updateSession(session, found.map((n) => n.pb));
    return Response.json({ session, newPbs: found });
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
    await g.store.deleteSession(id);
    return Response.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
