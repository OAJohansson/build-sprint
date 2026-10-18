"use client";

// My tracks: the panel under the track name. Open a track, start a new one, delete one.
import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ago } from "@/lib/ago";
import type { TrackSummary } from "@/lib/tracks";
import { cx } from "./timeline";
import s from "./studio.module.css";

export function Library({ tracks, currentId, onOpen, onNew, onDelete, onClose }: {
  tracks: TrackSummary[]; currentId: string;
  onOpen: (id: string) => void; onNew: () => void; onDelete: (id: string) => void; onClose: () => void;
}) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const away = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // Next tick, so the click that opened the panel doesn't close it.
    const t = setTimeout(() => { addEventListener("pointerdown", away); addEventListener("keydown", esc); });
    return () => { clearTimeout(t); removeEventListener("pointerdown", away); removeEventListener("keydown", esc); };
  }, [onClose]);

  return (
    <div className={s.library} ref={ref} role="dialog" aria-label="My tracks">
      <div className={s.libHead}>
        <span>My tracks</span>
        <button className={s.libNew} onClick={onNew}><Plus aria-hidden /> New track</button>
      </div>
      <ul className={s.libList}>
        {tracks.map((tr) => (
          <li key={tr.id} className={cx(s.libItem, tr.id === currentId && s.libOn)}>
            {confirm === tr.id ? (
              <div className={s.libConfirm}>
                <span>Delete “{tr.name}”?</span>
                <button onClick={() => { setConfirm(null); onDelete(tr.id); }}>Delete</button>
                <button onClick={() => setConfirm(null)}>Keep</button>
              </div>
            ) : (
              <>
                <button className={s.libOpen} onClick={() => onOpen(tr.id)}>
                  <b>{tr.name}</b>
                  <em>{tr.id === currentId ? "open now" : ago(tr.updatedAt)}</em>
                </button>
                {tracks.length > 1 ? (
                  <button className={s.libDel} onClick={() => setConfirm(tr.id)} aria-label={`Delete ${tr.name}`}><Trash2 aria-hidden /></button>
                ) : null}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
