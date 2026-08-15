// Helpers SEO partagés : URL absolues, slugs normalisés, chemins canoniques.
export const BASE_URL = "https://hairtrack.fr";

export const OG_IMAGE = `${BASE_URL}/og-hairtrack.jpg`;

export const absolu = (chemin: string) =>
  `${BASE_URL}${chemin.startsWith("/") ? chemin : `/${chemin}`}`;

/** minuscules, accents retirés, apostrophes et espaces en tirets. */
export const normaliserSlug = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Renvoie la version canonique d'un chemin (minuscules, sans accents, sans
 * slash final, sans doubles tirets) ou null s'il est déjà canonique.
 */
export function cheminCanonique(chemin: string): string | null {
  if (chemin === "/") return null;
  const segments = chemin.split("/").filter(Boolean).map(normaliserSlug).filter(Boolean);
  const canonique = `/${segments.join("/")}`;
  return canonique === chemin ? null : canonique;
}

export const metaOg = ({
  titre,
  description,
  url,
  type = "website",
  image = OG_IMAGE,
}: {
  titre: string;
  description: string;
  url: string;
  type?: string;
  image?: string;
}) => [
  { title: titre },
  { name: "description", content: description },
  { property: "og:title", content: titre },
  { property: "og:description", content: description },
  { property: "og:type", content: type },
  { property: "og:url", content: url },
  { property: "og:locale", content: "fr_FR" },
  { property: "og:site_name", content: "HairTrack" },
  { property: "og:image", content: image },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: image },
];
