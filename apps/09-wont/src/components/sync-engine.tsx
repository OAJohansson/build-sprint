"use client";

import { useEffect } from "react";
import { startSync } from "@/lib/sync-client";

// Runs background sync for the whole app (v1.1); renders nothing.
export function SyncEngine() {
  useEffect(() => startSync(), []);
  return null;
}
