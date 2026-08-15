import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { reponseXml, urlset } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-pages.xml")({
  server: {
    handlers: {
      GET: async () =>
        reponseXml(
          urlset([
            { loc: "/", changefreq: "daily", priority: "1.0" },
            { loc: "/villes", changefreq: "weekly", priority: "0.7" },
            { loc: "/metiers", changefreq: "weekly", priority: "0.7" },
            { loc: "/distribuer", changefreq: "monthly", priority: "0.4" },
            { loc: "/mentions-legales", changefreq: "yearly", priority: "0.2" },
            { loc: "/cgv", changefreq: "yearly", priority: "0.2" },
          ]),
        ),
    },
  },
});
