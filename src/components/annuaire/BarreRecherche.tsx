import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { lieuxFn } from "@/lib/annuaire.functions";
import { CATALOGUE_PRESTATIONS } from "@/lib/catalogue-prestations";

/** Normalise pour comparer sans accents ni casse. */
const sansAccents = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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

  // Types de prestations proposés (catalogue métier, indépendant de ce qui est déjà en base).
  const propositionsQ = useMemo(() => {
    const terme = sansAccents(q.trim());
    if (!terme) return CATALOGUE_PRESTATIONS.slice(0, 8);
    const commence = CATALOGUE_PRESTATIONS.filter((p) => sansAccents(p.nom).startsWith(terme));
    const contient = CATALOGUE_PRESTATIONS.filter(
      (p) => !sansAccents(p.nom).startsWith(terme) && sansAccents(p.nom).includes(terme),
    );
    return [...commence, ...contient].slice(0, 8);
  }, [q]);

  // Lieux : villes et codes postaux (France, Martinique, Suisse), interrogés à la frappe.
  const [villeDebouncee, setVilleDebouncee] = useState(villeInitiale);
  useEffect(() => {
    const t = setTimeout(() => setVilleDebouncee(ville), 250);
    return () => clearTimeout(t);
  }, [ville]);

  const { data: lieux = [] } = useQuery({
    queryKey: ["lieux", villeDebouncee],
    queryFn: () => lieuxFn({ data: { q: villeDebouncee } }),
    enabled: villeDebouncee.trim().length >= 2,
    staleTime: 10 * 60 * 1000,
  });

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
            {propositionsQ.map((p) => (
              <li key={p.nom}>
                <button
                  type="button"
                  onClick={() => {
                    setQ(p.nom);
                    setListeQ(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="truncate">{p.nom}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{p.metier}</span>
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
            {lieux.map((l) => (
              <li key={`${l.pays}-${l.codePostal}-${l.ville}`}>
                <button
                  type="button"
                  onClick={() => {
                    setVille(l.ville);
                    setListeVille(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                >
                  <span className="truncate">
                    <span className="font-medium">{l.codePostal}</span> {l.ville}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {l.pays === "CH" ? `${l.region}, Suisse` : l.region}
                  </span>
                </button>
              </li>
            ))}
            {villeDebouncee.trim().length >= 2 && lieux.length === 0 && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Aucun lieu trouvé.</li>
            )}
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
