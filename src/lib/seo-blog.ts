// head() des pages du blog : meta uniques, canonical auto-référent et JSON-LD
// rendu côté serveur, construit uniquement à partir des données réelles de l'article.
import { absolu, metaOg } from "@/lib/seo";
import type { ListeArticles, PageArticle } from "@/lib/blog-types";

const jsonLd = (donnees: unknown) => ({
  type: "application/ld+json",
  children: JSON.stringify(donnees),
});

const filAriane = (elements: { name: string; item: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: elements.map((e, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: e.name,
    item: absolu(e.item),
  })),
});

const coupe = (texte: string, max = 160) =>
  texte.length <= max ? texte : `${texte.slice(0, max - 1).trimEnd()}…`;

const EDITEUR = {
  "@type": "Organization",
  name: "HairTrack",
  url: absolu("/"),
};

export function headListeBlog(liste: ListeArticles) {
  const chemin = liste.page > 1 ? `/blog/page/${liste.page}` : "/blog";
  const url = absolu(chemin);
  const suffixe = liste.page > 1 ? ` — page ${liste.page}` : "";
  const titre = `Blog HairTrack : conseils pour les pros de la beauté${suffixe}`;
  const description = coupe(
    "Conseils pratiques pour les coiffeurs, barbiers, prothésistes ongulaires et instituts : réservation en ligne, acompte, gestion du salon et visibilité locale.",
  );

  const links: { rel: string; href: string }[] = [{ rel: "canonical", href: url }];
  if (liste.page > 1)
    links.push({
      rel: "prev",
      href: absolu(liste.page === 2 ? "/blog" : `/blog/page/${liste.page - 1}`),
    });
  if (liste.page < liste.nbPages)
    links.push({ rel: "next", href: absolu(`/blog/page/${liste.page + 1}`) });

  return {
    meta: [
      ...metaOg({ titre, description, url }),
      { name: "robots", content: liste.total > 0 ? "index, follow" : "noindex, follow" },
    ],
    links,
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Blog",
        name: "Blog HairTrack",
        description,
        url,
        inLanguage: "fr-FR",
        publisher: EDITEUR,
        blogPost: liste.articles.map((a) => ({
          "@type": "BlogPosting",
          headline: a.titre,
          url: absolu(`/blog/${a.slug}`),
          datePublished: a.date_publication,
        })),
      }),
      jsonLd(
        filAriane([
          { name: "Accueil", item: "/" },
          { name: "Blog", item: "/blog" },
        ]),
      ),
    ],
  };
}

export function headArticle(page: PageArticle) {
  const { article } = page;
  const url = absolu(`/blog/${article.slug}`);
  const description = coupe(article.extrait);
  const image =
    article.image_couverture_url && article.image_couverture_url.startsWith("https://")
      ? article.image_couverture_url
      : undefined;

  return {
    meta: [
      ...metaOg({
        titre: `${article.titre} | HairTrack`,
        description,
        url,
        type: "article",
        ...(image ? { image } : {}),
      }),
      { name: "robots", content: "index, follow" },
      { property: "article:published_time", content: article.date_publication },
      { property: "article:modified_time", content: article.updated_at },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.titre,
        description,
        url,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        inLanguage: "fr-FR",
        datePublished: article.date_publication,
        dateModified: article.updated_at,
        author: EDITEUR,
        publisher: EDITEUR,
        ...(image ? { image } : {}),
      }),
      jsonLd(
        filAriane([
          { name: "Accueil", item: "/" },
          { name: "Blog", item: "/blog" },
          { name: article.titre, item: `/blog/${article.slug}` },
        ]),
      ),
    ],
  };
}
