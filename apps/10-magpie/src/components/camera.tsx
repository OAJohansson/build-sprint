"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Maggie } from "@/components/maggie";
import { shrink } from "@/lib/photo";

// Capture, step 1 (design D): a live viewfinder with Maggie peeking in, the shutter, a photo
// library button and Skip. If the camera can't open (no permission, a laptop without one), the
// frame offers the phone's own camera instead, so every path still reaches the details (R2).

export function Camera({ onPhoto, onSkip }: { onPhoto: (photo: Blob) => void; onSkip: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const library = useRef<HTMLInputElement>(null);
  const native = useRef<HTMLInputElement>(null);
  const [live, setLive] = useState<"starting" | "on" | "off">("starting");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera API");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1920 } }, audio: false });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
        setLive("on");
      } catch {
        if (!cancelled) setLive("off");
      }
    })();
    return () => { cancelled = true; stream?.getTracks().forEach((t) => t.stop()); };
  }, []);

  async function shoot() {
    if (busy) return;
    if (live !== "on" || !video.current?.videoWidth) return native.current?.click();
    setBusy(true);
    try { onPhoto(await shrink(video.current)); } finally { setBusy(false); }
  }

  async function picked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try { onPhoto(await shrink(file).catch(() => file)); } finally { setBusy(false); }
  }

  return (
    <main className="flex flex-1 flex-col bg-[#1E1612] text-cream">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col gap-4 px-5 pt-[max(20px,env(safe-area-inset-top))] safe-bottom">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#3A2C25]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF4E0" strokeWidth="2.4" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </Link>
          <h1 className="text-[17px] font-medium">New yum</h1>
          <span className="w-11" />
        </div>

        <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-[26px] bg-[#4A3027]">
          <video ref={video} playsInline muted className={`absolute inset-0 h-full w-full object-cover ${live === "on" ? "" : "hidden"}`} />
          {live === "off" && (
            <button type="button" onClick={() => native.current?.click()} className="relative z-10 flex flex-col items-center gap-3 px-8 text-center text-[16px] text-[#D9C4B5]">
              <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#FFF4E0" strokeWidth="1.8" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
              I can&apos;t see through this camera. Tap to open your phone&apos;s camera.
            </button>
          )}
          {/* The viewfinder corners. */}
          {["left-6 top-6 border-l-[3px] border-t-[3px] rounded-tl-[10px]", "right-6 top-6 border-r-[3px] border-t-[3px] rounded-tr-[10px]", "bottom-6 left-6 border-b-[3px] border-l-[3px] rounded-bl-[10px]", "bottom-6 right-6 border-b-[3px] border-r-[3px] rounded-br-[10px]"].map((c) => (
            <span key={c} className={`pointer-events-none absolute h-[34px] w-[34px] border-cream ${c}`} />
          ))}
          <Maggie pose="head" dark size={74} className="pointer-events-none absolute -right-1.5 bottom-[60px]" />
        </div>

        <p className="text-center text-[15px] text-[#D9C4B5]">Ooh, what&apos;s that? Get it in the frame.</p>

        <div className="flex items-center justify-between px-3 pb-1.5">
          <button type="button" aria-label="Pick from your photos" onClick={() => library.current?.click()} className="flex h-14 w-14 items-center justify-center rounded-[14px] border-2 border-cream bg-bark active:scale-95">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFF4E0" strokeWidth="2" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>
          </button>
          <button type="button" aria-label="Take photo" onClick={shoot} disabled={busy || live === "starting"} className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-4 border-cream transition-transform active:scale-95">
            <span className="h-[66px] w-[66px] rounded-full bg-coral" />
          </button>
          <button type="button" onClick={onSkip} className="h-14 w-14 rounded-full text-[15px] text-[#D9C4B5]">Skip</button>
        </div>
      </div>
      <input ref={library} type="file" accept="image/*" className="hidden" onChange={picked} />
      <input ref={native} type="file" accept="image/*" capture="environment" className="hidden" onChange={picked} />
    </main>
  );
}
