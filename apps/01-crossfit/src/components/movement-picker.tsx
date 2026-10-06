"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Chip, Screen, TopBar, inputClass } from "@/components/ui/bits";
import { CATEGORIES, MOVEMENTS, type Category } from "@/lib/movements";
import { currentPbs, formatPb } from "@/lib/pb";
import type { Pb } from "@/lib/types";

/** Pick a movement from the categorised list, or search, or add a custom one. */
export function MovementPicker({
  pbs,
  onPick,
  onClose,
  pbOnly,
}: {
  pbs: Pb[];
  onPick: (name: string) => void;
  onClose: () => void;
  /** Hide movements that don't have PBs (generic cardio, class "WOD"). */
  pbOnly?: boolean;
}) {
  const [cat, setCat] = useState<Category>("Olympic");
  const [query, setQuery] = useState("");

  const bestLabel = useMemo(() => {
    const labels = new Map<string, string>();
    for (const pb of currentPbs(pbs).values()) {
      const key = pb.movement.toLowerCase();
      if (!labels.has(key) || pb.repMax === 1) labels.set(key, `PB ${formatPb(pb)}`);
    }
    return labels;
  }, [pbs]);

  const q = query.trim().toLowerCase();
  const list = MOVEMENTS.filter((m) => (pbOnly ? m.pb !== "none" : true)).filter((m) =>
    q ? m.name.toLowerCase().includes(q) : m.category === cat,
  );
  const exact = MOVEMENTS.some((m) => m.name.toLowerCase() === q);

  return (
    <Screen>
      <TopBar title="Add movement" onBack={onClose} close />
      <label className="relative">
        <span className="sr-only">Search movements</span>
        <Search className="pointer-events-none absolute left-3.5 top-3.5 size-5 text-muted-foreground" />
        <input
          autoFocus
          className={`${inputClass} pl-11`}
          placeholder={`Search ${MOVEMENTS.length} movements`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {!q && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip key={c} active={c === cat} onClick={() => setCat(c)}>
              {c}
            </Chip>
          ))}
        </div>
      )}
      <ul className="flex flex-col">
        {list.map((m) => (
          <li key={m.name}>
            <button
              type="button"
              onClick={() => onPick(m.name)}
              className="flex min-h-12 w-full items-center justify-between gap-3 border-b border-border py-3 text-left"
            >
              <span className="flex flex-col">
                <span className="text-[17px]">{m.name}</span>
                {m.detail && <span className="text-xs text-muted-foreground">{m.detail}</span>}
              </span>
              <span className="flex-none text-[13px] text-muted-foreground">{bestLabel.get(m.name.toLowerCase())}</span>
            </button>
          </li>
        ))}
      </ul>
      {q && !exact && (
        <button
          type="button"
          onClick={() => onPick(query.trim().replace(/\b\w/g, (c) => c.toUpperCase()))}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-input text-muted-foreground"
        >
          <Plus className="size-4" /> Add &ldquo;{query.trim()}&rdquo;
        </button>
      )}
    </Screen>
  );
}
