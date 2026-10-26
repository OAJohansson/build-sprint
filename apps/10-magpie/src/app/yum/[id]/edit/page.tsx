"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { DetailsForm } from "@/components/details-form";
import { Gate } from "@/components/gate";
import { Maggie } from "@/components/maggie";
import { putYum, useBook } from "@/lib/book";
import type { Yum, YumFields } from "@/lib/yum";

// Edit a yum: the details form, filled in. The saved date and the photo stay as they were.

export default function EditPage() {
  return (
    <Gate>
      <Edit />
    </Gate>
  );
}

function Edit() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const yum = useBook().yums.find((y) => y.id === id);
  if (!yum) {
    return (
      <main className="mx-auto flex w-full max-w-[440px] flex-1 flex-col items-center justify-center gap-4 px-7 text-center">
        <Maggie pose="head" size={110} />
        <p className="text-[18px]">I can&apos;t find that one in your book.</p>
        <Link href="/" className="btn btn-quiet">Back to my book</Link>
      </main>
    );
  }
  async function save(fields: YumFields): Promise<string | null> {
    const r = await fetch(`/api/yums/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(fields) }).catch(() => null);
    if (!r) return "I couldn't reach your book. Try again?";
    const j = (await r.json().catch(() => ({}))) as { yum?: Yum; error?: string };
    if (!r.ok || !j.yum) return j.error ?? "That didn't save. Try again?";
    putYum(j.yum);
    router.replace(`/yum/${id}`);
    return null;
  }
  const { name, kind, subKind, place, city, country, hearts, note } = yum;
  return (
    <DetailsForm
      title="Fix the details" submitLabel="Save changes"
      photoUrl={yum.hasPhoto ? `/api/yums/${yum.id}/photo` : null}
      initial={{ name, kind, subKind, place, city, country, hearts, note }}
      onBack={() => router.back()} onSubmit={save}
    />
  );
}
