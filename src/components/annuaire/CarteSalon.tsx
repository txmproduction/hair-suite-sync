import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import { labelCategorie } from "@/lib/categories";
import { euro } from "@/lib/hairtrack";
import { NoteSalon } from "./Etoiles";
import type { SalonCarte } from "@/lib/annuaire-types";

export function CarteSalon({ salon }: { salon: SalonCarte }) {
  return (
    <Link
      to="/salon/$slug"
      params={{ slug: salon.slug }}
      className="card-soft group block overflow-hidden transition-shadow hover:shadow-lg"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-secondary">
        {salon.photo_couverture_url ? (
          <img
            src={salon.photo_couverture_url}
            alt={`Salon ${salon.nom}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">✂️</div>
        )}
      </div>
      <div className="space-y-1.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight">{salon.nom}</h3>
          <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold-foreground">
            {labelCategorie(salon.categorie)}
          </span>
        </div>
        {salon.ville && (
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {salon.ville}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <NoteSalon
            note={salon.note_moyenne}
            nbAvis={salon.nb_avis}
            noteGoogle={salon.note_google}
            nbAvisGoogle={salon.nb_avis_google}
          />
          {salon.prix_min !== null && (
            <span className="text-sm font-medium">à partir de {euro(salon.prix_min)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
