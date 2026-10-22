import { ACCESS_COOKIE, checkAccess, codeMatches } from "@/lib/server/access";

// GET: does this device have access? POST { code }: check the code and remember it on this
// device (an httpOnly cookie for a year), so shares and photos work without asking again.
export async function GET(request: Request) {
  return Response.json({ ok: checkAccess(request) === null });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  if (!codeMatches(code)) return Response.json({ error: "That's not the code." }, { status: 401 });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": `${ACCESS_COOKIE}=${encodeURIComponent(code)}; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax${secure}`,
    },
  });
}
