// Use in API route handlers: log the real reason (Vercel → project → Logs) and
// show the user only a general message. Config, database and API-key details
// are never theirs to fix. Pattern from day 1 (CrossFit Log).
const FRIENDLY = "Something went wrong. Please try again later.";

export function failure(reason: string, status = 500) {
  console.error(`[app] ${reason}`);
  return Response.json({ error: FRIENDLY }, { status });
}

export const serverError = (error: unknown) =>
  failure(error instanceof Error ? error.message : String(error));
