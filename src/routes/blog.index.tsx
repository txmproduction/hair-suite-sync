import { createFileRoute } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { VueListeBlog } from "@/components/blog/ListeBlog";
import { listeArticlesFn } from "@/lib/blog.functions";
import { headListeBlog } from "@/lib/seo-blog";
import type { ListeArticles } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/")({
  loader: async (): Promise<ListeArticles> =>
    (await listeArticlesFn({ data: { page: 1 } })) as ListeArticles,
  head: ({ loaderData }) =>
    loaderData
      ? headListeBlog(loaderData)
      : { meta: [{ title: "Blog HairTrack" }, { name: "robots", content: "noindex" }] },
  component: PageBlog,
});

function PageBlog() {
  const liste = Route.useLoaderData() as ListeArticles;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <VueListeBlog liste={liste} />
      <PiedPublic />
    </div>
  );
}
