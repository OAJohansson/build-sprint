import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { checkAnswer, type Job, type MentorAnswer, type Needs, urlKey } from "@/lib/mentor/answer";
import { addUsage, emptyUsage, MENTOR_MODEL, type StoredUsage } from "@/lib/mentor/cost";
import { buildRequest, type MentorInput } from "@/lib/mentor/prompt";

// One Mentor answer from Claude (decision 0027): server-side only, ANTHROPIC_API_KEY from env.
// Validates the structured answer and retries once if it's invalid (L48: short answers, caching,
// adaptive thinking at a modest effort; see JOBS_SPEC for the effort per job).

export class MentorError extends Error {
  constructor(
    readonly kind: "not_configured" | "refused" | "invalid" | "busy" | "api" | "timeout",
    message: string,
    readonly usage: StoredUsage | null = null,
    readonly costUsd = 0,
  ) {
    super(message);
  }
}

export type MentorResult = {
  answer: MentorAnswer;
  usage: StoredUsage;
  costUsd: number;
  latencyMs: number;
  /** Items dropped by validation (e.g. a listen-next link that wasn't in the search results). */
  dropped: string[];
  searchUrls: string[];
};

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    throw new MentorError("not_configured", "ANTHROPIC_API_KEY is not set on the server.");
  }
  // maxRetries 1: one quiet retry on 429/5xx keeps the 15 s target realistic.
  return (client ??= new Anthropic({ maxRetries: 1, timeout: 60_000 }));
}

/** Every URL inside server-tool result blocks (web search results, and web fetch if ever used). */
function resultUrls(content: Anthropic.Beta.BetaContentBlock[], into: Set<string>, raw: Set<string>) {
  const walk = (v: unknown) => {
    if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === "object") {
      for (const [k, x] of Object.entries(v)) {
        if (k === "url" && typeof x === "string" && /^https?:\/\//.test(x)) {
          into.add(urlKey(x));
          raw.add(x);
        } else walk(x);
      }
    }
  };
  for (const b of content) if (b.type.endsWith("_tool_result")) walk(b);
}

/** The answer tool's input, or JSON in the text as a fallback. */
function rawAnswer(content: Anthropic.Beta.BetaContentBlock[]): unknown {
  const tool = content.findLast((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "answer");
  if (tool) return tool.input;
  const text = content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map((b) => b.text).join("");
  const start = text.indexOf("{"), end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

const MAX_CONTINUES = 2;

export async function askClaude(input: MentorInput, needs: Omit<Needs, "searchUrls"> = {}): Promise<MentorResult> {
  const anthropic = getClient();
  const t0 = Date.now();
  const usage = emptyUsage();
  let cost = 0;
  let problem: string | undefined;
  const seen = new Set<string>(), seenRaw = new Set<string>();

  const params0 = buildRequest(input);
  /** The retry continues the same conversation when it can (below), so searches aren't redone. */
  let carried: Anthropic.Beta.BetaMessageParam[] | null = null;
  let firstRaw: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const params: ReturnType<typeof buildRequest> = carried ? params0 : buildRequest({ ...input, retryProblem: problem });
    const messages: Anthropic.Beta.BetaMessageParam[] = carried ?? [...params.messages];
    let response: Anthropic.Beta.BetaMessage | null = null;
    for (let turn = 0; turn <= MAX_CONTINUES; turn++) {
      try {
        response = await anthropic.beta.messages.create({
          ...params,
          messages,
          // Refusal fallback (claude-api skill default for Sonnet 5.5 on the Claude API): a false
          // positive from the safety classifiers is re-run on Anthropic's recommended model.
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        });
      } catch (error) {
        throw toMentorError(error, usage, cost);
      }
      cost += addUsage(usage, response.usage, response.model ?? MENTOR_MODEL);
      resultUrls(response.content, seen, seenRaw);
      // A long server-tool turn can pause; send it back unchanged to let it finish.
      if (response.stop_reason !== "pause_turn") break;
      messages.push({ role: "assistant", content: response.content as unknown as Anthropic.Beta.BetaContentBlockParam[] });
    }
    if (!response) break;
    if (response.stop_reason === "refusal") {
      throw new MentorError("refused", `Claude declined (${response.stop_details?.category ?? "no category"}).`, usage, round6(cost));
    }
    // A retry may resend only the corrected fields: lay them over the first answer's.
    const raw = rawAnswer(response.content);
    const merged = firstRaw && raw && typeof raw === "object" && typeof firstRaw === "object" ? { ...(firstRaw as object), ...(raw as object) } : raw;
    firstRaw ??= raw;
    const checked = checkAnswer(input.job, merged, { ...needs, searchUrls: seen });
    if (checked.ok) {
      return { answer: checked.answer, usage, costUsd: round6(cost), latencyMs: Date.now() - t0, dropped: checked.dropped, searchUrls: [...seenRaw] };
    }
    problem = response.stop_reason === "max_tokens" ? "The answer was cut off; keep it shorter." : checked.problem;
    // The answer tool was called but its input failed our checks: hand the problem back as that
    // call's error result, in the same conversation, so the model fixes the answer without
    // searching again (cheaper and faster than a fresh request).
    const call: Anthropic.Beta.BetaToolUseBlock | undefined = response.content.findLast((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === "answer");
    carried = call && response.stop_reason !== "max_tokens"
      ? [
          ...messages,
          { role: "assistant", content: response.content as unknown as Anthropic.Beta.BetaContentBlockParam[] },
          { role: "user", content: [{ type: "tool_result", tool_use_id: call.id, is_error: true, content: `Rejected: ${problem} Call the answer tool once more with the whole corrected answer (every field, not only the fix); don't search again.` }] },
        ]
      : null;
  }
  throw new MentorError("invalid", `The answer failed validation twice: ${problem}`, usage, round6(cost));
}

function toMentorError(error: unknown, usage: StoredUsage, cost: number): MentorError {
  if (error instanceof MentorError) return error;
  if (error instanceof Anthropic.APIConnectionTimeoutError) return new MentorError("timeout", "Claude took too long.", usage, round6(cost));
  if (error instanceof Anthropic.AuthenticationError) return new MentorError("not_configured", "Claude rejected ANTHROPIC_API_KEY.", usage, round6(cost));
  if (error instanceof Anthropic.RateLimitError) return new MentorError("busy", "Claude is rate-limited right now.", usage, round6(cost));
  if (error instanceof Anthropic.APIError) return new MentorError("api", `Claude API error ${error.status ?? ""}: ${error.message}`, usage, round6(cost));
  return new MentorError("api", error instanceof Error ? error.message : String(error), usage, round6(cost));
}

const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

/** Whether a job's answer may come back with a profile update that gets saved. */
export const UPDATES_PROFILE: ReadonlySet<Job> = new Set<Job>(["setup", "learn", "taste_session", "chat"]);
