import type { SalonCarte } from "@/lib/annuaire-types";

export type StatsLocales = {
  nbPros: number;
  prixMin: number | null;
  prixMax: number | null;
  prixMedian: number | null;
  noteMoyenne: number | null;
  nbAvis: number;
  prestations: string[];
  ouvertSamedi: number;
  ouvertDimanche: number;
  quartiers: string[];
};

export type RefDepartement = { code: string; nom: string; slug: string };

export type PageLocale = {
  categorie: string;
  slugCategorie: string;
  label: string;
  plurielNom: string;
  ville: string;
  villeSlug: string;
  departement: RefDepartement | null;
  salons: SalonCarte[];
  total: number;
  page: number;
  nbPages: number;
  stats: StatsLocales;
  villesProches: { nom: string; slug: string; nb: number }[];
  autresMetiers: { slug: string; label: string; nb: number }[];
  lastmod: string | null;
};

export type PageMetier = {
  categorie: string;
  slugCategorie: string;
  label: string;
  plurielNom: string;
  total: number;
  villes: { nom: string; slug: string; nb: number; departement: RefDepartement | null }[];
  departements: { departement: RefDepartement; nb: number }[];
  salons: SalonCarte[];
};

export type PageDepartement = {
  categorie: string;
  slugCategorie: string;
  label: string;
  plurielNom: string;
  departement: RefDepartement;
  total: number;
  villes: { nom: string; slug: string; nb: number }[];
  salons: SalonCarte[];
  stats: StatsLocales;
};

export type IndexVilles = {
  total: number;
  groupes: {
    departement: RefDepartement;
    villes: { nom: string; slug: string; nb: number; metiers: string[] }[];
  }[];
};

export type IndexMetiers = {
  metiers: {
    slug: string;
    label: string;
    plurielNom: string;
    nb: number;
    villes: { nom: string; slug: string; nb: number }[];
  }[];
};
