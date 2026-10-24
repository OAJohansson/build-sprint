"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { copy } from "@/lib/copy";
import type { HabitDraft } from "@/lib/habits";
import { useWont } from "@/lib/store";
import { BuildForm, StopForm } from "./habit-form";

// Create a habit (R2 build, R3 stop). Saving adds it to the store and returns to the board.
export function NewHabit({ kind }: { kind: "build" | "stop" }) {
  const w = useWont();
  const router = useRouter();
  const save = (draft: HabitDraft) => {
    w.addHabit(draft);
    router.push("/");
  };
  const f = copy.form;

  return (
    <main className="w">
      <header className="w-head w-head-form">
        <Link href="/" className="w-back">{f.back}</Link>
        <h1>{kind === "build" ? f.buildTitle : f.stopTitle}</h1>
        <p>{kind === "build" ? f.buildIntro : f.stopIntro}</p>
      </header>
      {kind === "build" ? (
        <BuildForm onSave={(d) => save(d as HabitDraft)} />
      ) : (
        <StopForm onSave={(d) => save(d as HabitDraft)} />
      )}
    </main>
  );
}
