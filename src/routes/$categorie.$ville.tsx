import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { ResultatsSalons } from "@/routes/recherche";
import { parSlugCategorie, villeSlug } from "@/lib/categories";

type Contexte = { categorie: string; label: string; pluriel: string; ville: string };

function resoudre(paramCategorie: string, paramVille: string): Contexte | null {
  const info = parSlugCategorie(paramCategorie);
  if (!info) return null;
  const ville = paramVille
    .split("-")
    .map((m) => (m.length > 2 ? m.charAt(0).toUpperCase() + m.slice(1) : m))
    .join("-");
  return { categorie: info.value, label: info.label, pluriel: info.pluriel, ville };
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
    const url = `https://hairtrack.fr/${villeSlug(ctx.label)}/${villeSlug(ctx.ville)}`;
    const titre = `${ctx.label} à ${ctx.ville} — réservez en ligne | HairTrack`;
    const desc = `Trouvez un ${ctx.label.toLowerCase()} à ${ctx.ville}, comparez les prestations, les prix et les avis, puis réservez votre rendez-vous en ligne en quelques secondes.`;
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
          sousTitre={`Les meilleurs salons de ${ctx.pluriel} à ${ctx.ville}, avec réservation en ligne immédiate.`}
        />
      </main>
      <PiedPublic />
    </div>
  );
}
