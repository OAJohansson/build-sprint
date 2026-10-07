"use client";

// Prototype for the Horizon home screen (/prototype skill). Delete this folder once a direction
// is promoted. The harness reads the URL and the clock, so it renders in the browser only.
import dynamic from "next/dynamic";

const Harness = dynamic(() => import("./harness"), { ssr: false });

export default function PrototypeHome() {
  return <Harness />;
}
