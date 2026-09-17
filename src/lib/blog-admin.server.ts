// Écriture des articles de blog, réservée au super-admin (vérification faite
// dans la fonction serveur appelante avant d'arriver ici).
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normaliserSlug } from "@/lib/seo";
import type { CategorieSalon } from "@/lib/categories";
import type { ArticleBlog, StatutArticle } from "@/lib/blog-types";

export type SaisieArticle = {
  id?: string | null;
  slug: string;
  titre: string;
  extrait: string;
  contenu: string;
  categorie_metier: CategorieSalon | null;
  image_couverture_url: string | null;
  statut: StatutArticle;
  date_publication?: string | null;
};

export async function listerArticlesAdmin(): Promise<ArticleBlog[]> {
  const { data, error } = await supabaseAdmin
    .from("articles_blog")
    .select("*")
    .order("date_publication", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as ArticleBlog[];
}

export async function enregistrerArticle(saisie: SaisieArticle): Promise<ArticleBlog> {
  const slug = normaliserSlug(saisie.slug || saisie.titre);
  if (!slug) throw new Error("Slug invalide.");

  const valeurs = {
    slug,
    titre: saisie.titre,
    extrait: saisie.extrait,
    contenu: saisie.contenu,
    categorie_metier: saisie.categorie_metier,
    image_couverture_url: saisie.image_couverture_url,
    statut: saisie.statut,
    ...(saisie.date_publication ? { date_publication: saisie.date_publication } : {}),
  };

  const requete = saisie.id
    ? supabaseAdmin.from("articles_blog").update(valeurs).eq("id", saisie.id).select("*").single()
    : supabaseAdmin.from("articles_blog").insert(valeurs).select("*").single();

  const { data, error } = await requete;
  if (error) throw new Error(error.message);
  return data as unknown as ArticleBlog;
}

export async function supprimerArticle(id: string) {
  const { error } = await supabaseAdmin.from("articles_blog").delete().eq("id", id);
  if (error) throw new Error(error.message);
  return { supprime: true };
}
