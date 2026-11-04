// Keep the stable public photo path; only the private-storage delivery changes.
export const PHOTO_SIGNED_TTL_SECONDS = 7 * 24 * 60 * 60;
const REUSE_MS = 24 * 60 * 60 * 1000;
const MAX_LINKS = 1000;
const PHOTO_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/\d{1,3}\.jpg$/i;

type SignPhoto = (path: string, expiresIn: number) => Promise<string | null>;

/** Bounded, per-instance link cache, with in-flight deduplication and expiry headroom. */
export function createPhotoDelivery(sign: SignPhoto, now = Date.now) {
  const links = new Map<string, { url: string; until: number }>();
  const pending = new Map<string, Promise<string | null>>();

  return async (path: string): Promise<Response> => {
    if (!PHOTO_PATH.test(path)) {
      return new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });
    }

    const cached = links.get(path);
    let url = cached && cached.until > now() ? cached.url : undefined;
    if (!url) {
      let signing = pending.get(path);
      if (!signing) {
        signing = sign(path, PHOTO_SIGNED_TTL_SECONDS);
        pending.set(path, signing);
      }
      try {
        url = (await signing) ?? undefined;
        if (url) {
          if (links.size >= MAX_LINKS) {
            const oldest = links.keys().next().value;
            if (oldest !== undefined) links.delete(oldest);
          }
          links.set(path, { url, until: now() + REUSE_MS });
        }
      } catch {
        url = undefined;
      } finally {
        pending.delete(path);
      }
    }

    if (!url) return new Response("Introuvable", { status: 404, headers: { "Cache-Control": "no-store" } });

    // Redirects outlive neither the reuse window nor the signed URL. Never mark
    // these immutable: a resynchronisation may overwrite the same object path.
    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
        "Referrer-Policy": "no-referrer",
      },
    });
  };
}