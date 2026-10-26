"use client";

import Link from "next/link";
import { useState } from "react";
import { copy } from "@/lib/copy";
import { connect, disconnect, useSyncStatus } from "@/lib/sync-client";

// The Sync screen (v1.1), in the habit form's style: a back link, a title, one field and the
// primary button. Once on, it shows when it last synced and a quiet way to turn it off.
export function SyncScreen() {
  const s = useSyncStatus();
  const c = copy.sync;
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || !code.trim()) return;
    setBusy(true);
    setProblem(null);
    setStopped(false);
    const r = await connect(code.trim());
    setBusy(false);
    if (r === "wrong") setProblem(c.wrong);
    else if (r === "offline") setProblem(c.offline);
    else setCode("");
  };

  const time = (t?: number) => (t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "");
  const line =
    s.status === "offline" ? c.status.offline
      : s.status === "error" ? c.status.error
        : s.status === "synced" && s.lastSynced ? c.status.synced(time(s.lastSynced))
          : c.status.syncing;

  return (
    <main className="w">
      <header className="w-head w-head-form">
        <Link href="/" className="w-back">{c.back}</Link>
        <h1>{s.connected ? c.onTitle : c.title}</h1>
        <p>{s.connected ? c.onBody : s.status === "denied" ? c.denied : c.intro}</p>
        {/* Feedback 46: say that stopping worked and that the board stays. */}
        {!s.connected && stopped && <p role="status" className="w-sync-stopped">{c.stopped}</p>}
      </header>

      {s.connected ? (
        <div className="w-form">
          <p className="w-field w-sync-status" role="status">{line}</p>
          <button
            type="button"
            className="w-link"
            onClick={() => {
              setStopped(true);
              void disconnect();
            }}
          >
            {c.off}
          </button>
          <p className="w-label w-sync-note">{c.offNote}</p>
        </div>
      ) : (
        <form className="w-form" onSubmit={submit}>
          <div className="w-field">
            <label htmlFor="code">{c.label}</label>
            <input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setProblem(null);
              }}
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!problem || undefined}
              aria-describedby={problem ? "code-note" : "code-hint"}
            />
            {problem ? <small id="code-note" className="w-note" role="alert">{problem}</small> : <small id="code-hint">{c.keeps}</small>}
          </div>
          <button type="submit" className="w-primary" disabled={busy}>{busy ? c.connecting : c.connect}</button>
        </form>
      )}
    </main>
  );
}
