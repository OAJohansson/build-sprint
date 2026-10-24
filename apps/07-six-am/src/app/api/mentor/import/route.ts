import { mentorGuard } from "@/lib/server/access";
import { serverError } from "@/lib/server/failure";
import { loadMemory, saveMemory, unlockFor } from "@/lib/server/mentor-memory";
import { mergeSetupTracks } from "@/lib/mentor/memory";
import { setupInput, type PlaylistLike } from "@/lib/mentor/playlist";

// Import playlists (user test F8, L94): the tracks of pasted playlists (titles and uploaders only,
// read in the browser through the SoundCloud widget) join the library count for the taste profile
// unlock. No Claude call. POST { playlists } → { added, total, unlock }.
export async function POST(request: Request) {
  const g = mentorGuard(request);
  if ("error" in g) return g.error;
  const body = (await request.json().catch(() => null)) as { playlists?: unknown } | null;
  const lists = (Array.isArray(body?.playlists) ? body.playlists : [])
    .filter((p): p is PlaylistLike => !!p && typeof p === "object" && Array.isArray((p as PlaylistLike).sounds))
    .slice(0, 10);
  const si = setupInput(lists);
  if (!si.items.length) return Response.json({ error: "None of those playlists had tracks Six AM could read." }, { status: 400 });
  try {
    const mem = await loadMemory(g.store);
    const merged = mergeSetupTracks(mem.setupTracks, si.items);
    await saveMemory(g.store, { ...mem, setupTracks: merged });
    return Response.json({ added: merged.length - mem.setupTracks.length, total: merged.length, unlock: await unlockFor(g.store, undefined, { ...mem, setupTracks: merged }) });
  } catch (error) {
    return serverError(error);
  }
}
