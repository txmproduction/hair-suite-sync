import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { lots, reponseXml, urlset } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-salons/$n")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const { chargerDonneesSitemap } = await import("@/lib/annuaire-seo.server");
        const { salons } = await chargerDonneesSitemap();
        const index = Math.max(1, Number(params.n) || 1) - 1;
        const lot = lots(salons)[index] ?? [];
        return reponseXml(
          urlset(
            lot.map((s) => ({
              loc: s.loc,
              lastmod: s.lastmod,
              changefreq: "weekly",
              priority: "0.7",
            })),
          ),
        );
      },
    },
  },
});
