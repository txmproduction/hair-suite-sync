export type SalonPublicData = {
  salon: {
    id: string;
    nom: string;
    adresse: string | null;
    telephone: string | null;
    slug: string;
  };
  categories: { id: string; nom: string; ordre: number }[];
  prestations: {
    id: string;
    nom: string;
    duree_min: number;
    prix: number;
    couleur: string;
    categorie_id: string | null;
  }[];
  employes: { id: string; nom: string; photo_url: string | null; couleur: string }[];
  acompte: { type: "montant" | "pourcentage"; valeur: number; delai_annulation_h: number };
};

export type JourCreneauxData = {
  date: string;
  creneaux: { debut: string; employe_id: string }[];
};

export type RecapReservationData = {
  statut: string;
  debut: string;
  duree_min: number;
  acompte: number;
  prestation: string | null;
  prix: number;
  employe: string | null;
  salon: { nom: string; adresse: string | null; telephone: string | null; slug: string | null };
  annulation_possible: boolean;
  delai_annulation_h: number;
};
