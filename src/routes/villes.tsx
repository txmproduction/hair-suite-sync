import { createFileRoute, Link } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { FilAriane } from "@/components/annuaire/FilAriane";
import { indexVillesFn } from "@/lib/annuaire-seo.functions";
import { absolu, metaOg } from "@/lib/seo";
import { parSlugCategorie } from "@/lib/categories";
import type { IndexVilles } from "@/lib/annuaire-seo-types";

export const Route = createFileRoute("/villes")({
  loader: async (): Promise<IndexVilles> => (await indexVillesFn()) as IndexVilles,
  head: ({ loaderData }) => {
    const total = loaderData?.total ?? 0;
    const titre = "Toutes les villes couvertes par HairTrack";
    const description = `HairTrack référence des professionnels de la beauté et du bien-être dans ${total} ville${total > 1 ? "s" : ""}, classées par département : trouvez la vôtre et réservez en ligne.`;
    const url = absolu("/villes");
    return {
      meta: [...metaOg({ titre, description, url }), { name: "robots", content: "index, follow" }],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: PageIndexVilles,
});

function PageIndexVilles() {
  const index = Route.useLoaderData() as IndexVilles;
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <FilAriane items={[{ label: "Accueil", href: "/" }, { label: "Villes" }]} />
        <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">Toutes les villes couvertes</h1>
        <p className="mt-2 max-w-3xl text-muted-foreground">
          {index.total} ville{index.total > 1 ? "s" : ""} référencée{index.total > 1 ? "s" : ""} sur
          HairTrack, classées par département.
        </p>

        <div className="mt-10 space-y-10">
          {index.groupes.map((g) => (
            <section key={g.departement.slug}>
              <h2 className="text-lg font-semibold">
                {g.departement.nom} <span className="text-sm text-muted-foreground">({g.departement.code})</span>
              </h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {g.villes.map((v) => {
                  const premier = parSlugCategorie(v.metiers[0] ?? "");
                  return (
                    <li key={v.slug} className="text-sm">
                      {premier ? (
                        <Link
                          to={`/${premier.slug}/${v.slug}`}
                          className="text-muted-foreground hover:text-foreground hover:underline"
                        >
                          {v.nom} <span className="text-xs">({v.nb})</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{v.nom}</span>
                      )}
                      {v.metiers.length > 1 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {v.metiers.slice(1, 4).map((m) => {
                            const info = parSlugCategorie(m);
                            if (!info) return null;
                            return (
                              <Link
                                key={m}
                                to={`/${info.slug}/${v.slug}`}
                                className="mr-2 hover:text-foreground hover:underline"
                              >
                                {info.label}
                              </Link>
                            );
                          })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <PiedPublic />
    </div>
  );
}
