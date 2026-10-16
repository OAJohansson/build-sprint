"use client";

import { folioPicks, newReleases, popular, type Pick } from "./home-data";
import { Cover } from "./shared";

// Home: three shelves to browse. Folio's picks first, the personal row (owner, 16 Oct, after
// critic round 1); New releases and Popular this month follow.
export function Home() {
  return (
    <div className="space-y-7">
      <section>
        <h2 className="px-4 text-[17px] font-semibold tracking-tight">Folio&apos;s picks for you</h2>
        <ul className="mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none]">
          {folioPicks.map((b) => (
            <li key={b.id} className="w-[132px] shrink-0 snap-start">
              <Cover book={b} />
              <p className="mt-2 line-clamp-2 text-[13px] font-medium leading-snug">{b.title}</p>
              <p className="truncate text-[12px] text-[var(--f-muted)]">{b.author}</p>
              {b.because && (
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug text-[var(--f-faint)]">
                  Because you loved {b.because}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>
      <Row title="New releases" items={newReleases} />
      <Row title="Popular this month" items={popular} />
    </div>
  );
}

function Row({ title, items }: { title: string; items: Pick[] }) {
  return (
    <section>
      <h2 className="px-4 text-[17px] font-semibold tracking-tight">{title}</h2>
      <ul className="mt-3 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none]">
        {items.map((b) => (
          <li key={b.id} className="w-[96px] shrink-0 snap-start">
            <Cover book={b} />
            <p className="mt-1.5 line-clamp-2 text-[12px] leading-snug">{b.title}</p>
            <p className="truncate text-[11px] text-[var(--f-faint)]">{b.author}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
