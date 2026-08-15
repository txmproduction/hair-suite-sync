// JSON-LD des fiches professionnels, construit uniquement à partir de données
// réelles : ni note ni avis inventés, ni valeur par défaut.
import { absolu } from "@/lib/seo";
import { parCategorie } from "@/lib/categories";
import type { FicheSalon } from "@/lib/annuaire-types";

const TYPES: Record<string, string> = {
  coiffeur: "HairSalon",
  barbier: "HairSalon",
  manucure: "NailSalon",
  institut_beaute: "BeautySalon",
  bien_etre: "DaySpa",
  massage: "DaySpa",
};

const JOURS_SCHEMA = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function jsonLdSalon(fiche: FicheSalon) {
  const { salon, photos, prestations, horaires, avis } = fiche;
  const info = parCategorie(salon.categorie);
  const url = absolu(`/salon/${salon.slug}`);
  const images = [salon.photo_couverture_url, ...photos.map((p) => p.url)].filter(
    (u): u is string => !!u && u.startsWith("https://"),
  );
  const prix = prestations.map((p) => p.prix).filter((p) => p > 0);

  const donnees: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": TYPES[salon.categorie] ?? "HealthAndBeautyBusiness",
    "@id": url,
    name: salon.nom,
    url,
    ...(images.length ? { image: images.slice(0, 6) } : {}),
    ...(salon.description ? { description: salon.description } : {}),
    ...(salon.telephone ? { telephone: salon.telephone } : {}),
    ...(info ? { additionalType: info.label } : {}),
    address: {
      "@type": "PostalAddress",
      ...(salon.adresse ? { streetAddress: salon.adresse } : {}),
      ...(salon.ville ? { addressLocality: salon.ville } : {}),
      ...(salon.code_postal ? { postalCode: salon.code_postal } : {}),
      addressCountry: "FR",
    },
    ...(salon.latitude !== null && salon.longitude !== null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: salon.latitude,
            longitude: salon.longitude,
          },
        }
      : {}),
    ...(prix.length
      ? { priceRange: `${Math.round(Math.min(...prix))} € - ${Math.round(Math.max(...prix))} €` }
      : {}),
  };

  const ouverts = horaires.filter((h) => !h.ferme && h.ouverture && h.fermeture);
  if (ouverts.length) {
    donnees["openingHoursSpecification"] = ouverts.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: `https://schema.org/${JOURS_SCHEMA[h.jour] ?? "Monday"}`,
      opens: h.ouverture.slice(0, 5),
      closes: h.fermeture.slice(0, 5),
    }));
  }

  // aggregateRating uniquement si des avis réels existent (HairTrack ou Google).
  const nbHt = Number(salon.nb_avis ?? 0);
  const nbGoogle = Number(salon.nb_avis_google ?? 0);
  if (salon.note_moyenne !== null && nbHt > 0) {
    donnees["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: salon.note_moyenne,
      reviewCount: nbHt,
      bestRating: 5,
      worstRating: 1,
    };
  } else if (salon.note_google !== null && nbGoogle > 0) {
    donnees["aggregateRating"] = {
      "@type": "AggregateRating",
      ratingValue: salon.note_google,
      reviewCount: nbGoogle,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const avisPublies = avis.filter((a) => a.note > 0);
  if (avisPublies.length) {
    donnees["review"] = avisPublies.slice(0, 10).map((a) => ({
      "@type": "Review",
      datePublished: a.created_at.slice(0, 10),
      reviewRating: { "@type": "Rating", ratingValue: a.note, bestRating: 5, worstRating: 1 },
      ...(a.client_nom ? { author: { "@type": "Person", name: a.client_nom } } : {}),
      ...(a.commentaire ? { reviewBody: a.commentaire } : {}),
    }));
  }

  if (prestations.length) {
    donnees["hasOfferCatalog"] = {
      "@type": "OfferCatalog",
      name: `Prestations — ${salon.nom}`,
      itemListElement: prestations.slice(0, 50).map((p) => ({
        "@type": "Offer",
        priceCurrency: "EUR",
        price: p.prix,
        itemOffered: {
          "@type": "Service",
          name: p.nom,
        },
      })),
    };
  }

  return donnees;
}

export function jsonLdFilArianeSalon(fiche: FicheSalon) {
  const info = parCategorie(fiche.salon.categorie);
  const items = [
    { name: "Accueil", item: "/" },
    ...(info ? [{ name: info.label, item: `/${info.slug}` }] : []),
    ...(info && fiche.salon.ville
      ? [
          {
            name: fiche.salon.ville,
            item: `/${info.slug}/${fiche.salon.ville
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")}`,
          },
        ]
      : []),
    { name: fiche.salon.nom, item: `/salon/${fiche.salon.slug}` },
  ];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: e.name,
      item: absolu(e.item),
    })),
  };
}
