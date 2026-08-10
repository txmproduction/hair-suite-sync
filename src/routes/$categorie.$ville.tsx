import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { ResultatsSalons } from "@/routes/recherche";
import { parSlugCategorie, villeSlug } from "@/lib/categories";

type Contexte = {
  categorie: string;
  slug: string;
  label: string;
  pluriel: string;
  plurielNom: string;
  ville: string;
};

function resoudre(paramCategorie: string, paramVille: string): Contexte | null {
  const info = parSlugCategorie(paramCategorie);
  if (!info) return null;
  const ville = paramVille
    .split("-")
    .map((m) => (m.length > 2 ? m.charAt(0).toUpperCase() + m.slice(1) : m))
    .join("-");
  return {
    categorie: info.value,
    slug: info.slug,
    label: info.label,
    pluriel: info.pluriel,
    plurielNom: info.plurielNom,
    ville,
  };
}

export const Route = createFileRoute("/$categorie/$ville")({
  loader: ({ params }): Contexte => {
    const ctx = resoudre(params.categorie, params.ville);
    if (!ctx) throw notFound();
    return ctx;
  },
  head: ({ loaderData }) => {
    const ctx = loaderData as Contexte | undefined;
    if (!ctx) return {};
    const url = `https://hairtrack.fr/${ctx.slug}/${villeSlug(ctx.ville)}`;
    const titre = `Trouvez les meilleurs ${ctx.plurielNom} à proximité de ${ctx.ville} | HairTrack`;
    const desc = `${ctx.label} à ${ctx.ville} : comparez les prestations, les prix et les avis, puis réservez votre rendez-vous en ligne en quelques secondes sur HairTrack.`;
    return {
      meta: [
        { title: titre },
        { name: "description", content: desc },
        { property: "og:title", content: titre },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PageLocale,
});

function PageLocale() {
  const ctx = Route.useLoaderData() as Contexte;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <ResultatsSalons
          categorie={ctx.categorie}
          ville={ctx.ville}
          titre={`${ctx.label} à ${ctx.ville}`}
          sousTitre={`Les meilleurs ${ctx.plurielNom} à ${ctx.ville}, avec réservation en ligne immédiate.`}
        />
      </main>
      <PiedPublic />
    </div>
  );
}
