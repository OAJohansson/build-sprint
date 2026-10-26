"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Camera } from "@/components/camera";
import { DetailsForm } from "@/components/details-form";
import { Gate } from "@/components/gate";
import { Maggie, Sparkles } from "@/components/maggie";
import { Sticker } from "@/components/sticker";
import { putYum, useBook } from "@/lib/book";
import { takeSharedPhoto } from "@/lib/photo";
import { homeCity, inCity } from "@/lib/shelves";
import { subKindInfo, kindLabel, type Yum, type YumFields } from "@/lib/yum";

// The capture flow: camera (D) → details (E) → drawing the sticker (F) → "Ooh, shiny!" (G).
// The yum is saved before any AI runs; the drawing screen can be closed (R4). A photo shared
// from the camera roll lands straight on the details (R5).

export default function NewPage() {
  return (
    <Gate>
      <Suspense>
        <Capture />
      </Suspense>
    </Gate>
  );
}

type Step = { at: "camera" } | { at: "details" } | { at: "drawing"; yum: Yum } | { at: "saved"; yum: Yum };

function Capture() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ at: "camera" });
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const id = useRef<string>("");
  const { yums } = useBook();
  const home = homeCity(yums);
  const fallback = home ? { city: home, country: yums.find((y) => inCity(y, home) && y.country)?.country ?? "" } : null;

  useEffect(() => {
    id.current = crypto.randomUUID();
    const params = new URLSearchParams(window.location.search);
    if (params.get("missed")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reading the URL once on arrival
      setNotice("That photo didn't come through. Pick it from your photos here.");
    }
    if (params.get("shared")) {
      void takeSharedPhoto().then((shared) => {
        if (shared) choose(shared);
        else setNotice("That photo didn't come through. Pick it from your photos here.");
        window.history.replaceState(null, "", "/new");
      });
    }
  }, []);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  function choose(p: Blob | null) {
    setPhoto(p);
    setPhotoUrl(p ? URL.createObjectURL(p) : null);
    setStep({ at: "details" });
  }

  async function save(fields: YumFields): Promise<string | null> {
    const body = new FormData();
    body.set("id", id.current);
    for (const [k, v] of Object.entries(fields)) if (v !== null) body.set(k, String(v));
    if (photo) body.set("photo", photo, photo.type === "image/jpeg" ? "photo.jpg" : "photo.webp");
    const r = await fetch("/api/yums", { method: "POST", body }).catch(() => null);
    if (!r) return "I couldn't reach your book. Check your connection and try again; nothing is lost.";
    const j = (await r.json().catch(() => ({}))) as { yum?: Yum; error?: string };
    if (!r.ok || !j.yum) return j.error ?? "That didn't save. Try again?";
    putYum(j.yum);
    setStep({ at: "drawing", yum: j.yum });
    return null;
  }

  if (step.at === "camera") {
    return (
      <>
        {notice && <p role="status" className="bg-butter px-5 py-3 text-center text-[15px]">{notice}</p>}
        <Camera onPhoto={choose} onSkip={() => choose(null)} />
      </>
    );
  }
  if (step.at === "details") {
    return <DetailsForm title="What did you find?" fallback={fallback} submitLabel="Stick it in my book" photoUrl={photoUrl} onBack={() => setStep({ at: "camera" })} onSubmit={save} />;
  }
  if (step.at === "drawing") return <Drawing yum={step.yum} photoUrl={photoUrl} onDone={(yum) => setStep({ at: "saved", yum })} onClose={() => router.push("/")} />;
  return <Saved yum={step.yum} />;
}

