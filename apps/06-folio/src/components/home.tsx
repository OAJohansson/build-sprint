"use client";

import type { Found } from "@/lib/types";
import { CoverRow } from "./shared";

// Home: Folio's picks first (the personal row; owner, after critic round 1), then New releases
// and Popular this month, which are the same for everyone.
export function Home({
  picks,
  lists,
  onOpen,
}: {
  picks: Found[] | "loading" | "error";
  lists: { popular: Found[]; newReleases: Found[] } | "loading" | "error";
  onOpen: (b: Found) => void;
}) {
  return (
    <div className="space-y-7">
      {picks === "loading" ? (
        <p className="px-4 text-[14px] text-[var(--f-faint)]">Choosing your picks…</p>
      ) : picks === "error" ? (
        <p className="px-4 text-[14px] text-[var(--f-muted)]">Couldn&apos;t choose your picks right now.</p>
      ) : (
        <CoverRow title="Folio's picks for you" items={picks} wide caption={(b) => b.note} onOpen={onOpen} />
      )}
      {lists === "loading" ? (
        <p className="px-4 text-[14px] text-[var(--f-faint)]">Loading new and popular books…</p>
      ) : lists === "error" ? (
        <p className="px-4 text-[14px] text-[var(--f-muted)]">Couldn&apos;t reach Open Library for new and popular books.</p>
      ) : (
        <>
          <CoverRow title="New releases" items={lists.newReleases} onOpen={onOpen} />
          <CoverRow title="Popular this month" items={lists.popular} onOpen={onOpen} />
        </>
      )}
    </div>
  );
}
