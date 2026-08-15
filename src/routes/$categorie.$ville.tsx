import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { VuePageDepartement, VuePageLocale } from "@/components/annuaire/PageAnnuaire";
import { pageDepartementFn, pageLocaleFn } from "@/lib/annuaire-seo.functions";
import { headPageDepartement, headPageLocale } from "@/lib/seo-annuaire";
import { departementParSlug } from "@/lib/geo-fr";
import type { PageDepartement, PageLocale } from "@/lib/annuaire-seo-types";

type Donnees =
  | { genre: "ville"; page: PageLocale }
  | { genre: "departement"; page: PageDepartement };

export const Route = createFileRoute("/$categorie/$ville")({
  // Le second segment peut être une ville ou un département : on tranche ici,
  // ce qui évite deux routes concurrentes sur le même motif d'URL.
  loader: async ({ params }): Promise<Donnees> => {
    if (departementParSlug(params.ville)) {
      const page = (await pageDepartementFn({
        data: { categorie: params.categorie, departement: params.ville },
      })) as PageDepartement | null;
      if (page) return { genre: "departement", page };
    }
    const page = (await pageLocaleFn({
      data: { categorie: params.categorie, ville: params.ville, page: 1 },
    })) as PageLocale | null;
    if (!page) throw notFound();
    return { genre: "ville", page };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return { meta: [{ name: "robots", content: "noindex" }] };
    return loaderData.genre === "departement"
      ? headPageDepartement(loaderData.page)
      : headPageLocale(loaderData.page);
  },
  component: PageAnnuaireLocale,
});

function PageAnnuaireLocale() {
  const donnees = Route.useLoaderData() as Donnees;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      {donnees.genre === "departement" ? (
        <VuePageDepartement page={donnees.page} />
      ) : (
        <VuePageLocale page={donnees.page} />
      )}
      <PiedPublic />
    </div>
  );
}
