import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MapPin, Phone, Clock, ExternalLink, CalendarOff, ChevronLeft, ChevronRight, X } from "lucide-react";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { Etoiles, NoteSalon } from "@/components/annuaire/Etoiles";
import { Button } from "@/components/ui/button";
import { ficheSalonFn, clicReservationManqueeFn } from "@/lib/annuaire.functions";
import { labelCategorie } from "@/lib/categories";
import { euro, JOURS } from "@/lib/hairtrack";
import { jsonLdSalon, jsonLdFilArianeSalon } from "@/lib/seo-salon";
import { FilAriane } from "@/components/annuaire/FilAriane";
import { normaliserSlug } from "@/lib/seo";
import { parCategorie } from "@/lib/categories";
import type { FicheSalon } from "@/lib/annuaire-types";


export const Route = createFileRoute("/salon/$slug")({
  loader: async ({ params }): Promise<FicheSalon> => {
    const fiche = (await ficheSalonFn({ data: { slug: params.slug } })) as FicheSalon | null;
    if (!fiche) throw notFound();
    return fiche;
  },
  head: ({ params, loaderData }) => {
    const nom = loaderData?.salon.nom ?? "Salon";
    const ville = loaderData?.salon.ville;
    const titre = `${nom}${ville ? ` — ${ville}` : ""} | Réservation en ligne`;
    const description =
      loaderData?.salon.description?.slice(0, 155) ??
      `Réservez votre rendez-vous chez ${nom}${ville ? ` à ${ville}` : ""} en ligne, 24h/24, en quelques secondes.`;
    const url = `https://hairtrack.fr/salon/${params.slug}`;
    const image = loaderData?.salon.photo_couverture_url;
    return {
      meta: [
        { title: titre },
        { name: "description", content: description },
        { property: "og:title", content: titre },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
        ...(image && image.startsWith("https://")
          ? [
              { property: "og:image", content: image },
              { name: "twitter:image", content: image },
            ]
          : []),
      ],
      links: [{ rel: "canonical", href: url }],
      ...(loaderData
        ? {
            scripts: [
              { type: "application/ld+json", children: JSON.stringify(jsonLdSalon(loaderData)) },
              {
                type: "application/ld+json",
                children: JSON.stringify(jsonLdFilArianeSalon(loaderData)),
              },
            ],
          }
        : {}),
    };
  },
  component: FicheSalonPage,
});

