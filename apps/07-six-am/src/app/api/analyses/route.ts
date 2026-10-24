import { mentorGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { parseAnalysis } from "@/lib/mentor/context";

// Ears results in Supabase (M15, L51): text and numbers only. GET lists them (or ?id= one), PUT
// ?id= saves one (with its My genre as given), POST { analyses: [...] } is the one-time import
// from localStorage that never overwrites what the server already has. DELETE { ids } removes
// results (Ears' Clear list), so a later sync doesn't bring them back.
const idOf = (request: Request) => new URL(request.url).searchParams.get("id") ?? "";

export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const id = idOf(request);
  try {
    if (!id) return Response.json({ analyses: await g.store.listAnalyses() });
    const analysis = await g.store.getAnalysis(id);
    return analysis ? Response.json({ analysis }) : Response.json({ error: "That result doesn't exist." }, { status: 404 });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { analysis?: unknown } | null;
  const analysis = parseAnalysis(body?.analysis);
  if (!analysis || analysis.id !== idOf(request)) return Response.json({ error: "That result couldn't be saved." }, { status: 400 });
  try {
    return Response.json({ analysis: await g.store.putAnalysis(analysis) });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { analyses?: unknown } | null;
  const raw = Array.isArray(body?.analyses) ? body.analyses : null;
  if (!raw || raw.length > 2000) return Response.json({ error: "Send up to 2,000 results as { analyses: [...] }." }, { status: 400 });
  const list = raw.map(parseAnalysis).filter((a) => a !== null);
  try {
    const result = await g.store.importAnalyses(list);
    return Response.json({ ...result, rejected: raw.length - list.length });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
  const ids = (Array.isArray(body?.ids) ? body.ids : []).filter((x): x is string => typeof x === "string" && x.length <= 600).slice(0, 5000);
  try {
    return Response.json({ deleted: await g.store.deleteAnalyses(ids) });
  } catch (error) {
    return serverError(error);
  }
}