/** F: Maggie draws the sticker. Already saved; closing is fine. Moves on when the sticker is in. */
function Drawing({ yum, photoUrl, onDone, onClose }: { yum: Yum; photoUrl: string | null; onDone: (y: Yum) => void; onClose: () => void }) {
  const book = useBook();
  const latest = book.yums.find((y) => y.id === yum.id) ?? yum;
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    let alive = true;
    const started = Date.now();
    const tick = async () => {
      if (!alive) return;
      const r = await fetch(`/api/yums/${yum.id}`, { cache: "no-store" }).catch(() => null);
      const j = r?.ok ? ((await r.json()) as { yum: Yum }) : null;
      if (!alive) return;
      if (j?.yum && j.yum.sticker !== "drawing") {
        // Load the sticker before the saved screen shows it, so it lands drawn, not blank.
        if (j.yum.sticker === "ready") await preload(`/api/yums/${j.yum.id}/sticker?v=${j.yum.updatedAt}`);
        if (!alive) return;
        putYum(j.yum);
        onDone(j.yum);
        return;
      }
      // Past 40 s, stop waiting here: the shelf keeps checking and the photo stands in.
      if (Date.now() - started > 40_000) { setSlow(true); onDone(latest); return; }
      setTimeout(tick, 1500);
    };
    const first = setTimeout(tick, 2500);
    return () => { alive = false; clearTimeout(first); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one poll loop per yum
  }, [yum.id]);

  return (
    <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center gap-4 px-7 pt-[max(60px,env(safe-area-inset-top))] safe-bottom">
      <h1 className="text-center text-[28px] font-semibold leading-[1.15]">Drawing your sticker…</h1>
      <p className="text-center text-[16px] leading-[1.45] text-bark">
        {`${yum.name} is already saved. You can close this; I'll finish it in a few seconds.`}
      </p>
      <div className="relative mt-2 flex w-[320px] max-w-full flex-col items-center">
        <div className="flex h-[176px] w-[176px] items-center justify-center rounded-full border-2 border-dashed border-cocoa bg-white">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- the local photo just taken
            <img src={photoUrl} alt="" className="drawing-pulse h-[150px] w-[150px] rounded-full object-cover opacity-50 grayscale-[40%]" />
          ) : (
            <span className="drawing-pulse line-clamp-3 break-words px-5 text-center text-[18px] font-medium text-bark">{yum.name}</span>
          )}
        </div>
        <Maggie pose="draw" size={200} className="-mt-2" />
      </div>
      <div className="h-3 w-[220px] overflow-hidden rounded-md border-2 border-cocoa bg-white" role="progressbar" aria-label="Drawing the sticker">
        <div className="h-full origin-left bg-butter" style={{ animation: "fill 12s cubic-bezier(0.2, 0.7, 0.3, 1) forwards" }} />
      </div>
      {slow && <p className="text-[15px] text-bark">Taking a little longer. It&apos;ll pop up on your shelf.</p>}
      <div className="flex-1" />
      <button type="button" onClick={onClose} className="btn btn-quiet w-full">Back to my book</button>
    </main>
  );
}

const preload = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
    setTimeout(resolve, 5000);
  });

/** G: the one celebration. Shown after every save. */
function Saved({ yum: saved }: { yum: Yum }) {
  const book = useBook();
  const yum = book.yums.find((y) => y.id === saved.id) ?? saved;
  const sub = subKindInfo(yum.kind, yum.subKind);
  const chip = "flex h-8 items-center rounded-full border-2 border-cocoa px-3 text-[14px]";
  return (
    <main className="flex flex-1 flex-col bg-coral">
      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center gap-[14px] px-6 pt-[max(48px,env(safe-area-inset-top))] safe-bottom">
        <h1 className="text-center text-[34px] font-semibold leading-[1.1]">Ooh, shiny!</h1>
        <p className="text-center text-[17px]">{yum.name} is on your Latest shelf</p>
        {/* Maggie holds the new sticker up (design G): the sticker sits between her raised wings. */}
        <div className="relative flex w-[330px] max-w-full flex-col items-center">
          <Sparkles className="pointer-events-none absolute inset-0 h-full w-full" />
          <div className="stick-in relative z-10">
            <Sticker yum={yum} size={170} tilt={false} />
          </div>
          <Maggie pose="cheer" size={330} className="-mt-[30px]" />
        </div>
        <ul className="flex flex-wrap justify-center gap-2" aria-label="Saved details">
          <li className={`${chip} bg-cream`}>{sub?.label ?? kindLabel(yum.kind)}</li>
          {yum.place && <li className={`${chip} max-w-full bg-cream`}><span className="truncate">{yum.place}</span></li>}
          <li className="basis-full" aria-hidden="true" />
          <li className={`${chip} bg-cream`} aria-label={`${yum.hearts} of 5 hearts`}>{"♥".repeat(yum.hearts)}</li>
          <li className={`${chip} bg-[#FFD166]`}>yum no. {yum.number}</li>
        </ul>
        <div className="flex-1" />
        <Link href="/" className="btn btn-quiet h-14 w-full text-[18px]">See my shelves</Link>
        <a href="/new" className="btn h-[50px] w-full border-cream text-[16px] text-cocoa">Snap another</a>
      </div>
    </main>
  );
}
