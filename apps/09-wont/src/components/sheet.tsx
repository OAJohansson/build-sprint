"use client";

import { useEffect, useRef } from "react";

// A bottom sheet over a scrim (from the slip prototype). Closed sheets stay mounted so the
// slide can run, and are inert so nothing inside can be focused or read. While open (feedback
// 32): focus moves to the sheet's first control, the page behind it is inert, and focus goes
// back to what opened the sheet when it closes.
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
  const ref = useRef<HTMLElement>(null);
  const scrim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const sheet = ref.current;
    if (!open || !sheet) return;
    const opener = document.activeElement as HTMLElement | null;
    // The page behind: the sheet's siblings (it is rendered inside the page's <main>).
    const behind = Array.from(sheet.parentElement?.children ?? []).filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== sheet && el !== scrim.current && !el.inert,
    );
    behind.forEach((el) => (el.inert = true));
    sheet.querySelector<HTMLElement>("button, a[href], input, textarea")?.focus({ preventScroll: true });
    return () => {
      behind.forEach((el) => (el.inert = false));
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <div ref={scrim} className="w-scrim" data-open={open ? "" : undefined} onClick={onClose} aria-hidden="true" />
      <section
        ref={ref}
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
