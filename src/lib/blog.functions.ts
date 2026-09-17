import { createServerFn } from "@tanstack/react-start";

export const listeArticlesFn = createServerFn({ method: "GET" })
  .inputValidator((data?: { page?: number }) => ({
    page: Number.isFinite(Number(data?.page)) ? Math.max(1, Math.floor(Number(data?.page))) : 1,
  }))
  .handler(async ({ data }) => {
    const { chargerListeArticles } = await import("./blog.server");
    return chargerListeArticles(data.page);
  });

export const articleFn = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({
    slug: String(data.slug ?? "").slice(0, 200),
  }))
  .handler(async ({ data }) => {
    const { chargerArticle } = await import("./blog.server");
    return chargerArticle(data.slug);
  });
