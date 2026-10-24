import { describe, expect, it } from "vitest";
import { activeItem, EMPTY_QUEUE, nextQueued, queueCounts, queueReducer, sanitiseQueue, type QueueAction, type QueueState } from "./queue";

const now = "2026-10-23T20:00:00.000Z";
const A = "https://soundcloud.com/a/one", B = "https://soundcloud.com/b/two", C = "https://soundcloud.com/c/three";
const run = (state: QueueState, ...actions: QueueAction[]) => actions.reduce(queueReducer, state);
const added = run(EMPTY_QUEUE, { type: "add", tracks: [{ url: A }, { url: B, title: "Two" }, { url: C }], now });
const status = (s: QueueState) => s.items.map((i) => i.status);

describe("queueReducer", () => {
  it("adds tracks in order, without duplicates", () => {
    expect(added.items.map((i) => i.id)).toEqual([A, B, C]);
    expect(status(added)).toEqual(["queued", "queued", "queued"]);
    const again = run(added, { type: "add", tracks: [{ url: A }, { url: B }], now });
    expect(again.items).toHaveLength(3);
    expect(nextQueued(added)?.id).toBe(A);
  });

  it("walks one track through loading, 4 snippets, analysing and done", () => {
    let s = run(added, { type: "start", id: A, now }, { type: "loaded", id: A, title: "One", uploader: "a", durationMs: 360000, now });
    expect(activeItem(s)?.title).toBe("One");
    s = run(s, { type: "listening", id: A, snippet: 2, of: 4, seconds: 12, snippetSeconds: 30, now });
    expect(activeItem(s)?.progress).toEqual({ snippet: 2, of: 4, seconds: 12, snippetSeconds: 30 });
    s = run(s, { type: "analysing", id: A, now }, { type: "done", id: A, resultId: "r1", now });
    expect(s.items[0]).toMatchObject({ status: "done", resultId: "r1" });
    expect(s.items[0].progress).toBeUndefined();
    expect(nextQueued(s)?.id).toBe(B);
  });

  it("runs only one track at a time", () => {
    const s = run(added, { type: "start", id: A, now }, { type: "start", id: B, now });
    expect(status(s)).toEqual(["loading", "queued", "queued"]);
  });

  it("ignores out-of-order transitions", () => {
    expect(run(added, { type: "analysing", id: A, now })).toBe(added);
    expect(run(added, { type: "done", id: A, resultId: "x", now })).toBe(added);
    expect(run(added, { type: "listening", id: "nope", snippet: 1, of: 4, seconds: 0, snippetSeconds: 30, now })).toBe(added);
  });

  it("fails with a reason, and retry or re-adding puts it back in line", () => {
    const failed = run(added, { type: "start", id: A, now }, { type: "fail", id: A, reason: "geo-blocked", message: "Not available in your country", now });
    expect(failed.items[0]).toMatchObject({ status: "failed", reason: "geo-blocked" });
    const retried = run(failed, { type: "retry", id: A, now }).items[0];
    expect(retried.status).toBe("queued");
    expect(retried.reason).toBeUndefined();
    expect(run(failed, { type: "add", tracks: [{ url: A }], now }).items[0].status).toBe("queued");
  });

  it("re-adding a done track leaves it done", () => {
    const done = run(added, { type: "start", id: A, now }, { type: "listening", id: A, snippet: 1, of: 1, seconds: 30, snippetSeconds: 30, now }, { type: "analysing", id: A, now }, { type: "done", id: A, resultId: "r", now });
    expect(run(done, { type: "add", tracks: [{ url: A }], now }).items[0].status).toBe("done");
  });

  it("cancel = fail with reason cancelled; requeue restarts the track", () => {
    const listening = run(added, { type: "start", id: A, now }, { type: "listening", id: A, snippet: 3, of: 4, seconds: 5, snippetSeconds: 30, now });
    expect(run(listening, { type: "fail", id: A, reason: "cancelled", now }).items[0]).toMatchObject({ status: "failed", reason: "cancelled" });
    const back = run(listening, { type: "requeue", id: A, now });
    expect(back.items[0].status).toBe("queued");
    expect(back.items[0].progress).toBeUndefined();
  });

  it("restore after a reload: the active track goes back to queued, the rest is kept", () => {
    const mid = run(added, { type: "start", id: A, now }, { type: "listening", id: A, snippet: 2, of: 4, seconds: 9, snippetSeconds: 30, now });
    const restored = run(mid, { type: "restore", now });
    expect(status(restored)).toEqual(["queued", "queued", "queued"]);
    expect(run(added, { type: "restore", now })).toBe(added);
  });

  it("removes one item and clears all", () => {
    expect(run(added, { type: "remove", id: B }).items.map((i) => i.id)).toEqual([A, C]);
    expect(run(added, { type: "clear" }).items).toEqual([]);
  });

  it("counts by status", () => {
    const s = run(added, { type: "start", id: A, now }, { type: "fail", id: A, reason: "no-audio", now }, { type: "start", id: B, now });
    expect(queueCounts(s)).toEqual({ total: 3, queued: 1, active: 1, done: 0, failed: 1 });
  });
});

describe("sanitiseQueue", () => {
  it("drops junk from storage", () => {
    expect(sanitiseQueue(null)).toEqual(EMPTY_QUEUE);
    expect(sanitiseQueue({ items: "x" })).toEqual(EMPTY_QUEUE);
    const s = sanitiseQueue({ version: 1, items: [added.items[0], { id: 1 }, { id: "x", url: "y", status: "weird" }] });
    expect(s.items.map((i) => i.id)).toEqual([A]);
  });
});
