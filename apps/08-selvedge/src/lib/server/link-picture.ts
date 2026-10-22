import "server-only";

// A shared Instagram post or Pinterest pin arrives as a link with no picture (probe, 22 Oct),
// but both pages carry a public preview image (og:image). Fetch the page, find that image and
// keep a copy now: Instagram's image links expire. Anything that fails returns null, and the
// save asks for a screenshot instead (requirement 3b).
// shortcut: reads og:image only, upgrade to a site's own embed API if og:image stops working.

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

export async function fetchLinkPicture(link: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  if (!isPublicUrl(link)) return null;
  try {
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
