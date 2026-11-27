"use client";

// Phase 7 slice 1 (L272, W3, design p7-final): "Sound credits", a link beside the starting sounds in
// Make (Drums and Bass) that opens a small popover: where the sounds come from and under what
// licence. The CC BY basses are credited by name here (CC BY 3.0 asks for it); every file, its source
// page, author and licence are in /kits/LICENSES.md.
import { useEffect, useId, useRef, useState } from "react";
import s from "./lab.module.css";

export function SoundCredits() {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <span className={s.creditsBox} ref={box}>
      <button className={s.textBtn} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Sound credits</button>
      {open && (
        <div className={s.creditsPop} id={id} role="dialog" aria-label="Sound credits">
          <div className={s.creditsTop}><b>Sound credits</b><button className={s.textBtn} onClick={() => setOpen(false)} aria-label="Close the sound credits">✕</button></div>
          <p><span className={s.muted}>Drums:</span> 120 recordings from Freesound and Sonic Pi, all CC0, free to use with no credit needed. Thanks to the people who recorded them.</p>
          <p><span className={s.muted}>Bass:</span> the sampled electric bass and upright bass are from <a href="https://github.com/nbrosowsky/tonejs-instruments" target="_blank" rel="noreferrer">tonejs-instruments</a> by Nicholas Brosowsky, licensed <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noreferrer">CC BY 3.0</a>; Six AM trimmed and re-encoded them. The other basses are Six AM&apos;s own synth.</p>
          <a className={s.textBtn} href="/kits/LICENSES.md" target="_blank" rel="noreferrer">Every file, its source and licence</a>
        </div>
      )}
    </span>
  );
}
