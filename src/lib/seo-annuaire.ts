// Construction du head() des pages d'annuaire : meta uniques, canonical
// auto-référent, robots conditionnel, et JSON-LD rendu côté serveur.
import { BASE_URL, absolu, metaOg } from "@/lib/seo";
import { contenuPageLocale } from "@/lib/contenu-seo";
import type { PageDepartement, PageLocale, PageMetier } from "@/lib/annuaire-seo-types";

export const SEUIL_INDEXATION = 3;

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

export function headPageLocale(page: PageLocale) {
  const cheminBase = `/${page.slugCategorie}/${page.villeSlug}`;
  const chemin = page.page > 1 ? `${cheminBase}/page-${page.page}` : cheminBase;
  const url = absolu(chemin);
  const suffixePage = page.page > 1 ? ` — page ${page.page}` : "";
  const titre = `${page.label} à ${page.ville} : réservez en ligne${suffixePage} | HairTrack`;
  const description = coupe(
    `Trouvez votre meilleur ${page.label.toLowerCase()} à proximité de ${page.ville} sur HairTrack. ${page.total} professionnel${page.total > 1 ? "s" : ""} disponible${page.total > 1 ? "s" : ""}, avis clients, réservation en ligne 7j/7.`,
  );
  const indexable = page.total >= SEUIL_INDEXATION;

  const { faq } = contenuPageLocale(page);

  const links: { rel: string; href: string }[] = [{ rel: "canonical", href: url }];
  if (page.page > 1)
    links.push({
      rel: "prev",
      href: absolu(page.page === 2 ? cheminBase : `${cheminBase}/page-${page.page - 1}`),
    });
  if (page.page < page.nbPages)
    links.push({ rel: "next", href: absolu(`${cheminBase}/page-${page.page + 1}`) });

  return {
    meta: [
      ...metaOg({ titre, description, url }),
      { name: "robots", content: indexable ? "index, follow" : "noindex, follow" },
      ...(page.departement
        ? [{ name: "geo.region", content: `FR-${page.departement.code}` }]
        : []),
      { name: "geo.placename", content: page.ville },
    ],
    links,
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: titre,
        description,
        url,
        inLanguage: "fr-FR",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: page.total,
          itemListElement: page.salons.map((s, i) => ({
            "@type": "ListItem",
            position: (page.page - 1) * 20 + i + 1,
            name: s.nom,
            url: absolu(`/salon/${s.slug}`),
          })),
        },
      }),
      jsonLd(
        filAriane([
          { name: "Accueil", item: "/" },
          { name: page.label, item: `/${page.slugCategorie}` },
          ...(page.departement
            ? [
                {
                  name: page.departement.nom,
                  item: `/${page.slugCategorie}/${page.departement.slug}`,
                },
              ]
            : []),
          { name: page.ville, item: cheminBase },
        ]),
      ),
      // Le bloc FAQ reste visible pour les visiteurs ; il n'est pas balisé en
      // FAQPage, ce rich result n'étant plus servi par Google pour ce type de site.
      ...(faq.length ? [] : []),
    ],
  };
}

export function headPageMetier(page: PageMetier) {
  const url = absolu(`/${page.slugCategorie}`);
  const titre = `${page.label} : réservez en ligne partout en France | HairTrack`;
  const description = coupe(
    `Trouvez un ${page.label.toLowerCase()} près de chez vous : ${page.total} professionnel${page.total > 1 ? "s" : ""} référencé${page.total > 1 ? "s" : ""} dans ${page.villes.length} ville${page.villes.length > 1 ? "s" : ""}, avis clients et réservation en ligne 7j/7.`,
  );
  return {
    meta: [
      ...metaOg({ titre, description, url }),
      { name: "robots", content: page.total > 0 ? "index, follow" : "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: titre,
        description,
        url,
        inLanguage: "fr-FR",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: page.villes.length,
          itemListElement: page.villes.slice(0, 50).map((v, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${page.label} à ${v.nom}`,
            url: absolu(`/${page.slugCategorie}/${v.slug}`),
          })),
        },
      }),
      jsonLd(
        filAriane([
          { name: "Accueil", item: "/" },
          { name: page.label, item: `/${page.slugCategorie}` },
        ]),
      ),
    ],
  };
}

export function headPageDepartement(page: PageDepartement) {
  const url = absolu(`/${page.slugCategorie}/${page.departement.slug}`);
  const titre = `${page.label} en ${page.departement.nom} : réserver en ligne | HairTrack`;
  const description = coupe(
    `${page.total} ${page.total > 1 ? page.plurielNom : page.label.toLowerCase()} référencé${page.total > 1 ? "s" : ""} en ${page.departement.nom}, dans ${page.villes.length} ville${page.villes.length > 1 ? "s" : ""} : avis clients, tarifs affichés et réservation en ligne 7j/7.`,
  );
  return {
    meta: [
      ...metaOg({ titre, description, url }),
      {
        name: "robots",
        content: page.total >= SEUIL_INDEXATION ? "index, follow" : "noindex, follow",
      },
      { name: "geo.region", content: `FR-${page.departement.code}` },
      { name: "geo.placename", content: page.departement.nom },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: [
      jsonLd({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: titre,
        description,
        url,
        inLanguage: "fr-FR",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: page.villes.length,
          itemListElement: page.villes.slice(0, 50).map((v, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: `${page.label} à ${v.nom}`,
            url: absolu(`/${page.slugCategorie}/${v.slug}`),
          })),
        },
      }),
      jsonLd(
        filAriane([
          { name: "Accueil", item: "/" },
          { name: page.label, item: `/${page.slugCategorie}` },
          { name: page.departement.nom, item: `/${page.slugCategorie}/${page.departement.slug}` },
        ]),
      ),
    ],
  };
}

export { BASE_URL };
