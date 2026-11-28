// R8b (L273d): the map's one way into the Studio, replacing the Phase 3 "Start a track from this".
// It opens the song's one rebuild (made on first open, reopened after). Placed in the Lab's header
// beside Listen / Make; the Studio does the rest (/?rebuild=<the map's id>).
export const rebuildHref = (mapId: string) => `/?rebuild=${encodeURIComponent(mapId)}`;

export function RebuildLink({ mapId, className }: { mapId: string; className?: string }) {
  return (
    <a className={className} href={rebuildHref(mapId)} title="A Studio track with this song's sections laid out bar for bar, every slot empty for your saved parts">
      Rebuild this song
    </a>
  );
}
