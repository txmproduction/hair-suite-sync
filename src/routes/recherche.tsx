import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { BarreRecherche } from "@/components/annuaire/BarreRecherche";
import { CarteSalon } from "@/components/annuaire/CarteSalon";
import { rechercheFn, villesFn } from "@/lib/annuaire.functions";
import { CATEGORIES, parCategorie } from "@/lib/categories";
import { Button } from "@/components/ui/button";

type RechercheSearch = {
  categorie?: string | undefined;
  q?: string | undefined;
  ville?: string | undefined;
  note?: number | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
};

export const Route = createFileRoute("/recherche")({
  validateSearch: (search: Record<string, unknown>): RechercheSearch => ({
    categorie: search["categorie"] ? String(search["categorie"]) : undefined,
    q: search["q"] ? String(search["q"]) : undefined,
    ville: search["ville"] ? String(search["ville"]) : undefined,
    note: search["note"] ? Number(search["note"]) : undefined,
    lat: search["lat"] !== undefined ? Number(search["lat"]) : undefined,
    lng: search["lng"] !== undefined ? Number(search["lng"]) : undefined,
  }),
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, follow" },
      { title: "Rechercher un salon de coiffure ou de beauté — HairTrack" },
      {
        name: "description",
        content:
          "Trouvez un coiffeur, un barbier, une manucure, un institut de beauté ou un praticien bien-être près de chez vous et réservez en ligne en quelques secondes.",
      },
      { property: "og:title", content: "Rechercher un salon — HairTrack" },
      {
        property: "og:description",
        content: "Comparez les salons, les avis et les prix, puis réservez en ligne.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: "https://hairtrack.fr/recherche" },
    ],
    links: [{ rel: "canonical", href: "https://hairtrack.fr/recherche" }],
    // Page de filtres (résultats combinatoires) : suivie mais non indexée,
    // les pages métier/ville portent le référencement.
  }),
  component: PageRecherche,
});

export function ResultatsSalons({
  categorie,
  q,
  ville,
  note,
  lat,
  lng,
  titre,
  sousTitre,
}: {
  categorie?: string | undefined;
  q?: string | undefined;
  ville?: string | undefined;
  note?: number | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
  titre: string;
  sousTitre?: string | undefined;
}) {
  const [noteMin, setNoteMin] = useState<number | undefined>(note);
  const [cat, setCat] = useState<string | undefined>(categorie);
  const [villeF, setVilleF] = useState<string | undefined>(ville);

  // Les filtres sont initialisés depuis l'URL au premier rendu seulement :
  // sans cette synchronisation, cliquer sur une catégorie du menu du haut
  // change le titre mais laisse l'ancienne puce sélectionnée en dessous.
  useEffect(() => setCat(categorie), [categorie]);
  useEffect(() => setVilleF(ville), [ville]);
  useEffect(() => setNoteMin(note), [note]);

  // Et inversement : cliquer une puce mets l'URL à jour, pour que le titre de
  // la page suive le filtre choisi au lieu de rester sur l'ancien.
  const navigate = useNavigate();
  const appliquer = (modif: {
    categorie?: string | undefined;
    note?: number | undefined;
    ville?: string | undefined;
  }) => {
    const suivant = {
      categorie: "categorie" in modif ? modif.categorie : cat,
      q,
      ville: "ville" in modif ? modif.ville : villeF,
      note: "note" in modif ? modif.note : noteMin,
      lat,
      lng,
    };
    navigate({
      to: "/recherche",
      search: Object.fromEntries(
        Object.entries(suivant).filter(([, v]) => v !== undefined && v !== null && v !== ""),
      ),
    });
  };

  const { data: villes = [] } = useQuery({
    queryKey: ["villes"],
    queryFn: () => villesFn(),
  });

  const { data: salons = [], isLoading } = useQuery({
    queryKey: ["recherche", cat, q, villeF, noteMin, lat, lng],
    queryFn: () =>
      rechercheFn({
        data: {
          categorie: cat ?? null,
          q: q ?? null,
          ville: villeF ?? null,
          noteMin: noteMin ?? null,
          lat: lat ?? null,
          lng: lng ?? null,
        },
      }),
  });

  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-semibold sm:text-3xl">{titre}</h1>
        {sousTitre && <p className="mt-2 max-w-2xl text-muted-foreground">{sousTitre}</p>}

        <div className="mt-6">
          <BarreRecherche villes={villes} qInitial={q ?? ""} villeInitiale={villeF ?? ""} categorie={cat} compact />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant={cat ? "outline" : "default"}
            size="sm"
            onClick={() => appliquer({ categorie: undefined })}
          >
            Toutes
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c.value}
              variant={cat === c.value ? "default" : "outline"}
              size="sm"
              onClick={() => appliquer({ categorie: c.value })}
            >
              {c.label}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          {[4, 4.5].map((n) => (
            <Button
              key={n}
              variant={noteMin === n ? "default" : "outline"}
              size="sm"
              onClick={() => appliquer({ note: noteMin === n ? undefined : n })}
            >
              {n}+ ★
            </Button>
          ))}
          {villeF && (
            <Button variant="outline" size="sm" onClick={() => appliquer({ ville: undefined })}>
              {villeF} ✕
            </Button>
          )}
        </div>

        {isLoading ? (
          <p className="mt-10 text-muted-foreground">Recherche en cours…</p>
        ) : salons.length === 0 ? (
          <div className="card-soft mt-8 p-8 text-center">
            <p className="font-medium">Aucun salon ne correspond à cette recherche.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Essayez une autre ville, élargissez la catégorie… ou parlez de HairTrack à votre
              salon préféré pour qu'il rejoigne l'aventure.
            </p>
            <Button asChild className="mt-5">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {salons.map((s) => (
              <CarteSalon key={s.id} salon={s} />
            ))}
          </div>
        )}
      </main>
      <PiedPublic />
    </div>
  );
}

function PageRecherche() {
  const search = Route.useSearch();
  const info = useMemo(() => parCategorie(search.categorie), [search.categorie]);

  const autour = typeof search.lat === "number" && typeof search.lng === "number";

  const titre = autour
    ? info
      ? `${info.plurielNom.charAt(0).toUpperCase()}${info.plurielNom.slice(1)} autour de vous`
      : "Les salons autour de vous"
    : info
      ? `Les meilleurs ${info.plurielNom} autour de chez vous`
      : search.ville
        ? `Salons beauté à ${search.ville}`
        : "Trouvez votre prochain rendez-vous beauté";

  return (
    <ResultatsSalons
      categorie={search.categorie}
      q={search.q}
      ville={search.ville}
      note={search.note}
      lat={search.lat}
      lng={search.lng}
      titre={titre}
      sousTitre={autour ? "Classés du plus proche au plus loin." : info?.accroche}
    />
  );
}
