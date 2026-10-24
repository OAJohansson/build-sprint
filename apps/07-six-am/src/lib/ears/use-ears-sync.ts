"use client";

// Ears results and My genre on the server (M15, L51). localStorage stays the cache the queue
// writes to (so Ears keeps working offline and the queue is unchanged); this hook mirrors it:
// once per browser it imports the local results (POST, never overwrites), then loads the server's
// list into the cache, and from then on PUTs every new or changed result and deletes cleared ones.
// Changes made while offline or locked are kept as "pending" and pushed on the next load; a result
// only this browser has is always pushed, never dropped.
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";
import { mentorApi } from "@/lib/mentor/client";
import { useLocalStorage } from "@/lib/use-local-storage";
import { RESULTS_KEY, type EarsAnalysis } from "./results";

const IMPORTED_KEY = "six-am:ears-imported:v1";
const PENDING_KEY = "six-am:ears-pending:v1";
const NO_RESULTS: EarsAnalysis[] = [];
const NO_IDS: string[] = [];

export type SyncState = "local" | "syncing" | "synced" | "locked" | "offline";

const json = (a: EarsAnalysis) => JSON.stringify(a);
const newestFirst = (a: EarsAnalysis, b: EarsAnalysis) => b.analysedAt.localeCompare(a.analysedAt);

/** `skip` drops server rows (dev only: the demo's copies, see DemoAnalyse). */
export function useEarsSync(code: string, skip?: ReadonlySet<string>): SyncState {
  const [rawResults, setResults] = useLocalStorage<EarsAnalysis[]>(RESULTS_KEY, NO_RESULTS);
  const results = Array.isArray(rawResults) ? rawResults : NO_RESULTS;
  const [imported, setImported] = useLocalStorage<boolean>(IMPORTED_KEY, false);
  const [rawPending, setPending] = useLocalStorage<string[]>(PENDING_KEY, NO_IDS);
  const pending = Array.isArray(rawPending) ? rawPending : NO_IDS;
  const [state, setState] = useState<SyncState>("local");
  /** What the server holds, as last seen or saved (id → JSON); null until the first load. */
  const synced = useRef<Map<string, string> | null>(null);
  const latest = useRef({ results, pending, imported });
  useEffect(() => { latest.current = { results, pending, imported }; });

  const fail = (e: unknown) => setState(e instanceof ApiError && e.status === 401 ? "locked" : "offline");

  // Load: import once, then the server's list is the truth, plus whatever is pending here.
  useEffect(() => {
    let live = true;
    synced.current = null;
    const api = mentorApi(code);
    (async () => {
      setState("syncing");
      try {
        const { results: local, pending: waiting, imported: done } = latest.current;
        if (!done) {
          if (local.length) await api.importAnalyses(local);
          setImported(true);
        }
        let server = await api.analyses();
        if (skip?.size) server = server.filter((a) => !skip.has(a.id));
        if (!live) return;
        const byId = new Map(server.map((a) => [a.id, a]));
        // shortcut: a result deleted in another browser comes back if this one still has it; add
        // tombstones if Clear list is used across browsers.
        const push = local.filter((a) => waiting.includes(a.id) || !byId.has(a.id));
        for (const a of push) await api.putAnalysis(a);
        if (!live) return;
        for (const a of push) byId.set(a.id, a);
        const merged = [...byId.values()].sort(newestFirst);
        synced.current = new Map(merged.map((a) => [a.id, json(a)]));
        setResults(merged);
        setPending(NO_IDS);
        setState("synced");
      } catch (e) {
        if (live) fail(e);
      }
    })();
    return () => { live = false; };
    // skip is a constant set; the load runs once per access code.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Before the load (or while locked / offline): remember which results changed here.
  const prev = useRef(results);
  useEffect(() => {
    const before = new Map(prev.current.map((a) => [a.id, json(a)]));
    prev.current = results;
    if (synced.current) return;
    const changed = results.filter((a) => before.get(a.id) !== json(a)).map((a) => a.id);
    // From empty (the first read of the cache) nothing is "changed"; a brand-new result is local-only
    // and gets pushed anyway.
    if (changed.length && before.size > 0) {
      setPending((p) => [...new Set([...(Array.isArray(p) ? p : []), ...changed])]);
    }
  }, [results, setPending]);

  // After the load: push what changed here (a new analysis, a My genre edit), remove what was cleared.
  useEffect(() => {
    const known = synced.current;
    if (!known) return;
    const api = mentorApi(code);
    const changed = results.filter((a) => known.get(a.id) !== json(a));
    const here = new Set(results.map((a) => a.id));
    const gone = [...known.keys()].filter((id) => !here.has(id));
    for (const a of changed) {
      known.set(a.id, json(a));
      api.putAnalysis(a).catch((e) => {
        known.delete(a.id);
        setPending((p) => [...new Set([...(Array.isArray(p) ? p : []), a.id])]);
        fail(e);
      });
    }
    if (gone.length) {
      gone.forEach((id) => known.delete(id));
      // shortcut: a delete that fails offline is not retried; the rows come back on the next load.
      api.deleteAnalyses(gone).catch(fail);
    }
  }, [results, code, setPending]);

  return state;
}
