import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { lots, reponseXml, urlset } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-villes/$n")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { chargerDonneesSitemap } = await import("@/lib/annuaire-seo.server");
        const { pagesVilles } = await chargerDonneesSitemap();
        const index = Math.max(1, Number(params.n) || 1) - 1;
        const lot = lots(pagesVilles)[index] ?? [];
        return reponseXml(
          urlset(
            lot.map((p) => ({
              loc: p.loc,
              lastmod: p.lastmod,
              changefreq: "daily",
              // Les villes à forte densité de professionnels passent en priorité haute.
              priority: p.nb >= 20 ? "0.9" : p.nb >= 8 ? "0.8" : "0.6",
            })),
          ),
        );
      },
    },
  },
});
