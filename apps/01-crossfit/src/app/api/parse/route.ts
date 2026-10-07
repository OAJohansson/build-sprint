import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { CATEGORIES, MOVEMENTS } from "@/lib/movements";
import { checkAccess, failure } from "@/lib/server/access";
import { ParsedSessionSchema } from "@/lib/types";

// Server-side only so the API key never reaches the browser. Turns a spoken
// note into structured entries; saving is a separate call after review.
const client = new Anthropic();

const movementList = CATEGORIES.map(
  (c) =>
    `${c}: ${MOVEMENTS.filter((m) => m.category === c)
      .map((m) => (m.detail && c === "WODs" ? `${m.name} (${m.detail})` : m.name))
      .join(", ")}`,
).join("\n");

const SYSTEM = `You turn a CrossFit athlete's spoken post-class note into structured entries.

Movement names: use the exact name from this list whenever the movement matches (fix speech-to-text errors and synonyms: "squat clean" → Clean, "C2B" → Chest-to-Bar Pull-up, "HSPU" → Handstand Push-up, "snack" → Snatch). Only invent a name in Title Case if nothing fits.
${movementList}

Lifts:
- One entry per movement + load. Several weights for one movement → one entry per weight.
- "Worked up to 80" or "hit 80" → sets null, reps 1, weight 80. "5 by 3 at 60" → sets 5, reps 3, weight 60. "3 sets of 5" → sets 3, reps 5.
- Gymnastics: reps per set, weight null (unless weighted). "Max set of 20 pull-ups" → sets 1, reps 20.

WODs:
- A named benchmark (Fran, Grace, Cindy…) → movement is that name, score is the result, rx true/false if Rx/scaled was said.
- Any other class WOD → movement "WOD", score as said ("12:40", "7+4"), note = a short description of the workout.
- Time scores as m:ss. AMRAP scores as rounds+reps ("7+4").
- Don't also list the WOD's individual movements as separate entries.

Other:
- Ignore chit-chat. Use the stated unit, else the default unit given.
- Resolve relative dates ("yesterday", "on Monday") against today's date. Otherwise date is null.
- title: 2–4 words describing the session, e.g. "Olympic day", "Squat + Fran".`;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return failure("ANTHROPIC_API_KEY is not set.", 503);
  }
  const denied = checkAccess(request);
  if (denied) return denied;

  const { transcript, today, unit } = (await request.json()) as { transcript: string; today: string; unit: "kg" | "lb" };
  if (!transcript?.trim()) {
    return Response.json({ error: "Say or type something first." }, { status: 400 });
  }

  try {
    const response = await client.beta.messages.parse({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(ParsedSessionSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `Today: ${today}\nDefault unit: ${unit}\n\nNote:\n${transcript.slice(0, 8000)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Couldn't make sense of that. Try rephrasing." }, { status: 422 });
    }
    return Response.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Busy right now, try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      return failure(`Anthropic API error ${error.status}: ${error.message}`, 502);
    }
    throw error;
  }
}
