"use client";

// Photos on the phone: shrunk to a long side of 1600 px as WebP before upload (a few hundred KB),
// following the photo's rotation. Shared photos wait in IndexedDB (written by public/sw.js).

const LONG_SIDE = 1600;

export async function shrink(source: Blob | HTMLVideoElement): Promise<Blob> {
  let w: number, h: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, close = () => {};
  if (source instanceof Blob) {
    const bitmap = await createImageBitmap(source);
    w = bitmap.width; h = bitmap.height;
    draw = (ctx, cw, ch) => ctx.drawImage(bitmap, 0, 0, cw, ch);
    close = () => bitmap.close();
  } else {
    w = source.videoWidth; h = source.videoHeight;
    draw = (ctx, cw, ch) => ctx.drawImage(source, 0, 0, cw, ch);
  }
  const scale = Math.min(1, LONG_SIDE / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  draw(canvas.getContext("2d")!, canvas.width, canvas.height);
  close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.84));
  // Safari before 17 can't encode WebP and quietly gives PNG; JPEG is smaller then.
  if (blob && blob.type === "image/webp") return blob;
  return (await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.85))) ?? (source instanceof Blob ? source : new Blob());
}

// Keep in step with public/sw.js.
const DB = "magpie", STORE = "shared";

function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => { if (!open.result.objectStoreNames.contains(STORE)) open.result.createObjectStore(STORE); };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => resolve(open.result);
  });
}

/** Takes the photo the share sheet handed over (once), or null. */
export async function takeSharedPhoto(): Promise<Blob | null> {
  try {
    const d = await db();
    return await new Promise((resolve) => {
      const t = d.transaction(STORE, "readwrite");
      const s = t.objectStore(STORE);
      const get = s.get("latest");
      get.onsuccess = () => { s.delete("latest"); resolve((get.result as Blob | undefined) ?? null); };
      get.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
