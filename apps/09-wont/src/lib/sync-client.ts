"use client";

// The browser half of sync (v1.1, L27). Local-first: a tap is saved to localStorage at once by
// store.ts, which also stamps what changed (recordChange). This module then sends the whole
// document to /api/sync in the background and merges the reply back in (L28). Offline, nothing
// waits: the stamps keep the changes until the next sync (on open, focus, back online, a minute
// later, or shortly after a tap).
import { useSyncExternalStore } from "react";
import type { WontState } from "./habits";
import { migrate } from "./migrate";
import { mergeDocs, readDoc, stampChanges, type Stamps } from "./sync";
import { writeLocalStorage } from "./use-local-storage";

const STATE_KEY = "wont:v1"; // = STORAGE_KEY in store.ts (not imported: store.ts imports us)
export const SYNC_KEY = "wont:sync";

export type SyncStatus = "off" | "syncing" | "synced" | "offline" | "denied" | "error";
interface Meta {
  stamps: Stamps;
  /** This device has a working access code (set after /api/access says yes). */
  connected: boolean;
  /** Which document the code opens; seeding is refused on the owner's (store.ts). */
  space?: "owner" | "sandbox";
  lastSynced?: number;
}

function readJson(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function readMeta(): Meta {
  const m = (readJson(SYNC_KEY) ?? {}) as Partial<Meta>;
  return {
    stamps: readDoc({ stamps: m.stamps }).stamps,
    connected: !!m.connected,
    space: m.space === "owner" || m.space === "sandbox" ? m.space : undefined,
    lastSynced: typeof m.lastSynced === "number" ? m.lastSynced : undefined,
  };
}

function writeMeta(m: Meta) {
  try {
    window.localStorage.setItem(SYNC_KEY, JSON.stringify(m));
  } catch {}
  emit();
}

// Status for the UI (the Sync screen and the board's footer link).
let status: SyncStatus = "off";
const subs = new Set<() => void>();
function emit() {
  snapshot = null;
  subs.forEach((f) => f());
}
function setStatus(s: SyncStatus) {
  if (s !== status) {
    status = s;
    emit();
  }
}
type Snapshot = { status: SyncStatus; connected: boolean; lastSynced?: number; space?: Meta["space"] };
let snapshot: Snapshot | null = null;
const SERVER_SNAPSHOT: Snapshot = { status: "off", connected: false };
function getSnapshot() {
  if (!snapshot) {
    const m = readMeta();
    snapshot = { status: m.connected ? (status === "off" ? "syncing" : status) : status === "denied" ? "denied" : "off", connected: m.connected, lastSynced: m.lastSynced, space: m.space };
  }
  return snapshot;
}
function subscribe(f: () => void) {
  subs.add(f);
  return () => subs.delete(f);
}
export function useSyncStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
}
export const syncSpace = () => readMeta().space;

/** Called by store.ts for every local change: stamp it and sync soon. */
export function recordChange(prev: WontState, next: WontState) {
  const m = readMeta();
  writeMeta({ ...m, stamps: stampChanges(prev, next, m.stamps, Date.now()) });
  if (m.connected) syncSoon();
}

let timer: number | undefined;
export function syncSoon(ms = 800) {
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncNow(), ms);
}

let inFlight: Promise<void> | null = null;
let again = false;

/** One round trip. Overlapping calls fold into one follow-up run. */
export function syncNow(): Promise<void> {
  if (inFlight) {
    again = true;
    return inFlight;
  }
  inFlight = run().finally(() => {
    inFlight = null;
    if (again) {
      again = false;
      void syncNow();
    }
  });
  return inFlight;
}

async function run() {
  const before = readMeta();
  if (!before.connected) return;
  if (typeof navigator !== "undefined" && navigator.onLine === false) return setStatus("offline");
  setStatus("syncing");
  const sent = { state: migrate(readJson(STATE_KEY)), stamps: before.stamps };
  let res: Response;
  try {
    res = await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ doc: sent }) });
  } catch {
    return setStatus("offline");
  }
  if (res.status === 401) {
    writeMeta({ ...readMeta(), connected: false });
    return setStatus("denied");
  }
  if (!res.ok) return setStatus("error");
  const body = (await res.json().catch(() => null)) as { doc?: unknown; space?: Meta["space"] } | null;
  if (!body?.doc) return setStatus("error");
  // Merge with what's on the device now: taps made while the request was out stay (their
  // stamps are newer than anything the server could have).
  const now = readMeta();
  const local = { state: migrate(readJson(STATE_KEY)), stamps: now.stamps };
  const merged = mergeDocs(local, readDoc(body.doc));
  writeLocalStorage(STATE_KEY, merged.state);
  writeMeta({ ...now, stamps: merged.stamps, space: body.space ?? now.space, lastSynced: Date.now() });
  setStatus("synced");
}

/** Types the access code: on yes, this device is connected and syncs at once. */
export async function connect(code: string): Promise<"ok" | "wrong" | "offline"> {
  let res: Response;
  try {
    res = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
  } catch {
    return "offline";
  }
  if (!res.ok) return "wrong";
  writeMeta({ ...readMeta(), connected: true });
  await syncNow();
  return "ok";
}

/** Sync off on this device. Its data stays; stamps stay so a later reconnect merges correctly. */
export async function disconnect() {
  await fetch("/api/access", { method: "DELETE" }).catch(() => null);
  writeMeta({ ...readMeta(), connected: false, space: undefined });
  setStatus("off");
}

/** Starts the background syncing for this tab (mounted once in the layout). */
export function startSync(): () => void {
  const onVisible = () => document.visibilityState === "visible" && syncSoon(0);
  const onOnline = () => syncSoon(0);
  const onOffline = () => readMeta().connected && setStatus("offline");
  // Another tab changed the stamps or connected: pick it up.
  const onStorage = (e: StorageEvent) => e.key === SYNC_KEY && emit();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", onOnline);
  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  window.addEventListener("storage", onStorage);
  const every = window.setInterval(() => void syncNow(), 60_000);
  void syncNow();
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", onOnline);
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
    window.removeEventListener("storage", onStorage);
    window.clearInterval(every);
  };
}
