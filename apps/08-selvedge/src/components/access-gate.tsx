"use client";

// The access-code form, shown on any page until this device has the code (then it's kept in
// a cookie for a year; see src/lib/server/access.ts).

import { useState } from "react";

export function AccessGate({ onOpen }: { onOpen: () => void }) {
  const [code, setCode] = useState("");
  const [wrong, setWrong] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    if (r.ok) onOpen(); else setWrong(true);
  }
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold tracking-tight">Selvedge</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <label className="text-sm text-muted-foreground" htmlFor="code">Access code</label>
        <input id="code" value={code} onChange={(e) => { setCode(e.target.value); setWrong(false); }} autoComplete="current-password" type="password"
          className="h-11 rounded-md border px-3 text-base" />
        {wrong && <p className="text-sm text-destructive">That&apos;s not the code.</p>}
        <button className="h-11 rounded-md bg-primary text-primary-foreground">Open</button>
      </form>
    </main>
  );
}
