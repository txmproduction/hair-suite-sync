import { LienSeo } from "@/components/annuaire/LienSeo";
import { CarteSalon } from "@/components/annuaire/CarteSalon";
import { FilAriane } from "@/components/annuaire/FilAriane";
import { contenuPageLocale } from "@/lib/contenu-seo";
import type { PageDepartement, PageLocale, PageMetier } from "@/lib/annuaire-seo-types";

function ListeLiens({
  titre,
  liens,
}: {
  titre: string;
  liens: { href: string; label: string; note?: string | undefined }[];
}) {
  if (!liens.length) return null;
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold">{titre}</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {liens.map((l) => (
          <li key={l.href}>
            <LienSeo href={l.href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              {l.label}
              {l.note ? <span className="text-xs"> ({l.note})</span> : null}
            </LienSeo>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VuePageLocale({ page }: { page: PageLocale }) {
  const { paragraphes, faq } = contenuPageLocale(page);
  const base = `/${page.slugCategorie}/${page.villeSlug}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <FilAriane
        items={[
          { label: "Accueil", href: "/" },
          { label: page.label, href: `/${page.slugCategorie}` },
          ...(page.departement
            ? [
                {
                  label: page.departement.nom,
                  href: `/${page.slugCategorie}/${page.departement.slug}`,
                },
              ]
            : []),
          { label: page.ville },
        ]}
      />

      <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
        {page.label} à {page.ville}
        {page.page > 1 ? ` — page ${page.page}` : ""}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {page.total} {page.total > 1 ? page.plurielNom : page.label.toLowerCase()} à {page.ville}
        {page.departement ? ` (${page.departement.nom})` : ""} — avis clients, tarifs affichés et
        réservation en ligne immédiate.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {page.salons.map((s) => (
          <CarteSalon key={s.id} salon={s} />
        ))}
      </div>

      {page.nbPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          {Array.from({ length: page.nbPages }, (_, i) => i + 1).map((n) => (
            <LienSeo
              key={n}
              href={n === 1 ? base : `${base}/page-${n}`}
              className={
                n === page.page
                  ? "rounded-md bg-foreground px-3 py-1.5 font-medium text-background"
                  : "rounded-md border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground"
              }
            >
              {n}
            </LienSeo>
          ))}
        </nav>
      )}

      <section className="prose-hairtrack mt-12 max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold">
          {page.label} à {page.ville} : ce qu'il faut savoir
        </h2>
        {paragraphes.map((p, i) => (
          <p key={i} className="text-sm leading-relaxed text-muted-foreground">
            {p}
          </p>
        ))}
      </section>

      {faq.length > 0 && (
        <section className="mt-12 max-w-3xl">
          <h2 className="text-xl font-semibold">Questions fréquentes</h2>
          <dl className="mt-4 space-y-5">
            {faq.map((q) => (
              <div key={q.question}>
                <dt className="font-medium">{q.question}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-muted-foreground">{q.reponse}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <ListeLiens
        titre={`${page.label} dans les villes à proximité de ${page.ville}`}
        liens={page.villesProches.map((v) => ({
          href: `/${page.slugCategorie}/${v.slug}`,
          label: `${page.label} à ${v.nom}`,
          note: `${v.nb}`,
        }))}
      />

      <ListeLiens
        titre={`Autres prestations à ${page.ville}`}
        liens={page.autresMetiers.map((m) => ({
          href: `/${m.slug}/${page.villeSlug}`,
          label: `${m.label} à ${page.ville}`,
          note: `${m.nb}`,
        }))}
      />

      <ListeLiens
        titre="Élargir la recherche"
        liens={[
          { href: `/${page.slugCategorie}`, label: `Tous les ${page.plurielNom} en France` },
          ...(page.departement
            ? [
                {
                  href: `/${page.slugCategorie}/${page.departement.slug}`,
                  label: `${page.label} en ${page.departement.nom}`,
                },
              ]
            : []),
          { href: "/villes", label: "Toutes les villes couvertes" },
          { href: "/metiers", label: "Tous les métiers référencés" },
        ]}
      />
    </main>
  );
}

export function VuePageMetier({ page }: { page: PageMetier }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <FilAriane items={[{ label: "Accueil", href: "/" }, { label: page.label }]} />
      <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
        {page.label} : trouver et réserver en ligne
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {page.total} {page.plurielNom} référencés sur HairTrack dans {page.villes.length} ville
        {page.villes.length > 1 ? "s" : ""} et {page.departements.length} département
        {page.departements.length > 1 ? "s" : ""}. Tarifs affichés, avis clients et réservation
        immédiate.
      </p>

      {page.salons.length > 0 && (
        <>
          <h2 className="mt-10 text-lg font-semibold">Les mieux notés</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {page.salons.map((s) => (
              <CarteSalon key={s.id} salon={s} />
            ))}
          </div>
        </>
      )}

      <ListeLiens
        titre={`${page.label} par ville`}
        liens={page.villes.slice(0, 60).map((v) => ({
          href: `/${page.slugCategorie}/${v.slug}`,
          label: `${page.label} à ${v.nom}`,
          note: `${v.nb}`,
        }))}
      />

      <ListeLiens
        titre={`${page.label} par département`}
        liens={page.departements.map((d) => ({
          href: `/${page.slugCategorie}/${d.departement.slug}`,
          label: `${page.label} en ${d.departement.nom}`,
          note: `${d.nb}`,
        }))}
      />
    </main>
  );
}

export function VuePageDepartement({ page }: { page: PageDepartement }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <FilAriane
        items={[
          { label: "Accueil", href: "/" },
          { label: page.label, href: `/${page.slugCategorie}` },
          { label: page.departement.nom },
        ]}
      />
      <h1 className="mt-4 text-2xl font-semibold sm:text-3xl">
        {page.label} en {page.departement.nom}
      </h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        {page.total} {page.total > 1 ? page.plurielNom : page.label.toLowerCase()} référencé
        {page.total > 1 ? "s" : ""} en {page.departement.nom}, répartis dans {page.villes.length}{" "}
        ville{page.villes.length > 1 ? "s" : ""}.
        {page.stats.prixMin !== null && page.stats.prixMax !== null
          ? ` Tarifs constatés de ${Math.round(page.stats.prixMin)} € à ${Math.round(page.stats.prixMax)} €.`
          : ""}
      </p>

      {page.salons.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {page.salons.map((s) => (
            <CarteSalon key={s.id} salon={s} />
          ))}
        </div>
      )}

      <ListeLiens
        titre={`${page.label} par ville en ${page.departement.nom}`}
        liens={page.villes.map((v) => ({
          href: `/${page.slugCategorie}/${v.slug}`,
          label: `${page.label} à ${v.nom}`,
          note: `${v.nb}`,
        }))}
      />

      <ListeLiens
        titre="Élargir la recherche"
        liens={[
          { href: `/${page.slugCategorie}`, label: `Tous les ${page.plurielNom} en France` },
          { href: "/villes", label: "Toutes les villes couvertes" },
          { href: "/metiers", label: "Tous les métiers référencés" },
        ]}
      />
    </main>
  );
}
