"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync-client";

// Runs background sync for the whole app (v1.1) and, in production, the offline shell
// (public/sw.js, feedback 44) so the board opens with no signal. Renders nothing.
export function SyncEngine() {
  useEffect(() => startSync(), []);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
