"use client";

import { useEffect } from "react";

// Registers public/sw.js, which receives shares from Android's share sheet.
export function RegisterServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
