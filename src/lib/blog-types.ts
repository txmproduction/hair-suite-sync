import type { CategorieSalon } from "@/lib/categories";

export type StatutArticle = "brouillon" | "publie";

export type ArticleBlog = {
  id: string;
  slug: string;
  titre: string;
  extrait: string;
  contenu: string;
  categorie_metier: CategorieSalon | null;
  date_publication: string;
  updated_at: string;
  image_couverture_url: string | null;
  statut: StatutArticle;
};

/** Version allégée pour les listes et le maillage interne. */
export type ResumeArticle = Omit<ArticleBlog, "contenu">;

export type ListeArticles = {
  articles: ResumeArticle[];
  total: number;
  page: number;
  nbPages: number;
};

/** Lien vers la page métier de l'article, quand la catégorie est renseignée. */
export type LienMetier = { slug: string; label: string; plurielNom: string };

export type PageArticle = {
  article: ArticleBlog;
  metier: LienMetier | null;
  autres: ResumeArticle[];
};

export const PAR_PAGE_BLOG = 20;
