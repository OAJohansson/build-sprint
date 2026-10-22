"use client";

/* eslint-disable @next/next/no-img-element */
// The inbox: where a share lands. What's still waiting on this phone (and why), then every save,
// newest first. A link whose picture couldn't be fetched asks for a screenshot (requirement 3b).
// shortcut: plain styling for step 2, designed in step 3 (the inbox's own design session).

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { imageUrl, type Save } from "@/lib/library";
import { AccessGate } from "@/components/access-gate";
import { dropFromQueue, listQueue, onQueueChange, retryUploads, type QueueItem } from "@/lib/queue";

export default dynamic(() => Promise.resolve(Inbox), { ssr: false });

const WAITING: Record<QueueItem["state"], string> = {
  queued: "Saving…",
  offline: "Waiting for a connection",
  locked: "Waiting for your access code",
  failed: "Couldn't save. It'll try again",
  unreadable: "This picture type can't be opened",
};

function Inbox() {
  const [access, setAccess] = useState<boolean | null>(null);
  const [saves, setSaves] = useState<Save[] | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [params] = useState(() => new URLSearchParams(location.search));

  const refresh = useCallback(() => {
    listQueue().then(setQueue, () => setQueue([]));
    fetch("/api/saves").then((r) => (r.ok ? r.json() : null)).then((d) => d && setSaves(d.saves), () => {});
  }, []);

  useEffect(() => {
    fetch("/api/access").then((r) => r.json()).then((d) => setAccess(!!d.ok), () => setAccess(false));
    refresh();
    retryUploads();
    const off = onQueueChange(refresh);
    addEventListener("online", retryUploads);
    return () => { off(); removeEventListener("online", retryUploads); };
  }, [refresh]);

  async function remove(id: string) {
    await fetch(`/api/saves?id=${id}`, { method: "DELETE" });
    refresh();
  }

  if (access === false) return <AccessGate onOpen={() => { setAccess(true); retryUploads(); refresh(); }} />;

  const shared = Number(params.get("shared") || 0), missed = params.get("missed");
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-semibold tracking-tight">Inbox</h1>
      {shared > 0 && <p className="text-sm text-muted-foreground">{shared === 1 ? "Saved." : `${shared} saved.`}</p>}
      {missed && <p className="rounded-md border border-destructive/40 p-3 text-sm">That share arrived before the app was ready, so it wasn&apos;t kept. Share it again.</p>}

      {queue.length > 0 && (
        <ul className="flex flex-col gap-2">
          {queue.map((q) => (
            <li key={q.id} className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
              <span className="truncate">{q.file ? "Photo" : q.url || q.text || "Link"}</span>
              <span className="shrink-0 text-muted-foreground">{WAITING[q.state]}</span>
              {q.state === "unreadable" && <button className="shrink-0 underline" onClick={() => dropFromQueue(q.id).then(refresh)}>Remove</button>}
            </li>
          ))}
        </ul>
      )}

      {saves === null ? null : saves.length === 0 && queue.length === 0 ? (
        <p className="text-muted-foreground">Nothing saved yet. Share a post, a pin or a screenshot to Selvedge.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3">
          {saves.map((s) => (
            <li key={s.id} className="flex flex-col gap-1.5">
              {s.hasImage ? (
                <img src={imageUrl(s.id)} alt="" className="w-full rounded-sm object-cover" style={{ aspectRatio: s.aspect ?? 0.75 }} />
              ) : (
                <div className="flex aspect-[3/4] flex-col justify-between rounded-sm border p-3 text-sm">
                  <span>Couldn&apos;t get the picture from this {s.source === "instagram" ? "post" : s.source === "pinterest" ? "pin" : "link"}. Take a screenshot and share that instead.</span>
                  {s.link && <a href={s.link} target="_blank" rel="noreferrer" className="truncate text-muted-foreground underline">{new URL(s.link).hostname}</a>}
                </div>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="capitalize">{s.source}</span>
                <button className="underline" onClick={() => remove(s.id)}>Remove</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