function BlocIndisponible({
  salonId,
  telephone,
  lienExterne,
}: {
  salonId: string;
  telephone: string | null;
  lienExterne: string | null;
}) {
  const [enregistre, setEnregistre] = useState(false);

  const signaler = () => {
    setEnregistre(true);
    clicReservationManqueeFn({ data: { salonId } }).catch(() => undefined);
  };

  return (
    <div className="w-full sm:w-auto">
      <Button
        type="button"
        size="lg"
        variant="secondary"
        onClick={signaler}
        className="w-full whitespace-normal text-left sm:w-auto"
      >
        <CalendarOff className="mr-2 h-4 w-4 shrink-0" />
        Réservation en ligne indisponible pour ce salon
      </Button>
      {enregistre && (
        <div className="mt-3 space-y-2">
          {telephone && (
            <a
              href={`tel:${telephone}`}
              className="flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4"
            >
              <Phone className="h-4 w-4" />
              Appeler le salon — {telephone}
            </a>
          )}
          {lienExterne && (
            <Button asChild variant="outline" size="sm">
              <a href={lienExterne} target="_blank" rel="nofollow noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Réserver via leur outil actuel
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function GalerieHero({
  photoCouverture,
  photos,
  nomSalon,
}: {
  photoCouverture: string | null;
  photos: { id: string; url: string }[];
  nomSalon: string;
}) {
  const urls = [
    ...(photoCouverture ? [photoCouverture] : []),
    ...photos.map((p) => p.url).filter((u) => u !== photoCouverture),
  ];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const total = urls.length;

  // Fermeture au clavier + blocage du défilement de la page pendant l'aperçu.
  useEffect(() => {
    if (!zoom) return;
    const surTouche = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      if (e.key === "ArrowRight" && total > 1) setIndex((i) => (i + 1) % total);
      if (e.key === "ArrowLeft" && total > 1) setIndex((i) => (i - 1 + total) % total);
    };
    document.addEventListener("keydown", surTouche);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", surTouche);
      document.body.style.overflow = overflow;
    };
  }, [zoom, total]);

  if (total === 0) {
    return (
      <div className="relative h-56 w-full overflow-hidden bg-secondary sm:h-72">
        <div className="flex h-full items-center justify-center text-5xl">✂️</div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
      </div>
    );
  }

  return (
    <div className="relative h-56 w-full overflow-hidden bg-secondary sm:h-72">
      <button
        type="button"
        onClick={() => setZoom(true)}
        aria-label="Afficher la photo en grand"
        className="block h-full w-full cursor-zoom-in"
      >
        <img
          src={urls[index]}
          alt={`Photo ${index + 1} du salon ${nomSalon}`}
          className="h-full w-full object-cover"
        />
      </button>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 to-black/50" />
      {total > 1 && (
        <>
          <button
            type="button"
            aria-label="Photo précédente"
            onClick={() => setIndex((i) => (i - 1 + total) % total)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Photo suivante"
            onClick={() => setIndex((i) => (i + 1) % total)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {urls.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Aller à la photo ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-5 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-xs text-white">
            {index + 1} / {total}
          </span>
        </>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`Photo du salon ${nomSalon}`}
        >
          <button
            type="button"
            onClick={() => setZoom(false)}
            aria-label="Fermer"
            className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white hover:bg-white/25"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={urls[index]}
            alt={`Photo ${index + 1} du salon ${nomSalon}`}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full cursor-default object-contain"
          />
          {total > 1 && (
            <>
              <button
                type="button"
                aria-label="Photo précédente"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i - 1 + total) % total);
                }}
                className="absolute left-4 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Photo suivante"
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex((i) => (i + 1) % total);
                }}
                className="absolute right-4 rounded-full bg-white/15 p-3 text-white hover:bg-white/25"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <span className="absolute bottom-5 rounded-full bg-white/15 px-3 py-1 text-sm text-white">
                {index + 1} / {total}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function FicheSalonPage() {
  const fiche = Route.useLoaderData() as FicheSalon;
  const { salon, photos, categories, prestations, horaires, avis } = fiche;
  const nonReclame = salon.statut === "non_reclame";

  const groupes = [
    ...categories.map((c) => ({
      nom: c.nom,
      items: prestations.filter((p) => p.categorie_id === c.id),
    })),
    { nom: "Autres prestations", items: prestations.filter((p) => !p.categorie_id) },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />

      <GalerieHero photoCouverture={salon.photo_couverture_url} photos={photos} nomSalon={salon.nom} />

      <main className="mx-auto max-w-6xl px-4 pb-16">

        <div className="card-soft -mt-12 relative p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="rounded-full bg-gold-soft px-2.5 py-1 text-xs font-medium text-gold-foreground">
                {labelCategorie(salon.categorie)}
              </span>
              <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">{salon.nom}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {salon.adresse && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {salon.adresse}
                    {salon.ville ? ` — ${salon.ville}` : ""}
                  </span>
                )}
                {salon.telephone && (
                  <a href={`tel:${salon.telephone}`} className="flex items-center gap-1 hover:text-foreground">
                    <Phone className="h-4 w-4" />
                    {salon.telephone}
                  </a>
                )}
              </div>
              <div className="mt-3">
                <NoteSalon
                  note={salon.note_moyenne}
                  nbAvis={salon.nb_avis}
                  noteGoogle={salon.note_google}
                  nbAvisGoogle={salon.nb_avis_google}
                />
              </div>
            </div>
            {nonReclame ? (
              <BlocIndisponible
                salonId={salon.id}
                telephone={salon.telephone}
                lienExterne={salon.lien_externe}
              />
            ) : (
              <Button asChild size="lg">
                <Link to="/reserver/$slug" params={{ slug: salon.slug }}>
                  Réserver
                </Link>
              </Button>
            )}
          </div>
        </div>

        {nonReclame && (
          <p className="mt-3 text-xs text-muted-foreground">
            Fiche non gérée par cet établissement.{" "}
            <Link
              to="/auth"
              search={{ reprise: salon.slug }}
              className="font-medium text-gold underline underline-offset-4"
            >
              Vous êtes ce salon ? Reprenez votre fiche gratuitement
            </Link>
          </p>
        )}

        {salon.description && (
          <section className="card-soft mt-5 p-5 sm:p-6">
            <h2 className="text-lg font-semibold">Le salon</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {salon.description}
            </p>
          </section>
        )}

        {photos.length > 3 && (
          <section className="mt-5">
            <h2 className="text-lg font-semibold">Toutes les photos</h2>
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {photos.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt={`Photo du salon ${salon.nom}`}
                  loading="lazy"
                  className="aspect-square w-full rounded-xl object-cover"
                />
              ))}
            </div>
          </section>
        )}

        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <section className="card-soft p-5 sm:p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">Prestations</h2>
            {groupes.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Les prestations seront bientôt publiées.
              </p>
            ) : (
              <div className="mt-4 space-y-6">
                {groupes.map((g) => (
                  <div key={g.nom}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {g.nom}
                    </h3>
                    <ul className="mt-2 divide-y divide-border">
                      {g.items.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-4 py-2.5">
                          <span className="text-sm">
                            {p.nom}
                            <span className="ml-2 text-muted-foreground">{p.duree_min} min</span>
                          </span>
                          <span className="text-sm font-medium">{euro(p.prix)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {!nonReclame && (
              <Button asChild className="mt-6">
                <Link to="/reserver/$slug" params={{ slug: salon.slug }}>
                  Choisir un créneau
                </Link>
              </Button>
            )}
          </section>

          <section className="card-soft h-fit p-5 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="h-4 w-4 text-gold" />
              Horaires
            </h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {JOURS.map((j, i) => {
                const h = horaires.find((x) => x.jour === i);
                return (
                  <li key={j} className="flex justify-between">
                    <span className="text-muted-foreground">{j}</span>
                    <span>
                      {!h || h.ferme
                        ? "Fermé"
                        : `${h.ouverture.slice(0, 5)} – ${h.fermeture.slice(0, 5)}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="text-lg font-semibold">Avis clients</h2>
          {avis.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Pas encore d'avis publié — soyez le premier à partager votre expérience.
            </p>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {avis.map((a) => (
                <article key={a.id} className="card-soft p-4">
                  <div className="flex items-center justify-between">
                    <Etoiles note={a.note} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {a.commentaire && <p className="mt-2 text-sm">{a.commentaire}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">{a.client_nom ?? "Client"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
        <SectionMaillage salon={salon} />
      </main>

      <PiedPublic />
    </div>
  );
}
