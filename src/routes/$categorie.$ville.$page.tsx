import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { VuePageLocale } from "@/components/annuaire/PageAnnuaire";
import { pageLocaleFn } from "@/lib/annuaire-seo.functions";
import { headPageLocale } from "@/lib/seo-annuaire";
import type { PageLocale } from "@/lib/annuaire-seo-types";

export const Route = createFileRoute("/$categorie/$ville/$page")({
  // URL propre : /coiffeur/lyon/page-2 (tout autre troisième segment est un 404).
  loader: async ({ params }): Promise<PageLocale> => {
    const correspondance = /^page-(\d{1,3})$/.exec(params.page);
    if (!correspondance) throw notFound();
    const numero = Number(correspondance[1]);
    if (numero < 2) throw notFound();
    const page = (await pageLocaleFn({
      data: { categorie: params.categorie, ville: params.ville, page: numero },
    })) as PageLocale | null;
    if (!page || page.page !== numero) throw notFound();
    return page;
  },
  head: ({ loaderData }) =>
    loaderData ? headPageLocale(loaderData) : { meta: [{ name: "robots", content: "noindex" }] },
  component: PageLocalePaginee,
});

function PageLocalePaginee() {
  const page = Route.useLoaderData() as PageLocale;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <VuePageLocale page={page} />
      <PiedPublic />
    </div>
  );
}
