import { createFileRoute } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { FilAriane } from "@/components/annuaire/FilAriane";
import { LienSeo } from "@/components/annuaire/LienSeo";
import { indexMetiersFn } from "@/lib/annuaire-seo.functions";
import { absolu, metaOg } from "@/lib/seo";
import type { IndexMetiers } from "@/lib/annuaire-seo-types";

export const Route = createFileRoute("/metiers")({
  loader: async (): Promise<IndexMetiers> => (await indexMetiersFn()) as IndexMetiers,
  head: ({ loaderData }) => {
    const nb = loaderData?.metiers.length ?? 0;
    const titre = "Tous les métiers beauté et bien-être | HairTrack";
    const description = `Coiffeur, barbier, manucure, institut de beauté, massage, sophrologue, naturopathe… ${nb} métier${nb > 1 ? "s" : ""} référencé${nb > 1 ? "s" : ""} sur HairTrack, ville par ville.`;
    const url = absolu("/metiers");
    return {
      meta: [...metaOg({ titre, description, url }), { name: "robots", content: "index, follow" }],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PageIndexMetiers,
});

function PageIndexMetiers() {
  const index = Route.useLoaderData() as IndexMetiers;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <FilAriane items={[{ label: "Accueil", href: "/" }, { label: "Métiers" }]} />
        <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
          Tous les métiers référencés sur HairTrack
        </h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          Beauté, coiffure et bien-être : choisissez un métier, puis votre ville.
        </p>

        <div className="mt-10 space-y-10">
          {index.metiers.map((m) => (
            <section key={m.slug}>
              <h2 className="text-lg font-semibold">
                <LienSeo href={`/${m.slug}`} className="hover:underline">
                  {m.label}
                </LienSeo>{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {m.nb} professionnel{m.nb > 1 ? "s" : ""}
                </span>
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {m.villes.map((v) => (
                  <li key={v.slug}>
                    <LienSeo
                      href={`/${m.slug}/${v.slug}`}
                      className="text-sm text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {m.label} à {v.nom} <span className="text-xs">({v.nb})</span>
                    </LienSeo>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <PiedPublic />
    </div>
  );
}
