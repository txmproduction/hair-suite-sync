// Chargement serveur du blog : liste paginée, article, et derniers articles
// d'un métier pour le maillage interne des pages d'annuaire.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { parCategorie } from "@/lib/categories";
import type { CategorieSalon } from "@/lib/categories";
import {
  PAR_PAGE_BLOG,
  type ArticleBlog,
  type ListeArticles,
  type PageArticle,
  type ResumeArticle,
} from "@/lib/blog-types";

const COLONNES_RESUME =
  "id, slug, titre, extrait, categorie_metier, date_publication, updated_at, image_couverture_url, statut";
const COLONNES = `${COLONNES_RESUME}, contenu`;

const versResume = (l: Record<string, unknown>): ResumeArticle => ({
  id: String(l["id"]),
  slug: String(l["slug"]),
  titre: String(l["titre"]),
  extrait: String(l["extrait"] ?? ""),
  categorie_metier: (l["categorie_metier"] as CategorieSalon | null) ?? null,
  date_publication: String(l["date_publication"]),
  updated_at: String(l["updated_at"]),
  image_couverture_url: (l["image_couverture_url"] as string | null) ?? null,
  statut: "publie",
});

export async function chargerListeArticles(page = 1): Promise<ListeArticles> {
  const { data, count } = await supabaseAdmin
    .from("articles_blog")
    .select(COLONNES_RESUME, { count: "exact" })
    .eq("statut", "publie")
    .order("date_publication", { ascending: false });

  const tous = (data ?? []).map((l) => versResume(l as Record<string, unknown>));
  const total = count ?? tous.length;
  const nbPages = Math.max(1, Math.ceil(total / PAR_PAGE_BLOG));
  const pageSure = Math.min(Math.max(1, page), nbPages);
  return {
    articles: tous.slice((pageSure - 1) * PAR_PAGE_BLOG, pageSure * PAR_PAGE_BLOG),
    total,
    page: pageSure,
    nbPages,
  };
}

export async function chargerArticle(slug: string): Promise<PageArticle | null> {
  const { data } = await supabaseAdmin
    .from("articles_blog")
    .select(COLONNES)
    .eq("slug", slug)
    .eq("statut", "publie")
    .maybeSingle();
  if (!data) return null;

  const ligne = data as Record<string, unknown>;
  const article: ArticleBlog = {
    ...versResume(ligne),
    contenu: String(ligne["contenu"] ?? ""),
  };

  const info = article.categorie_metier ? parCategorie(article.categorie_metier) : null;

  const { data: autresBruts } = await supabaseAdmin
    .from("articles_blog")
    .select(COLONNES_RESUME)
    .eq("statut", "publie")
    .neq("slug", slug)
    .order("date_publication", { ascending: false })
    .limit(3);

  return {
    article,
    metier: info ? { slug: info.slug, label: info.label, plurielNom: info.plurielNom } : null,
    autres: (autresBruts ?? []).map((l) => versResume(l as Record<string, unknown>)),
  };
}

/** 2-3 derniers articles liés à un métier (maillage depuis les pages d'annuaire). */
export async function articlesDuMetier(
  categorie: CategorieSalon,
  limite = 3,
): Promise<ResumeArticle[]> {
  const { data } = await supabaseAdmin
    .from("articles_blog")
    .select(COLONNES_RESUME)
    .eq("statut", "publie")
    .eq("categorie_metier", categorie)
    .order("date_publication", { ascending: false })
    .limit(limite);
  return (data ?? []).map((l) => versResume(l as Record<string, unknown>));
}

/** Entrées du sitemap : uniquement les articles publiés. */
export async function chargerSitemapBlog() {
  const { data } = await supabaseAdmin
    .from("articles_blog")
    .select("slug, updated_at")
    .eq("statut", "publie")
    .order("date_publication", { ascending: false });
  return (data ?? []).map((l) => ({
    loc: `/blog/${(l as { slug: string }).slug}`,
    lastmod: (l as { updated_at: string | null }).updated_at,
  }));
}
