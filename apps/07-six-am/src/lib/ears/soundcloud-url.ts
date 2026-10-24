// SoundCloud URL parsing (F1): what the user pastes → a clean URL the widget can load, or a reason.

export type ParsedSoundCloud =
  | {
      ok: true;
      /** "short" = an on.soundcloud.com link; the widget resolves it, we can't (no CORS on the redirect). */
      kind: "track" | "set" | "short";
      /** Canonical https://soundcloud.com/… (or the api/on URL as given, cleaned) with no tracking params. */
      url: string;
      user?: string;
      slug?: string;
      /** For api.soundcloud.com/tracks/123 links. */
      trackId?: string;
      /** `?in=user/sets/name`: the playlist the track was opened from. */
      inSet?: string;
    }
  | { ok: false; reason: "empty" | "not-soundcloud" | "not-a-track" | "invalid"; message: string };

// First path segments that are SoundCloud pages, not users.
const RESERVED_ROOT = new Set([
  "discover", "you", "search", "charts", "stream", "upload", "settings", "pages", "terms-of-use",
  "messages", "notifications", "people", "pro", "mobile", "jobs", "imprint", "feed", "tags",
]);
// Second segments that are profile tabs, not track slugs.
const PROFILE_TABS = new Set([
  "tracks", "albums", "sets", "reposts", "likes", "followers", "following", "popular-tracks", "comments", "spotlight",
]);

const fail = (reason: "empty" | "not-soundcloud" | "not-a-track" | "invalid", message: string): ParsedSoundCloud => ({ ok: false, reason, message });

export function parseSoundCloudUrl(input: string | null | undefined): ParsedSoundCloud {
  const raw = (input ?? "").trim();
  if (!raw) return fail("empty", "Paste a SoundCloud track or playlist link.");
  let u: URL;
  try {
    u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return fail("invalid", "That doesn't look like a link.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return fail("invalid", "That doesn't look like a link.");
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const parts = u.pathname.split("/").filter(Boolean).map((p) => decodeURIComponent(p));

  if (host === "on.soundcloud.com") {
    if (parts.length !== 1 || !/^[A-Za-z0-9]+$/.test(parts[0])) return fail("invalid", "That short link looks incomplete.");
    return { ok: true, kind: "short", url: `https://on.soundcloud.com/${parts[0]}` };
  }
  if (host === "api.soundcloud.com") {
    if (parts[0] === "tracks" && /^\d+$/.test(parts[1] ?? "") && parts.length === 2)
      return { ok: true, kind: "track", url: `https://api.soundcloud.com/tracks/${parts[1]}`, trackId: parts[1] };
    if (parts[0] === "playlists" && /^\d+$/.test(parts[1] ?? "") && parts.length === 2)
      return { ok: true, kind: "set", url: `https://api.soundcloud.com/playlists/${parts[1]}` };
    return fail("not-a-track", "That SoundCloud link isn't a track or a playlist.");
  }
  if (host !== "soundcloud.com" && host !== "m.soundcloud.com") return fail("not-soundcloud", "Only SoundCloud links work here.");

  const [user, second, third, fourth] = parts;
  if (!user || RESERVED_ROOT.has(user.toLowerCase())) return fail("not-a-track", "That SoundCloud page isn't a track or a playlist.");
  if (!second) return fail("not-a-track", "That's a profile. Paste one of its tracks or playlists.");

  // Playlist: /user/sets/name (optionally /s-secret for a private share link).
  if (second === "sets") {
    if (!third) return fail("not-a-track", "That's a list of playlists. Open one and paste its link.");
    if (parts.length > 4 || (fourth && !/^s-[A-Za-z0-9]+$/.test(fourth))) return fail("not-a-track", "That SoundCloud page isn't a track or a playlist.");
    const path = [user, "sets", third, fourth].filter(Boolean).join("/");
    return { ok: true, kind: "set", url: `https://soundcloud.com/${path}`, user, slug: third };
  }
  if (PROFILE_TABS.has(second)) return fail("not-a-track", "That's a profile page. Paste one of its tracks or playlists.");
  // Track: /user/slug (optionally /s-secret). Anything deeper (/comments, /likes…) isn't a track.
  if (parts.length > 3 || (third && !/^s-[A-Za-z0-9]+$/.test(third))) return fail("not-a-track", "That SoundCloud page isn't a track or a playlist.");
  const inParam = u.searchParams.get("in");
  const inSet = inParam && /^[^/]+\/sets\/[^/]+/.test(inParam) ? inParam.replace(/^\/+|\/+$/g, "") : undefined;
  const path = [user, second, third].filter(Boolean).join("/");
  return { ok: true, kind: "track", url: `https://soundcloud.com/${path}`, user, slug: second, ...(inSet ? { inSet } : {}) };
}

/** Several links pasted at once (one per line, or comma-separated): parsed, de-duplicated by URL. */
export function parseSoundCloudList(text: string): { valid: Extract<ParsedSoundCloud, { ok: true }>[]; invalid: { input: string; message: string }[] } {
  const valid: Extract<ParsedSoundCloud, { ok: true }>[] = [];
  const invalid: { input: string; message: string }[] = [];
  const seen = new Set<string>();
  for (const token of text.split(/[\n,]+/).map((t) => t.trim()).filter(Boolean)) {
    const p = parseSoundCloudUrl(token);
    if (!p.ok) invalid.push({ input: token, message: p.message });
    else if (!seen.has(p.url)) { seen.add(p.url); valid.push(p); }
  }
  return { valid, invalid };
}
