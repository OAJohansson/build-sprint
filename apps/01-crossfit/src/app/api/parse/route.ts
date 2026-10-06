import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ParsedSessionSchema } from "@/lib/types";

// Server-side only so the API key never reaches the browser. The log itself
// stays in localStorage; this route just turns a transcript into structure.
const client = new Anthropic();

const SYSTEM = `You turn a CrossFit athlete's spoken post-workout note into structured lift entries.

- One entry per distinct movement + load. If they did several sets at different weights, emit one entry per weight.
- "Worked up to 80" or "hit 80" means a heavy single: reps 1, sets null, weight 80.
- "5 by 3 at 60" means sets 5, reps 3, weight 60. "3 sets of 5" means sets 3, reps 5.
- Only log weighted or rep-based strength/skill work. Ignore chit-chat. A conditioning WOD can be one entry with the WOD name as movement and its score in note.
- Speech-to-text mangles words ("snatch" may appear as "snack", "clean and jerk" as "clean and jerry"); fix them.
- Prefer the athlete's existing movement names when one matches, so history stays grouped.
- Use the stated unit; if none is stated, use the default unit given.
- Resolve relative dates ("yesterday", "on Monday") against today's date. Otherwise date is null.`;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not set, so add lifts by hand for now." },
      { status: 503 },
    );
  }

  const { transcript, today, unit, knownMovements } = (await request.json()) as {
    transcript: string;
    today: string;
    unit: "kg" | "lb";
    knownMovements: string[];
  };
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
          content: `Today: ${today}\nDefault unit: ${unit}\nExisting movement names: ${
            knownMovements.join(", ") || "(none yet)"
          }\n\nNote:\n${transcript.slice(0, 8000)}`,
        },
      ],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return Response.json({ error: "Couldn't parse that. Try rephrasing." }, { status: 422 });
    }
    return Response.json(response.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Busy right now, try again in a moment." }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`Anthropic API error ${error.status}:`, error.message);
      return Response.json({ error: "Parsing failed. Your note is still here." }, { status: 502 });
    }
    throw error;
  }
}
