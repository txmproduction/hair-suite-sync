import { createFileRoute } from "@tanstack/react-router";
import { chargerSitemap } from "@/lib/annuaire.server";
import { slugVille } from "@/lib/categories";

const BASE = "https://hairtrack.fr";

export const Route = createFileRoute("/sitemap[.]xml")({
  server: {
    handlers: {
      GET: async () => {
        const { salons, pages } = await chargerSitemap();
        const urls = [
          `${BASE}/`,
          `${BASE}/recherche`,
          `${BASE}/distribuer`,
          `${BASE}/mentions-legales`,
          `${BASE}/cgv`,
          ...pages.map((p) => `${BASE}/${p.categorie.replace(/_/g, "-")}/${slugVille(p.ville)}`),
          ...salons.map((s) => `${BASE}/salon/${s.slug}`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n")}
</urlset>`;
        return new Response(xml, {
          headers: { "content-type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
