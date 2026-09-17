import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { FilAriane } from "@/components/annuaire/FilAriane";
import { LienSeo } from "@/components/annuaire/LienSeo";
import { Markdown } from "@/components/blog/Markdown";
import { CarteArticle, dateLisible } from "@/components/blog/ListeBlog";
import { articleFn } from "@/lib/blog.functions";
import { headArticle } from "@/lib/seo-blog";
import type { PageArticle } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }): Promise<PageArticle> => {
    const page = (await articleFn({ data: { slug: params.slug } })) as PageArticle | null;
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) =>
    loaderData
      ? headArticle(loaderData)
      : { meta: [{ title: "Article introuvable" }, { name: "robots", content: "noindex" }] },
  component: VueArticle,
});

function VueArticle() {
  const { article, metier, autres } = Route.useLoaderData() as PageArticle;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <FilAriane
          items={[
            { label: "Accueil", href: "/" },
            { label: "Blog", href: "/blog" },
            { label: article.titre },
          ]}
        />

        <article className="mt-4">
          <p className="text-xs text-muted-foreground">
            Publié le {dateLisible(article.date_publication)}
            {article.updated_at.slice(0, 10) !== article.date_publication.slice(0, 10)
              ? ` · mis à jour le ${dateLisible(article.updated_at)}`
              : ""}
          </p>
          <h1 className="mt-2 max-w-3xl text-2xl font-semibold leading-tight sm:text-3xl">
            {article.titre}
          </h1>
          {article.extrait && (
            <p className="mt-4 max-w-3xl rounded-xl border border-border bg-card p-4 text-sm leading-relaxed">
              {article.extrait}
            </p>
          )}

          {article.image_couverture_url && (
            <img
              src={article.image_couverture_url}
              alt={article.titre}
              loading="lazy"
              className="mt-6 w-full max-w-3xl rounded-xl object-cover"
            />
          )}

          <Markdown contenu={article.contenu} />

          {metier && (
            <p className="mt-10 max-w-3xl rounded-xl border border-border bg-card p-4 text-sm">
              Vous cherchez un professionnel ? Découvrez tous les{" "}
              <LienSeo href={`/${metier.slug}`} className="font-medium underline hover:text-gold">
                {metier.plurielNom} référencés sur HairTrack
              </LienSeo>
              .
            </p>
          )}
        </article>

        {autres.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold">À lire aussi</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {autres.map((a) => (
                <CarteArticle key={a.id} article={a} />
              ))}
            </div>
            <Link to="/blog" className="mt-6 inline-block text-sm font-medium hover:text-gold">
              Tous les articles du blog →
            </Link>
          </section>
        )}
      </main>
      <PiedPublic />
    </div>
  );
}
