import { mentorGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";

// My taste (M9): GET reads the profile, PUT { text } saves a hand edit (the owner's words win).
export async function GET(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  try {
    return Response.json({ profile: await g.store.getProfile() });
  } catch (error) {
    return serverError(error);
  }
}

export async function PUT(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { text?: unknown } | null;
  if (typeof body?.text !== "string") return Response.json({ error: "That profile couldn't be saved." }, { status: 400 });
  const text = body.text.replace(/\r\n/g, "\n").trim();
  if (text.length > 8000) return Response.json({ error: "Keep the profile under 8,000 characters." }, { status: 400 });
  try {
    const profile = await g.store.saveProfile(text, { at: new Date().toISOString(), note: "Edited by you", by: "owner", from: "Settings" });
    return Response.json({ profile });
  } catch (error) {
    return serverError(error);
  }
}
