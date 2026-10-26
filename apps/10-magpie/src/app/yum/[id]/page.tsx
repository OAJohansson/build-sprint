"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Gate } from "@/components/gate";
import { Maggie } from "@/components/maggie";
import { Hearts, Sticker } from "@/components/sticker";
import { dropYum, putYum, setLastRemoved, useBook } from "@/lib/book";
import { kindLabel, subKindInfo, whereLine, type Yum } from "@/lib/yum";

// The item page (design K): the sticker or my original photo, every detail as I typed it, my
// note, edit, and remove with Undo on the shelf (R3, R4, R10).

export default function ItemPage() {
  return (
    <Gate>
      <Item />
    </Gate>
  );
}

const HERO: Record<Yum["kind"], string> = { drink: "#F7B5C6", food: "#FFD9A0", dessert: "#CFE8F7" };

function Item() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { yums } = useBook();
  const yum = yums.find((y) => y.id === id);
  const [view, setView] = useState<"sticker" | "photo">("sticker");
  const [busy, setBusy] = useState(false);

  if (!yum) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
        <Maggie pose="head" size={110} />
        <p className="text-[18px]">I can&apos;t find that one in your book.</p>
        <Link href="/" className="btn btn-quiet">Back to my book</Link>
      </main>
    );
  }

  const sub = subKindInfo(yum.kind, yum.subKind);
  const showPhoto = view === "photo" && yum.hasPhoto;

  async function remove() {
    if (!yum || busy) return;
    setBusy(true);
    const r = await fetch(`/api/yums/${yum.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ removed: true }) }).catch(() => null);
    if (!r?.ok) { setBusy(false); return; }
    dropYum(yum.id);
    setLastRemoved(yum);
    router.push("/");
  }

  async function redraw() {
    if (!yum) return;
    const r = await fetch(`/api/yums/${yum.id}/sticker`, { method: "POST" }).catch(() => null);
    if (r?.ok) putYum(((await r.json()) as { yum: Yum }).yum);
  }

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col gap-[14px] px-5 pt-[max(20px,env(safe-area-inset-top))] safe-bottom lg:grid lg:max-w-[960px] lg:grid-cols-[1fr_1fr] lg:content-start lg:gap-x-10 lg:pt-10">
      <div className="flex items-center justify-between lg:col-span-2">
        <Link href="/" aria-label="Back to the book" className="btn btn-round">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <Link href={`/yum/${yum.id}/edit`} aria-label="Edit" className="btn btn-round">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B1F1A" strokeWidth="2.2" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16z" /></svg>
        </Link>
      </div>

      <div className="relative flex h-[300px] items-center justify-center overflow-hidden rounded-[26px] border-[2.5px] border-cocoa lg:row-span-4 lg:h-[420px]" style={{ background: HERO[yum.kind] }}>
        {showPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element -- private, cookie-guarded image route
          <img src={`/api/yums/${yum.id}/photo`} alt={`My photo of ${yum.name}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className={yum.sticker === "drawing" ? "drawing-pulse" : undefined}><Sticker yum={yum} size={210} /></div>
        )}
        {yum.hasPhoto && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-[18px] border-2 border-cocoa bg-white p-[3px]" role="group" aria-label="Show">
            {(["sticker", "photo"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`h-[30px] rounded-[15px] px-3 text-[13px] ${view === v ? "bg-cocoa text-cream" : ""}`}>
                {v === "sticker" ? "Sticker" : "My photo"}
              </button>
            ))}
          </div>
        )}
      </div>

      {yum.sticker === "drawing" && !showPhoto && <p className="-mt-1 text-center text-[14px] text-bark lg:text-left">Maggie is still drawing this one…</p>}
      {yum.sticker === "failed" && (
        <p className="-mt-1 flex items-center justify-center gap-2 text-[14px] text-bark lg:justify-start">
          The sticker didn&apos;t come out.
          <button type="button" onClick={redraw} className="min-h-11 px-1 text-link">Draw it again</button>
        </p>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="break-words text-[28px] font-semibold leading-[1.1]">{yum.name}</h1>
          <p className="mt-1 text-[15px] text-bark">{[kindLabel(yum.kind), sub?.label, `yum no. ${yum.number}`].filter(Boolean).join(" · ")}</p>
        </div>
        <Hearts n={yum.hearts} size={18} className="mt-2 flex-none" />
      </div>

      <div className="card rounded-[18px] px-3.5 py-1">
        {whereLine(yum) && (
          <div className="flex items-center gap-2.5 border-b-[1.5px] border-dashed border-dash py-2.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9A97" strokeWidth="2.2" aria-hidden="true" className="flex-none"><path d="M12 21s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
            <span className="min-w-0 break-words text-[15px]">{whereLine(yum)}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 py-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E9A97" strokeWidth="2.2" aria-hidden="true" className="flex-none"><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>
          <time dateTime={yum.savedAt} className="text-[15px]">{new Date(yum.savedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</time>
        </div>
      </div>

      {yum.note && (
        <div className="flex items-start gap-2">
          <Maggie pose="head" size={44} className="flex-none" />
          <p className="bubble min-w-0 flex-1 whitespace-pre-wrap break-words rounded-[4px_18px_18px_18px] px-3.5 py-2.5 text-[15px] leading-[1.4]">
            <span className="text-[13px] text-dusk">You wrote:</span>
            <br />
            {yum.note}
          </p>
        </div>
      )}

      <div className="flex-1" />
      <button type="button" onClick={remove} disabled={busy} className="min-h-11 self-center px-2.5 text-[15px] text-link lg:col-start-2 lg:self-start lg:px-0">
        {busy ? "Removing…" : "Remove from my book"}
      </button>
    </main>
  );
}
