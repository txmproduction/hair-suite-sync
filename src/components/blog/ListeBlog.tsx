import { Link } from "@tanstack/react-router";
import { FilAriane } from "@/components/annuaire/FilAriane";
import { LienSeo } from "@/components/annuaire/LienSeo";
import { parCategorie } from "@/lib/categories";
import type { ListeArticles, ResumeArticle } from "@/lib/blog-types";

export const dateLisible = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function CarteArticle({ article }: { article: ResumeArticle }) {
  const info = article.categorie_metier ? parCategorie(article.categorie_metier) : null;
  return (
    <article className="card-soft flex flex-col overflow-hidden">
      {article.image_couverture_url && (
        <img
          src={article.image_couverture_url}
          alt={article.titre}
          loading="lazy"
          className="h-40 w-full object-cover"
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs text-muted-foreground">
          {dateLisible(article.date_publication)}
          {info ? ` · ${info.label}` : ""}
        </p>
        <h2 className="mt-2 text-base font-semibold leading-snug">
          <Link to="/blog/$slug" params={{ slug: article.slug }} className="hover:text-gold">
            {article.titre}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-4 flex-1 text-sm text-muted-foreground">{article.extrait}</p>
        <Link
          to="/blog/$slug"
          params={{ slug: article.slug }}
          className="mt-4 text-sm font-medium hover:text-gold"
        >
          Lire l'article →
        </Link>
      </div>
    </article>
  );
}

export function VueListeBlog({ liste }: { liste: ListeArticles }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <FilAriane
        items={[
          { label: "Accueil", href: "/" },
          ...(liste.page > 1
            ? [{ label: "Blog", href: "/blog" }, { label: `Page ${liste.page}` }]
            : [{ label: "Blog" }]),
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
        Le blog HairTrack{liste.page > 1 ? ` — page ${liste.page}` : ""}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        Conseils pratiques pour les professionnels de la coiffure, de la barberie, de l'onglerie et
        du bien-être : réservation en ligne, acompte, organisation du salon et visibilité locale.
      </p>

      {liste.articles.length === 0 ? (
        <p className="mt-10 text-muted-foreground">Aucun article publié pour le moment.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {liste.articles.map((a) => (
            <CarteArticle key={a.id} article={a} />
          ))}
        </div>
      )}

      {liste.nbPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex flex-wrap gap-2 text-sm">
          {Array.from({ length: liste.nbPages }, (_, n) => n + 1).map((n) => (
            <LienSeo
              key={n}
              href={n === 1 ? "/blog" : `/blog/page/${n}`}
              className={
                n === liste.page
                  ? "rounded-lg bg-foreground px-3 py-1.5 text-background"
                  : "rounded-lg border border-border px-3 py-1.5 hover:bg-muted"
              }
            >
              {n}
            </LienSeo>
          ))}
        </nav>
      )}
    </main>
  );
}
