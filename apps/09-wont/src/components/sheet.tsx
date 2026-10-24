"use client";

import { useEffect } from "react";

// A bottom sheet over a scrim (from the slip prototype). Closed sheets stay mounted so the
// slide can run, and are inert so nothing inside can be focused or read.
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div className="w-scrim" data-open={open ? "" : undefined} onClick={onClose} aria-hidden="true" />
      <section
        className="w-sheet"
        data-open={open ? "" : undefined}
        inert={!open}
        role="dialog"
        aria-modal={open}
        aria-label={label}
      >
        {children}
      </section>
    </>
  );
}
