import { absolu } from "@/lib/seo";

export const TAILLE_LOT = 50_000;

export type EntreeSitemap = {
  loc: string;
  lastmod?: string | null | undefined;
  changefreq?: string | undefined;
  priority?: string | undefined;
};

const echapper = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function reponseXml(xml: string) {
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

export function urlset(entrees: EntreeSitemap[]) {
  const corps = entrees
    .map((e) =>
      [
        "  <url>",
        `    <loc>${echapper(absolu(e.loc))}</loc>`,
        e.lastmod ? `    <lastmod>${new Date(e.lastmod).toISOString().slice(0, 10)}</lastmod>` : null,
        e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
        e.priority ? `    <priority>${e.priority}</priority>` : null,
        "  </url>",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corps}
</urlset>`;
}

export function sitemapindex(chemins: string[]) {
  const corps = chemins
    .map((c) => `  <sitemap><loc>${echapper(absolu(c))}</loc></sitemap>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corps}
</sitemapindex>`;
}

export const lots = <T,>(items: T[], taille = TAILLE_LOT): T[][] => {
  if (!items.length) return [[]];
  const sortie: T[][] = [];
  for (let i = 0; i < items.length; i += taille) sortie.push(items.slice(i, i + taille));
  return sortie;
};
