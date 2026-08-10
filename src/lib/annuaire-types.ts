import type { CategorieSalon } from "@/lib/categories";

export type SalonCarte = {
  id: string;
  slug: string;
  nom: string;
  ville: string | null;
  code_postal: string | null;
  categorie: CategorieSalon;
  description: string | null;
  photo_couverture_url: string | null;
  note_moyenne: number | null;
  nb_avis: number;
  note_google: number | null;
  nb_avis_google: number | null;
  statut: "reclame" | "non_reclame";
  prix_min: number | null;
};

export type FicheSalon = {
  salon: SalonCarte & {
    adresse: string | null;
    telephone: string | null;
    lien_externe: string | null;
  };
  photos: { id: string; url: string }[];
  categories: { id: string; nom: string }[];
  prestations: {
    id: string;
    nom: string;
    duree_min: number;
    prix: number;
    categorie_id: string | null;
  }[];
  horaires: { jour: number; ferme: boolean; ouverture: string; fermeture: string }[];
  avis: {
    id: string;
    note: number;
    commentaire: string | null;
    client_nom: string | null;
    created_at: string;
  }[];
};

export type ContexteAvis = {
  salon: string;
  prestation: string | null;
  debut: string;
  deja_donne: boolean;
};
