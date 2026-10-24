import { Intro } from "@/components/intro";

// First-launch intro (R1); the board sends a fresh install here, and its footer replays it.
export default function Page() {
  return <Intro />;
}
