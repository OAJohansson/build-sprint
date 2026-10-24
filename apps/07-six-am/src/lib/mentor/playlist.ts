// Setup input (M10): what the widget tells us about the person's playlists, cut down to a compact
// text for the setup job. Titles, uploaders, genres and tags only; nothing is listened to.
import { parseTagList } from "@/lib/ears/results";

/** The fields of a widget sound object this uses (ScSound in widget.ts has more). */
export type SoundLike = {
  title?: string | null;
  permalink_url?: string | null;
  user?: { username?: string | null } | null;
  genre?: string | null;
  tag_list?: string | null;
};
export type PlaylistLike = { title?: string | null; url?: string | null; sounds: SoundLike[] };

export type SetupInput = { text: string; playlists: number; tracks: number; urls: string[]; items: { url: string; title: string; uploader: string }[] };

const clean = (v: string | null | undefined, max: number) => (v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

// shortcut: caps of 60 tracks per playlist and 250 overall keep the setup prompt near 10k tokens;
// raise them (or sample evenly) if someone's playlists are much longer.
const PER_PLAYLIST = 60, TOTAL = 250, TOP_TAGS = 25;

/** Compact text: per playlist, one line per track ("uploader | title | genre | tags"), then the
 *  most common genres and tags across everything. Duplicate tracks are listed once. */
export function setupInput(playlists: PlaylistLike[]): SetupInput {
  const seen = new Set<string>();
  const counts = new Map<string, { label: string; n: number }>();
  const bump = (label: string) => {
    const k = label.toLowerCase();
    const c = counts.get(k);
    if (c) c.n += 1;
    else counts.set(k, { label, n: 1 });
  };
  const urls: string[] = [];
  const items: SetupInput["items"] = [];
  const blocks: string[] = [];
  let tracks = 0, used = 0;
  for (const [i, p] of playlists.entries()) {
    const lines: string[] = [];
    for (const s of p.sounds.slice(0, PER_PLAYLIST)) {
      if (tracks >= TOTAL) break;
      const title = clean(s.title, 140);
      const uploader = clean(s.user?.username, 60);
      const key = (s.permalink_url ?? `${uploader}|${title}`).toLowerCase();
      if (!title || seen.has(key)) continue;
      seen.add(key);
      tracks += 1;
      const genre = clean(s.genre, 60);
      const tags = parseTagList(s.tag_list).map((t) => clean(t, 40)).filter(Boolean).slice(0, 8);
      if (genre) bump(genre);
      tags.forEach(bump);
      if (s.permalink_url) { urls.push(s.permalink_url); items.push({ url: s.permalink_url, title, uploader }); }
      lines.push([uploader || "?", title, genre || "-", tags.join(", ") || "-", s.permalink_url ?? ""].join(" | "));
    }
    if (!lines.length) continue;
    used += 1;
    blocks.push(`Playlist ${i + 1}: ${clean(p.title, 120) || "untitled"} (${lines.length} tracks)\n${lines.join("\n")}`);
  }
  const top = [...counts.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label)).slice(0, TOP_TAGS);
  const summary = top.length ? `Most common uploader genres and tags: ${top.map((t) => `${t.label} ×${t.n}`).join(", ")}` : "No uploader genres or tags.";
  return {
    text: `Columns: uploader | title | uploader genre | uploader tags | url\n\n${blocks.join("\n\n")}\n\n${summary}`,
    playlists: used,
    tracks,
    urls,
    items,
  };
}
