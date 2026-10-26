import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addHabit, deleteHabit, logSlip, logUrge, toggleKept, undoSlip, updateHabit } from "./actions";
import { addDays, todayKey } from "./day";
import type { WontState } from "./habits";
import { emptyState, seed } from "./seed";
import { emptyStamps, isEmptyDoc, mergeDocs, readDoc, stampChanges, type SyncDoc } from "./sync";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const at = (y: number, mo: number, d: number, h: number, mi = 0) => {
  vi.setSystemTime(new Date(y, mo - 1, d, h, mi));
  return Date.now();
};

/** A device: its state and stamps, changed only through the real actions. */
class Device {
  doc: SyncDoc;
  constructor(state: WontState = emptyState()) {
    this.doc = { state, stamps: emptyStamps() };
  }
  do(fn: (s: WontState) => WontState) {
    const next = fn(this.doc.state);
    this.doc = { state: next, stamps: stampChanges(this.doc.state, next, this.doc.stamps, Date.now()) };
  }
  /** One round trip: the server merges (stored, mine), then I merge (mine, server's reply). */
  sync(server: { doc: SyncDoc }) {
    server.doc = mergeDocs(server.doc, this.doc);
    this.doc = mergeDocs(this.doc, server.doc);
  }
}
const emptyServer = () => ({ doc: { state: emptyState(), stamps: emptyStamps() } });

describe("first connect (the riskiest assumption: no data lost)", () => {
  it("a laptop with unsynced history uploads all of it to an empty server", () => {
    const now = at(2026, 10, 26, 9);
    const history = seed("owner-today", now);
    const laptop = new Device(history);
    const server = emptyServer();
    laptop.sync(server);
    expect(laptop.doc.state).toEqual(history);
    expect(server.doc.state.habits).toEqual(history.habits);
    expect(server.doc.state.logs).toEqual(history.logs);
  });

  it("an empty phone pulls the laptop's history and never wipes it", () => {
    const now = at(2026, 10, 26, 9);
    const history = seed("owner-today", now);
    const laptop = new Device(history);
    const phone = new Device({ ...emptyState(), introSeen: true });
    const server = emptyServer();
    laptop.sync(server);
    phone.sync(server);
    laptop.sync(server);
    expect(phone.doc.state.habits).toEqual(history.habits);
    expect(phone.doc.state.logs).toEqual(history.logs);
    expect(laptop.doc.state.logs).toEqual(history.logs);
  });

  it("the phone connecting first (empty) does not wipe the laptop that connects later", () => {
    const now = at(2026, 10, 26, 9);
    const history = seed("returning", now);
    const server = emptyServer();
    const phone = new Device({ ...emptyState(), introSeen: true });
    phone.sync(server);
    const laptop = new Device(history);
    laptop.sync(server);
    phone.sync(server);
    expect(laptop.doc.state.logs).toEqual(history.logs);
    expect(phone.doc.state.logs).toEqual(history.logs);
  });

  it("two devices that both have unsynced history keep both", () => {
    const now = at(2026, 10, 26, 9);
    const a = new Device(seed("returning", now));
    const b = new Device(addHabit(emptyState(), { kind: "build", name: "Read", anchor: "dinner", action: "read", goal: "one page" }, now));
    const server = emptyServer();
    a.sync(server);
    b.sync(server);
    a.sync(server);
    expect(a.doc.state.habits.map((h) => h.name).sort()).toEqual(["Nicotine pouches", "Read", "Up by 7:00"]);
    b.sync(server);
    expect(b.doc.state.logs).toEqual(a.doc.state.logs);
    expect(b.doc.state.habits.length).toBe(3);
  });
});

