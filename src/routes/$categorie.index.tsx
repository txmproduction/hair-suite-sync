import { createFileRoute, notFound } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { VuePageMetier } from "@/components/annuaire/PageAnnuaire";
import { pageMetierFn } from "@/lib/annuaire-seo.functions";
import { headPageMetier } from "@/lib/seo-annuaire";
import type { PageMetier } from "@/lib/annuaire-seo-types";

export const Route = createFileRoute("/$categorie/")({
  loader: async ({ params }): Promise<PageMetier> => {
    const page = (await pageMetierFn({
      data: { categorie: params.categorie },
    })) as PageMetier | null;
    if (!page) throw notFound();
    return page;
  },
  head: ({ loaderData }) =>
    loaderData ? headPageMetier(loaderData) : { meta: [{ name: "robots", content: "noindex" }] },
  component: PageMetierNationale,
});

function PageMetierNationale() {
  const page = Route.useLoaderData() as PageMetier;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <VuePageMetier page={page} />
      <PiedPublic />
    </div>
  );
}
