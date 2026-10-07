import { Search } from "lucide-react";
import type { Place } from "@/lib/sun";

export function PlaceButton({ place, localTime, ink, inkSoft, onClick }: { place: Place; localTime: string; ink: string; inkSoft: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="-mx-2 flex min-h-11 min-w-0 items-center gap-2 rounded-full px-2 py-1.5 text-left transition-transform duration-150 ease-out active:scale-[0.97]"
      style={{ color: ink }}
      aria-label={`${place.name}${place.region ? `, ${place.region}` : ""}. Search another place`}
    >
      <Search className="size-4 shrink-0" style={{ color: inkSoft }} aria-hidden="true" />
      <span className="truncate font-medium">{place.name}</span>
      <span className="shrink-0 tabular-nums" style={{ color: inkSoft }}>
        {localTime}
      </span>
    </button>
  );
}
