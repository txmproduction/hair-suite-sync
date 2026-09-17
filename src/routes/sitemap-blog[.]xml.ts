import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { reponseXml, urlset } from "@/lib/sitemap-xml";

export const Route = createFileRoute("/sitemap-blog.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { chargerSitemapBlog } = await import("@/lib/blog.server");
        const articles = await chargerSitemapBlog();
        return reponseXml(
          urlset([
            { loc: "/blog", changefreq: "weekly", priority: "0.7" },
            ...articles.map((a) => ({
              loc: a.loc,
              lastmod: a.lastmod,
              changefreq: "monthly",
              priority: "0.6",
            })),
          ]),
        );
      },
    },
  },
});
