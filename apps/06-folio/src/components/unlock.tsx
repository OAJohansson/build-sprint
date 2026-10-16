"use client";

import { useState } from "react";
import { Mascot } from "./mascot";

// The access code, typed once per device (decision 0015).
export function Unlock({ error, onUnlock }: { error: string | null; onUnlock: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form
        className="w-full max-w-xs"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) onUnlock(code.trim());
        }}
      >
        <div className="flex items-center gap-2">
          <Mascot size={40} />
          <h1 className="text-[26px] font-semibold tracking-tight">Folio</h1>
        </div>
        <label htmlFor="code" className="mt-8 block text-[14px] text-[var(--f-muted)]">
          Access code
        </label>
        <input
          id="code"
          name="access-code"
          type="password"
          autoComplete="current-password"
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
          className="mt-2 w-full rounded-xl bg-[var(--f-raised)] px-3.5 py-3 outline-none shadow-[0_0_0_1px_var(--f-line)] focus:shadow-[0_0_0_1.5px_var(--f-muted)]"
        />
        {error && (
          <p role="alert" className="mt-3 text-[14px] text-red-300">
            {error}
          </p>
        )}
        <button type="submit" className="mt-5 w-full rounded-full bg-[var(--f-text)] py-3 text-[15px] font-medium text-[var(--f-bg)]">
          Open my shelves
        </button>
      </form>
    </main>
  );
}
