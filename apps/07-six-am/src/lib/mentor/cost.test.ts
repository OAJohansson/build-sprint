import { describe, expect, it } from "vitest";
import { addUsage, emptyUsage, estimateCost } from "./cost";

describe("estimateCost (Sonnet 5.5: $2 in, $10 out, $2.50 cache write, $0.20 cache read, $0.01 per search)", () => {
  it("prices a normal answer: input, output, a cache write and a cache read, one search", () => {
    const usage = {
      input_tokens: 1_000, output_tokens: 500, cache_creation_input_tokens: 2_000, cache_read_input_tokens: 3_000,
      cache_creation: { ephemeral_5m_input_tokens: 2_000, ephemeral_1h_input_tokens: 0 },
      server_tool_use: { web_search_requests: 1 },
    };
    // 0.002 + 0.005 + 0.005 + 0.0006 + 0.01
    expect(estimateCost(usage)).toBeCloseTo(0.0226, 6);
  });
  it("no searches: tokens only, and a null server_tool_use is fine", () => {
    expect(estimateCost({ input_tokens: 1_000_000, output_tokens: 0, server_tool_use: null })).toBe(2);
    expect(estimateCost({ input_tokens: 0, output_tokens: 1_000_000 })).toBe(10);
  });
  it("all cached: only cache reads plus output", () => {
    expect(estimateCost({ input_tokens: 0, cache_read_input_tokens: 1_000_000, output_tokens: 0 })).toBeCloseTo(0.2, 6);
  });
  it("prices 1-hour cache writes at 2x input", () => {
    expect(estimateCost({ cache_creation_input_tokens: 1_000_000, cache_creation: { ephemeral_1h_input_tokens: 1_000_000 } })).toBe(4);
  });
  it("empty or junk usage is $0", () => {
    expect(estimateCost({})).toBe(0);
    expect(estimateCost({ input_tokens: -5, output_tokens: Number.NaN })).toBe(0);
  });
  it("an unknown model is priced as Sonnet 5.5; a fallback to Opus 4.8 at its own price", () => {
    expect(estimateCost({ input_tokens: 1_000_000 }, "claude-unknown")).toBe(2);
    expect(estimateCost({ input_tokens: 1_000_000 }, "claude-opus-4-8")).toBe(5);
  });
  it("sums several calls of one answer (retry, paused turn)", () => {
    const total = emptyUsage();
    const a = addUsage(total, { input_tokens: 1000, output_tokens: 100, server_tool_use: { web_search_requests: 2 } }, "claude-sonnet-5-5");
    const b = addUsage(total, { input_tokens: 500, output_tokens: 100 }, "claude-sonnet-5-5");
    expect(total.calls).toBe(2);
    expect(total.input_tokens).toBe(1500);
    expect(total.server_tool_use.web_search_requests).toBe(2);
    expect(a + b).toBeCloseTo(estimateCost(total), 6);
  });
});
