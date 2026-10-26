import { ACCESS_COOKIE, spaceFor, spaceOf } from "@/lib/server/access";

// GET: does this device have access? POST { code }: check the code and remember it on this device
// (an httpOnly cookie for a year). DELETE: forget it (sync off; the device keeps its data).
export async function GET(request: Request) {
  return Response.json({ ok: spaceOf(request) !== null });
}

const cookie = (value: string, maxAge: number) => {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ACCESS_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax${secure}`;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  // An empty code only "matches" in local development without ACCESS_CODE; never accept it here.
  if (!code || !spaceFor(code)) return Response.json({ error: "Wrong code." }, { status: 401 });
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie(code, 31536000) } });
}

export async function DELETE() {
  return Response.json({ ok: true }, { headers: { "Set-Cookie": cookie("", 0) } });
}
