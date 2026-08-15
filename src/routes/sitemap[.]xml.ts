import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { lots, reponseXml, sitemapindex } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { chargerDonneesSitemap } = await import("@/lib/annuaire-seo.server");
        const donnees = await chargerDonneesSitemap();
        const nbVilles = lots(donnees.pagesVilles).length;
        const nbSalons = lots(donnees.salons).length;
        const chemins = [
          "/sitemap-pages.xml",
          "/sitemap-metiers.xml",
          ...Array.from({ length: nbVilles }, (_, i) => `/sitemap-villes/${i + 1}`),
          ...Array.from({ length: nbSalons }, (_, i) => `/sitemap-salons/${i + 1}`),
        ];
        return reponseXml(sitemapindex(chemins));
      },
    },
  },
});
