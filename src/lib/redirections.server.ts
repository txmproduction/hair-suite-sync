// Redirections 301 : forme canonique de l'URL, puis table `redirections`.
import { cheminCanonique } from "@/lib/seo";

const EXCLUS = [
  "/api/",
  "/_",
  "/assets/",
  "/lovable/",
  "/sw.js",
  "/favicon",
  "/manifest.webmanifest",
  "/robots.txt",
];

/** Ne s'applique qu'aux pages HTML : on laisse passer assets, API et fichiers. */
function estPageHtml(url: URL) {
  if (EXCLUS.some((e) => url.pathname.startsWith(e))) return false;
  const dernier = url.pathname.split("/").pop() ?? "";
  return !dernier.includes(".");
}

/** Redirection de normalisation (minuscules, accents, slash final). */
export function redirectionCanonique(url: URL): string | null {
  if (!estPageHtml(url)) return null;
  if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
    return `${url.pathname.replace(/\/+$/, "")}${url.search}`;
  }
  const canonique = cheminCanonique(url.pathname);
  return canonique ? `${canonique}${url.search}` : null;
}

const cache = new Map<string, { cible: string | null; expire: number }>();

/** Cible enregistrée dans la table `redirections` pour un chemin donné. */
export async function redirectionEnregistree(chemin: string): Promise<string | null> {
  const enCache = cache.get(chemin);
  if (enCache && enCache.expire > Date.now()) return enCache.cible;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("redirections")
    .select("chemin_cible")
    .eq("chemin_source", chemin)
    .maybeSingle();
  const cible = data?.chemin_cible ?? null;
  cache.set(chemin, { cible, expire: Date.now() + 5 * 60_000 });
  return cible;
}

export function estRedirigeable(request: Request, url: URL) {
  return (request.method === "GET" || request.method === "HEAD") && estPageHtml(url);
}
