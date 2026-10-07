"use client";

// Horizon renders in the browser only: it needs the clock, location and localStorage.
import dynamic from "next/dynamic";

const HorizonApp = dynamic(() => import("@/components/horizon/horizon-app"), { ssr: false });

export default function Home() {
  return <HorizonApp />;
}
