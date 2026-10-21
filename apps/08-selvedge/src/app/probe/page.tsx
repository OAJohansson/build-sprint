"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { clearShares, listShares, type Share } from "@/lib/share-store";

// The share-target spike: shows exactly what each app sent, so we know whether Instagram,
// Pinterest and the gallery give us a picture or only a link.
// shortcut: a throwaway probe page, replace with the real inbox once the probe is written up.
// Browser only: it reads IndexedDB, the URL and the display mode on first render.
export default dynamic(() => Promise.resolve(ProbeView), { ssr: false });

type Shown = Share & { previews: string[] };

function ProbeView() {
  const [shares, setShares] = useState<Shown[] | null>(null);
  const [missed] = useState(() => new URLSearchParams(window.location.search).get("missed"));
  const [status] = useState(() => ({
    installed: window.matchMedia("(display-mode: standalone)").matches,
    worker: Boolean(navigator.serviceWorker?.controller),
  }));
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // shortcut: preview URLs are never revoked; fine for a handful of probe shares.
    listShares().then(
      (all) => setShares(all.map((s) => ({ ...s, previews: s.files.map((f) => URL.createObjectURL(f.blob)) }))),
      () => setShares([]),
    );
  }, []);

  async function copy() {
    await navigator.clipboard.writeText((shares ?? []).map(summary).join("\n"));
    setCopied(true);
  }

  async function clear() {
    await clearShares();
    setShares([]);
  }

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 p-6 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Share probe</h1>
        <p className="text-sm text-muted-foreground">
          {status.installed ? "Installed" : "Not opened as the installed app"} · service worker{" "}
          {status.worker ? "ready" : "not running yet"}
        </p>
      </header>

      {missed && (
        <p className="rounded-md border border-destructive/40 p-3 text-sm">
          A share arrived before the app was ready, so it wasn&apos;t kept (it sent: {missed}).
          Share it again.
        </p>
      )}

      {shares === null ? null : shares.length === 0 ? (
        <p className="text-muted-foreground">
          Nothing yet. Share a post from Instagram, a pin from Pinterest and a screenshot from your
          gallery, and choose Selvedge.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {shares.map((s) => (
            <li key={s.id} className="flex flex-col gap-2 rounded-lg border p-4">
              <p className="text-xs text-muted-foreground tabular-nums">
                {new Date(s.at).toLocaleString()}
              </p>
              {Object.entries(s.fields).map(([k, v]) => (
                <p key={k} className="text-sm break-words">
                  <span className="font-medium">{k}:</span> {v || <em>empty</em>}
                </p>
              ))}
              {s.files.map((f, i) => (
                <FileRow key={i} file={f} src={s.previews[i]} />
              ))}
              {s.files.length === 0 && <p className="text-sm text-muted-foreground">No image</p>}
            </li>
          ))}
        </ul>
      )}

      {shares && shares.length > 0 && (
        <div className="flex gap-3">
          <Button onClick={copy}>{copied ? "Copied" : "Copy as text"}</Button>
          <Button variant="ghost" onClick={clear}>
            Clear
          </Button>
        </div>
      )}
    </main>
  );
}

function FileRow({ file, src }: { file: Share["files"][number]; src: string }) {
  return (
    <div className="flex items-center gap-3">
      {file.type.startsWith("image/") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-16 rounded object-cover" />
      )}
      <p className="text-sm">
        {file.name || "unnamed"} · {file.type || "no type"} · {Math.round(file.size / 1024)} KB
      </p>
    </div>
  );
}

function summary(s: Share) {
  const fields = Object.entries(s.fields).map(([k, v]) => `${k}: ${v || "(empty)"}`);
  const files = s.files.map((f) => `file: ${f.type || "no type"}, ${Math.round(f.size / 1024)} KB`);
  return [new Date(s.at).toLocaleTimeString(), ...fields, ...(files.length ? files : ["no image"])].join(" | ");
}
