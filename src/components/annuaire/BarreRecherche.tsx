import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { suggestionsFn } from "@/lib/annuaire.functions";

/** Normalise pour comparer sans accents ni casse. */
const sansAccents = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type Suggestion = { texte: string; type: "prestation" | "salon" };

export function BarreRecherche({
  villes,
  qInitial = "",
  villeInitiale = "",
  categorie,
  compact,
}: {
  villes: string[];
  qInitial?: string | undefined;
  villeInitiale?: string | undefined;
  categorie?: string | undefined;
  compact?: boolean | undefined;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(qInitial);
  const [ville, setVille] = useState(villeInitiale);
  const [listeQ, setListeQ] = useState(false);
  const [listeVille, setListeVille] = useState(false);
  const [localisation, setLocalisation] = useState<"inactif" | "chargement" | "refuse">("inactif");
  const conteneurRef = useRef<HTMLFormElement>(null);

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions-recherche"],
    queryFn: () => suggestionsFn(),
    staleTime: 5 * 60 * 1000,
  });

  // Les villes proposées viennent des salons réellement référencés.
  const villesDisponibles = suggestions?.villes?.length ? suggestions.villes : villes;

  const propositionsQ = useMemo<Suggestion[]>(() => {
    if (!suggestions) return [];
    const terme = sansAccents(q.trim());
    const tout: Suggestion[] = [
      ...suggestions.prestations.map((t) => ({ texte: t, type: "prestation" as const })),
      ...suggestions.salons.map((t) => ({ texte: t, type: "salon" as const })),
    ];
    if (!terme) return tout.slice(0, 8);
    return tout.filter((s) => sansAccents(s.texte).includes(terme)).slice(0, 8);
  }, [suggestions, q]);

  const propositionsVille = useMemo(() => {
    const terme = sansAccents(ville.trim());
    if (!terme) return villesDisponibles.slice(0, 8);
    return villesDisponibles.filter((v) => sansAccents(v).includes(terme)).slice(0, 8);
  }, [villesDisponibles, ville]);

  // Fermeture des listes au clic à l'extérieur.
  useEffect(() => {
    const surClic = (e: MouseEvent) => {
      if (!conteneurRef.current?.contains(e.target as Node)) {
        setListeQ(false);
        setListeVille(false);
      }
    };
    document.addEventListener("mousedown", surClic);
    return () => document.removeEventListener("mousedown", surClic);
  }, []);

  const autourDeMoi = () => {
    if (!navigator.geolocation) {
      setLocalisation("refuse");
      return;
    }
    setLocalisation("chargement");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocalisation("inactif");
        setVille("");
        navigate({
          to: "/recherche",
          search: {
            ...(categorie ? { categorie } : {}),
            ...(q.trim() ? { q: q.trim() } : {}),
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          },
        });
      },
      () => setLocalisation("refuse"),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  };

  return (
    <form
      ref={conteneurRef}
      onSubmit={(e) => {
        e.preventDefault();
        setListeQ(false);
        setListeVille(false);
        navigate({
          to: "/recherche",
          search: {
            ...(categorie ? { categorie } : {}),
            ...(q.trim() ? { q: q.trim() } : {}),
            ...(ville.trim() ? { ville: ville.trim() } : {}),
          },
        });
      }}
      className={`card-soft flex flex-col gap-2 p-3 sm:flex-row sm:items-center ${
        compact ? "" : "sm:p-4"
      }`}
    >
      {/* Que cherchez-vous : uniquement des prestations et salons présents sur HairTrack */}
      <div className="relative flex-1">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setListeQ(true);
            }}
            onFocus={() => setListeQ(true)}
            placeholder="Nom du salon, prestations (coupe...)"
            aria-label="Que cherchez-vous ?"
            autoComplete="off"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {listeQ && propositionsQ.length > 0 && (
          <ul className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg">
            {propositionsQ.map((s) => (
              <li key={`${s.type}-${s.texte}`}>
                <button
                  type="button"
                  onClick={() => {
                    setQ(s.texte);
                    setListeQ(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="truncate">{s.texte}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.type === "salon" ? "Salon" : "Prestation"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Où : villes des salons référencés + recherche autour de moi */}
      <div className="relative flex-1">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
          <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={ville}
            onChange={(e) => {
              setVille(e.target.value);
              setListeVille(true);
            }}
            onFocus={() => setListeVille(true)}
            placeholder="Adresse, ville..."
            aria-label="Où ?"
            autoComplete="off"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={autourDeMoi}
            aria-label="Rechercher autour de moi"
            title="Autour de moi"
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            {localisation === "chargement" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            )}
          </button>
        </div>
        {listeVille && (
          <ul className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-border bg-card py-1 shadow-lg">
            <li>
              <button
                type="button"
                onClick={() => {
                  setListeVille(false);
                  autourDeMoi();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-secondary"
              >
                <LocateFixed className="h-4 w-4 text-gold" />
                Autour de moi
              </button>
            </li>
            {propositionsVille.map((v) => (
              <li key={v}>
                <button
                  type="button"
                  onClick={() => {
                    setVille(v);
                    setListeVille(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  {v}
                </button>
              </li>
            ))}
          </ul>
        )}
        {localisation === "refuse" && (
          <p className="absolute mt-1 text-xs text-muted-foreground">
            Position indisponible. Saisissez une ville.
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="sm:w-auto">
        Rechercher
      </Button>
    </form>
  );
}