describe("later change wins per habit-day", () => {
  function pair() {
    const t0 = at(2026, 10, 26, 7);
    const laptop = new Device(seed("returning", t0));
    const phone = new Device();
    const server = emptyServer();
    laptop.sync(server);
    phone.sync(server);
    return { laptop, phone, server };
  }

  it("a tap on the phone reaches the laptop", () => {
    const { laptop, phone, server } = pair();
    at(2026, 10, 26, 7, 2);
    phone.do((s) => toggleKept(s, "up", todayKey(), todayKey(), Date.now()));
    phone.sync(server);
    laptop.sync(server);
    expect(laptop.doc.state.logs.up[todayKey()].kept).toBeDefined();
  });

  it("an undo carries over and the tap doesn't come back", () => {
    const { laptop, phone, server } = pair();
    at(2026, 10, 26, 7, 2);
    phone.do((s) => toggleKept(s, "up", todayKey(), todayKey(), Date.now()));
    phone.sync(server);
    laptop.sync(server);
    at(2026, 10, 26, 7, 5);
    laptop.do((s) => toggleKept(s, "up", todayKey(), todayKey(), Date.now()));
    laptop.sync(server);
    phone.sync(server);
    expect(phone.doc.state.logs.up[todayKey()]).toBeUndefined();
  });

  it("offline on both devices: different habits both survive, the same habit-day takes the later", () => {
    const { laptop, phone, server } = pair();
    const today = todayKey();
    at(2026, 10, 26, 7, 1);
    phone.do((s) => toggleKept(s, "up", today, today, Date.now()));
    at(2026, 10, 26, 7, 3);
    laptop.do((s) => toggleKept(s, "pouches", today, today, Date.now()));
    at(2026, 10, 26, 21);
    phone.do((s) => logSlip(s, "pouches", today, "2", today, Date.now()));
    // Both come back online: laptop first, then phone.
    laptop.sync(server);
    phone.sync(server);
    laptop.sync(server);
    expect(laptop.doc.state.logs.up[today].kept).toBeDefined();
    expect(laptop.doc.state.logs.pouches[today].slip?.size).toBe("2");
    expect(phone.doc.state).toEqual(laptop.doc.state);
  });

  it("yesterday re-logged on one device merges into the other", () => {
    const { laptop, phone, server } = pair();
    const yesterday = addDays(todayKey(), -1);
    at(2026, 10, 26, 8);
    phone.do((s) => logSlip(s, "pouches", yesterday, "1", todayKey(), Date.now()));
    phone.do((s) => undoSlip(s, "pouches", yesterday, todayKey()));
    phone.sync(server);
    laptop.sync(server);
    expect(laptop.doc.state.logs.pouches[yesterday].slip).toBeUndefined();
    expect(laptop.doc.state.logs.pouches[yesterday].clean).toBeDefined();
  });

  it("over midnight: a 00:30 tap belongs to the evening before on both devices", () => {
    const { laptop, phone, server } = pair();
    at(2026, 10, 27, 0, 30);
    const evening = todayKey();
    expect(evening).toBe("2026-10-26");
    phone.do((s) => logUrge(s, "pouches", Date.now()));
    phone.sync(server);
    laptop.sync(server);
    expect(laptop.doc.state.logs.pouches["2026-10-26"].urges).toHaveLength(1);
  });
});

describe("habits", () => {
  it("a delete carries over, takes its days, and an older edit doesn't bring it back", () => {
    const t0 = at(2026, 10, 26, 7);
    const laptop = new Device(seed("returning", t0));
    const phone = new Device();
    const server = emptyServer();
    laptop.sync(server);
    phone.sync(server);
    at(2026, 10, 26, 8);
    phone.do((s) => updateHabit(s, "up", { name: "Up by 6:45" }));
    at(2026, 10, 26, 9);
    laptop.do((s) => deleteHabit(s, "up"));
    laptop.sync(server);
    phone.sync(server);
    expect(phone.doc.state.habits.map((h) => h.id)).toEqual(["pouches"]);
    expect(phone.doc.state.logs.up).toBeUndefined();
  });

  it("a later wording edit wins", () => {
    const t0 = at(2026, 10, 26, 7);
    const laptop = new Device(seed("returning", t0));
    const phone = new Device();
    const server = emptyServer();
    laptop.sync(server);
    phone.sync(server);
    at(2026, 10, 26, 8);
    laptop.do((s) => updateHabit(s, "up", { name: "Up by 6:45" }));
    at(2026, 10, 26, 9);
    phone.do((s) => updateHabit(s, "up", { name: "Up by 7:15" }));
    laptop.sync(server);
    phone.sync(server);
    laptop.sync(server);
    expect(laptop.doc.state.habits.find((h) => h.id === "up")?.name).toBe("Up by 7:15");
  });

  it("seen comebacks only move forward and the intro stays seen", () => {
    const a: SyncDoc = { state: { ...emptyState(), habits: seed("returning").habits, comebacksSeen: { up: "2026-10-20" }, introSeen: true }, stamps: emptyStamps() };
    const b: SyncDoc = { state: { ...emptyState(), habits: seed("returning").habits, comebacksSeen: { up: "2026-10-24" } }, stamps: emptyStamps() };
    const m = mergeDocs(a, b);
    expect(m.state.comebacksSeen.up).toBe("2026-10-24");
    expect(m.state.introSeen).toBe(true);
  });
});

describe("readDoc", () => {
  it("turns junk into an empty document and drops bad stamps", () => {
    expect(isEmptyDoc(readDoc(null))).toBe(true);
    expect(isEmptyDoc(readDoc({ state: { version: 9 }, stamps: { days: { "x|2026-10-26": "soon" } } }))).toBe(true);
    expect(readDoc({ stamps: { habits: { up: 5 } } }).stamps.habits).toEqual({ up: 5 });
  });
});
