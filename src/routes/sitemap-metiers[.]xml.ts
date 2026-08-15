import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { reponseXml, urlset } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-metiers.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { chargerDonneesSitemap } = await import("@/lib/annuaire-seo.server");
        const { pagesMetiers, pagesDepartements } = await chargerDonneesSitemap();
        return reponseXml(
          urlset([
            ...pagesMetiers.map((p) => ({
              loc: p.loc,
              changefreq: "daily",
              priority: "0.9",
            })),
            ...pagesDepartements.map((p) => ({
              loc: p.loc,
              changefreq: "weekly",
              priority: p.nb >= 20 ? "0.8" : "0.6",
            })),
          ]),
        );
      },
    },
  },
});
