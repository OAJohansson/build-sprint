import "server-only";

// A shared Instagram post or Pinterest pin arrives as a link with no picture (probe, 22 Oct),
// but both pages carry a public preview image (og:image). Fetch the page, find that image and
// keep a copy now: Instagram's image links expire. Anything that fails returns null, and the
// save asks for a screenshot instead (requirement 3b).
// Instagram's og:image is a zoomed square crop that cuts the outfit off (owner, 22 Oct), so for
// Instagram posts we read the post's public embed page first, which shows the photo as posted.
// shortcut: a carousel gives its first photo only, upgrade if sharing the third photo of a post matters.

// Named honestly as a link-preview bot: Instagram serves og:image to that, but not to a
// "phone browser" (checked 22 Oct), and we don't pretend to be anyone else's bot.
const UA = "Mozilla/5.0 (compatible; Selvedge/0.1; +https://selvedge-sandy.vercel.app)";
const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PAGE = 2 * 1024 * 1024, MAX_IMAGE = 4 * 1024 * 1024;

/** Only public web addresses: no localhost, no private networks, no other schemes. */
export function isPublicUrl(raw: string): boolean {
  let u: URL;
  try { u = new URL(raw); } catch { return false; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return false;
  if (/^(127|10|0)\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (h.includes(":")) return false; // IPv6 literals: none of our sources use them
  return h.includes(".");
}

async function fetchCapped(url: string, max: number, accept: string, ms: number) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: accept }, redirect: "follow", signal: AbortSignal.timeout(ms) });
  if (!res.ok || !res.body || !isPublicUrl(res.url)) return null;
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) { await reader.cancel(); return null; }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let at = 0;
  for (const c of chunks) { bytes.set(c, at); at += c.length; }
  return { bytes, type: (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase(), url: res.url };
}

/** The og:image (or twitter:image) of a page, resolved against the page's address. */
export function findPreviewImage(html: string, pageUrl: string): string | null {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const key = tag.match(/\b(?:property|name)\s*=\s*["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (key !== "og:image" && key !== "og:image:secure_url" && key !== "twitter:image") continue;
    const content = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i)?.[1];
    if (!content) continue;
    const decoded = content.replace(/&amp;/g, "&").replace(/&#x2F;/gi, "/").replace(/&quot;/g, '"');
    try { return new URL(decoded, pageUrl).toString(); } catch {}
  }
  return null;
}

/** The largest picture up to `max` px wide from an <img srcset>, else its src. */
export function pickFromSrcset(tag: string, max: number): string | null {
  const decode = (v: string) => v.replace(/&amp;/g, "&");
  const set = tag.match(/\bsrcset\s*=\s*"([^"]+)"/i)?.[1];
  const options = (set ? decode(set) : "").split(",").map((part) => {
    const [url, w] = part.trim().split(/\s+/);
    return { url, w: parseInt(w, 10) };
  }).filter((o) => o.url && o.w > 0 && o.w <= max).sort((a, b) => b.w - a.w);
  if (options[0]) return options[0].url;
  const src = tag.match(/\ssrc\s*=\s*"([^"]+)"/i)?.[1];
  return src ? decode(src) : null;
}

/** A real Instagram post photo, not the logo or a placeholder: served from its photo CDN
 *  (paths like /v/t51…) as JPEG or WebP. From data-centre servers Instagram sometimes answers
 *  with a login page whose picture is its logo (live, 22 Oct); that must never be kept. */
export function isInstagramPhoto(url: string, type: string): boolean {
  try {
    const u = new URL(url);
    return /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(u.hostname) && /^\/v\/t\d/.test(u.pathname) && (type === "image/jpeg" || type === "image/webp");
  } catch {
    return false;
  }
}

// What each Instagram fetch got, for the server logs (no personal data: hosts, paths, status).
const where = (url: string) => { try { const u = new URL(url); return u.hostname + u.pathname.slice(0, 40); } catch { return "?"; } };
const note = (msg: string) => console.log(`[instagram] ${msg}`);

async function keepIfPhoto(src: string | null, from: string) {
  if (!src || !isPublicUrl(src)) { note(`${from}: no picture found`); return null; }
  const image = await fetchCapped(src, MAX_IMAGE, "image/webp,image/jpeg,image/png", 8000);
  if (!image) { note(`${from}: picture didn't download (${where(src)})`); return null; }
  if (!isInstagramPhoto(image.url, image.type)) { note(`${from}: refused a non-photo (${image.type} from ${where(image.url)})`); return null; }
  return { bytes: image.bytes, type: image.type };
}

/** For an Instagram post or reel: its photo as posted (embed page), else og:image, never the logo. */
async function instagramPicture(link: string) {
  const code = link.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/);
  if (!code) { note("not a post link"); return null; }
  const embed = await fetchCapped(`https://www.instagram.com/${code[1]}/${code[2]}/embed/captioned/`, MAX_PAGE, "text/html", 6000);
  note(`embed page: ${embed ? `${embed.type}, ${embed.bytes.length} B, ended at ${where(embed.url)}` : "no answer"}`);
  if (embed?.type.includes("html")) {
    const tag = new TextDecoder().decode(embed.bytes).match(/<img\b[^>]*class="EmbeddedMediaImage"[^>]*>/i)?.[0];
    const posted = await keepIfPhoto(tag ? pickFromSrcset(tag, 1600) : null, "embed");
    if (posted) return posted;
  }
  // The preview is a zoomed square crop, but a real photo beats none.
  const page = await fetchCapped(link, MAX_PAGE, "text/html,application/xhtml+xml", 6000);
  note(`post page: ${page ? `${page.type}, ${page.bytes.length} B, ended at ${where(page.url)}` : "no answer"}`);
  if (!page?.type.includes("html")) return null;
  return keepIfPhoto(findPreviewImage(new TextDecoder().decode(page.bytes), page.url), "og:image");
}

export async function fetchLinkPicture(link: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  if (!isPublicUrl(link)) return null;
  try {
    // Instagram has its own path, and when it gives no real photo the save asks for a screenshot.
    if (/(^|\.)instagram\.com$/.test(new URL(link).hostname)) return await instagramPicture(link);
    const page = await fetchCapped(link, MAX_PAGE, "text/html,application/xhtml+xml", 6000);
    if (!page || !page.type.includes("html")) return null;
    const src = findPreviewImage(new TextDecoder().decode(page.bytes), page.url);
    if (!src || !isPublicUrl(src)) return null;
    const image = await fetchCapped(src, MAX_IMAGE, "image/webp,image/jpeg,image/png", 8000);
    return image && TYPES.includes(image.type) ? { bytes: image.bytes, type: image.type } : null;
  } catch (error) {
    console.error(`[app] Couldn't fetch the picture for ${new URL(link).hostname}: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}
