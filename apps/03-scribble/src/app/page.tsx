"use client";

import { Button } from "@/components/ui/button";
import { useLocalStorage } from "@/lib/use-local-storage";

export default function Home() {
  // Placeholder to prove persistence works — delete once the real UI exists.
  const [count, setCount] = useLocalStorage("03-scribble:count", 0);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-6 p-6">
      <p className="text-sm text-muted-foreground">Day 3</p>
      <h1 className="text-3xl font-semibold tracking-tight">Scribble</h1>
      <p className="text-muted-foreground">Start building in src/app/page.tsx.</p>
      <div className="flex items-center gap-3">
        <Button onClick={() => setCount((c) => c + 1)}>Clicked {count} times</Button>
        <Button variant="ghost" onClick={() => setCount(0)}>Reset</Button>
      </div>
    </main>
  );
}
