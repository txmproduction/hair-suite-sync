import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { VueListeBlog } from "@/components/blog/ListeBlog";
import { listeArticlesFn } from "@/lib/blog.functions";
import { headListeBlog } from "@/lib/seo-blog";
import type { ListeArticles } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/page/$page")({
  loader: async ({ params }): Promise<ListeArticles> => {
    const page = Number(params.page);
    if (!Number.isInteger(page) || page < 2) throw notFound();
    const liste = (await listeArticlesFn({ data: { page } })) as ListeArticles;
    if (liste.page !== page) throw notFound();
    return liste;
  },
  head: ({ loaderData }) =>
    loaderData
      ? headListeBlog(loaderData)
      : { meta: [{ title: "Blog HairTrack" }, { name: "robots", content: "noindex" }] },
  component: PageBlogPaginee,
});

function PageBlogPaginee() {
  const liste = Route.useLoaderData() as ListeArticles;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <VueListeBlog liste={liste} />
      <PiedPublic />
    </div>
  );
}
