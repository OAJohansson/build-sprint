// Cost estimate per Mentor answer (M14, unit test 1). An estimate is the bar (rabbit hole: perfect
// cost accounting). Pure, no SDK import, so it runs in tests and the browser alike.

export const MENTOR_MODEL = "claude-sonnet-5-5";

/** US dollars per million tokens, and per web search. */
export type Price = {
  input: number;
  output: number;
  /** 5-minute cache write (1.25× input). */
  cacheWrite5m: number;
  /** 1-hour cache write (2× input); unused today, kept so a TTL change doesn't break the estimate. */
  cacheWrite1h: number;
  cacheRead: number;
  /** Per single web search ($10 per 1,000). */
  webSearch: number;
};

// Published Claude API list prices as cached in Anthropic's claude-api skill (model table "cached
// 2026-10-06", read 2026-10-24): Claude Sonnet 5.5 $2 input / $10 output per MTok, cache reads
// $0.20; cache writes 1.25× input for the 5-minute TTL and 2× for 1 hour; web search $10 per 1,000
// searches. Thinking tokens are billed as output (already inside output_tokens).
// Claude Opus 4.8 is listed because the server-side refusal fallback ("default") may answer instead
// ($5 / $25, cache read 0.1×).
// shortcut: hand-copied price table, re-check https://claude.com/pricing when the model or prices change.
export const PRICES: Record<string, Price> = {
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite5m: 2.5, cacheWrite1h: 4, cacheRead: 0.2, webSearch: 0.01 },
  "claude-opus-4-8": { input: 5, output: 25, cacheWrite5m: 6.25, cacheWrite1h: 10, cacheRead: 0.5, webSearch: 0.01 },
};

/** The parts of the API's usage object the estimate needs (all optional: the API sends nulls). */
export type UsageLike = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null;
  server_tool_use?: { web_search_requests?: number | null } | null;
};

const num = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : 0);

/** Dollars for one API call, rounded to 6 decimals. Unknown models are priced as Sonnet 5.5. */
export function estimateCost(usage: UsageLike, model: string = MENTOR_MODEL): number {
  const p = PRICES[model] ?? PRICES[MENTOR_MODEL];
  const write = num(usage.cache_creation_input_tokens);
  const w1h = Math.min(write, num(usage.cache_creation?.ephemeral_1h_input_tokens));
  const w5m = write - w1h;
  const dollars =
    (num(usage.input_tokens) * p.input +
      num(usage.output_tokens) * p.output +
      w5m * p.cacheWrite5m +
      w1h * p.cacheWrite1h +
      num(usage.cache_read_input_tokens) * p.cacheRead) /
      1_000_000 +
    num(usage.server_tool_use?.web_search_requests) * p.webSearch;
  return Math.round(dollars * 1e6) / 1e6;
}

/** The compact usage record stored with each answer (summed when one answer took several calls). */
export type StoredUsage = {
  model: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
  cache_creation: { ephemeral_5m_input_tokens: number; ephemeral_1h_input_tokens: number };
  server_tool_use: { web_search_requests: number };
};

export function emptyUsage(model: string = MENTOR_MODEL): StoredUsage {
  return {
    model,
    calls: 0,
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 0 },
    server_tool_use: { web_search_requests: 0 },
  };
}

/** Adds one call's usage into the running total; also returns the call's own cost. */
export function addUsage(total: StoredUsage, u: UsageLike, model: string): number {
  total.calls += 1;
  total.model = model;
  total.input_tokens += num(u.input_tokens);
  total.output_tokens += num(u.output_tokens);
  total.cache_creation_input_tokens += num(u.cache_creation_input_tokens);
  total.cache_read_input_tokens += num(u.cache_read_input_tokens);
  total.cache_creation.ephemeral_5m_input_tokens += num(u.cache_creation?.ephemeral_5m_input_tokens);
  total.cache_creation.ephemeral_1h_input_tokens += num(u.cache_creation?.ephemeral_1h_input_tokens);
  total.server_tool_use.web_search_requests += num(u.server_tool_use?.web_search_requests);
  return estimateCost(u, model);
}
