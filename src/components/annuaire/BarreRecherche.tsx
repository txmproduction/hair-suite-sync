import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BarreRecherche({
  villes,
  qInitial = "",
  villeInitiale = "",
  categorie,
  compact,
}: {
  villes: string[];
  qInitial?: string;
  villeInitiale?: string;
  categorie?: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [q, setQ] = useState(qInitial);
  const [ville, setVille] = useState(villeInitiale);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
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
      <div className="flex flex-1 items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom du salon, prestations (coupe...)"
          aria-label="Que cherchez-vous ?"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div className="flex flex-1 items-center gap-2 rounded-lg bg-secondary px-3 py-2.5">
        <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={ville}
          onChange={(e) => setVille(e.target.value)}
          list="villes-hairtrack"
          placeholder="Adresse, ville..."
          aria-label="Où ?"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <datalist id="villes-hairtrack">
          {villes.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      </div>
      <Button type="submit" size="lg" className="sm:w-auto">
        Rechercher
      </Button>
    </form>
  );
}
