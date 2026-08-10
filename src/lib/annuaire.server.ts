// Logique serveur des pages publiques (annuaire, recherche, fiche salon, avis, distribution).
// Tout passe par le client service role : aucune lecture anonyme directe des tables.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
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
  prix_min: number | null;
};

const COLONNES =
  "id, slug, nom, ville, code_postal, categorie, description, photo_couverture_url, note_moyenne, nb_avis";

async function prixMinParSalon(ids: string[]) {
  const map = new Map<string, number>();
  if (!ids.length) return map;
  const { data } = await supabaseAdmin
    .from("prestations")
    .select("salon_id, prix")
    .in("salon_id", ids)
    .eq("actif", true);
  for (const p of data ?? []) {
    const prix = Number(p.prix);
    const actuel = map.get(p.salon_id);
    if (actuel === undefined || prix < actuel) map.set(p.salon_id, prix);
  }
  return map;
}

type LigneSalon = {
  id: string;
  slug: string | null;
  nom: string;
  ville: string | null;
  code_postal: string | null;
  categorie: CategorieSalon;
  description: string | null;
  photo_couverture_url: string | null;
  note_moyenne: number | null;
  nb_avis: number;
};

function versCarte(s: LigneSalon, prixMin: Map<string, number>): SalonCarte {
  return {
    id: s.id,
    slug: s.slug ?? "",
    nom: s.nom,
    ville: s.ville,
    code_postal: s.code_postal,
    categorie: s.categorie,
    description: s.description,
    photo_couverture_url: s.photo_couverture_url,
    note_moyenne: s.note_moyenne === null ? null : Number(s.note_moyenne),
    nb_avis: Number(s.nb_avis ?? 0),
    prix_min: prixMin.get(s.id) ?? null,
  };
}

export async function chargerAnnuaire(): Promise<{
  salons: SalonCarte[];
  villes: string[];
}> {
  const { data } = await supabaseAdmin
    .from("salons")
    .select(COLONNES)
    .eq("reservation_en_ligne", true)
    .not("slug", "is", null)
    .order("nb_avis", { ascending: false })
    .limit(24);

  const lignes = data ?? [];
  const prixMin = await prixMinParSalon(lignes.map((s) => s.id));
  const salons = lignes.map((s) => versCarte(s as LigneSalon, prixMin));
  const villes = [...new Set(salons.map((s) => s.ville).filter((v): v is string => !!v))].sort(
    (a, b) => a.localeCompare(b, "fr"),
  );
  return { salons, villes };
}

export type FiltresRecherche = {
  categorie: string | null;
  q: string | null;
  ville: string | null;
  noteMin: number | null;
};

export async function rechercherSalons(f: FiltresRecherche): Promise<SalonCarte[]> {
  let requete = supabaseAdmin
    .from("salons")
    .select(COLONNES)
    .eq("reservation_en_ligne", true)
    .not("slug", "is", null);

  if (f.categorie) requete = requete.eq("categorie", f.categorie as CategorieSalon);
  if (f.ville) requete = requete.ilike("ville", `%${f.ville}%`);
  if (f.noteMin) requete = requete.gte("note_moyenne", f.noteMin);

  const { data } = await requete.order("note_moyenne", { ascending: false, nullsFirst: false });
  let lignes = data ?? [];

  if (f.q) {
    const terme = f.q.trim().toLowerCase();
    const { data: presta } = await supabaseAdmin
      .from("prestations")
      .select("salon_id, nom")
      .eq("actif", true)
      .ilike("nom", `%${terme}%`);
    const idsPresta = new Set((presta ?? []).map((p) => p.salon_id));
    lignes = lignes.filter(
      (s) =>
        s.nom.toLowerCase().includes(terme) ||
        (s.description ?? "").toLowerCase().includes(terme) ||
        idsPresta.has(s.id),
    );
  }

  const prixMin = await prixMinParSalon(lignes.map((s) => s.id));
  return lignes.map((s) => versCarte(s as LigneSalon, prixMin));
}

export async function chargerVilles(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("salons")
    .select("ville")
    .eq("reservation_en_ligne", true)
    .not("ville", "is", null);
  return [...new Set((data ?? []).map((s) => s.ville as string))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

export type FicheSalon = {
  salon: SalonCarte & { adresse: string | null; telephone: string | null };
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
  avis: { id: string; note: number; commentaire: string | null; client_nom: string | null; created_at: string }[];
};

export async function chargerFicheSalon(slug: string): Promise<FicheSalon | null> {
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select(`${COLONNES}, adresse, telephone, reservation_en_ligne`)
    .eq("slug", slug)
    .maybeSingle();

  if (!salon || !salon.slug) return null;

  const [{ data: photos }, { data: cats }, { data: prestations }, { data: horaires }, { data: avis }] =
    await Promise.all([
      supabaseAdmin.from("photos_salon").select("id, url").eq("salon_id", salon.id).order("ordre"),
      supabaseAdmin.from("categories").select("id, nom").eq("salon_id", salon.id).order("ordre"),
      supabaseAdmin
        .from("prestations")
        .select("id, nom, duree_min, prix, categorie_id")
        .eq("salon_id", salon.id)
        .eq("actif", true)
        .order("ordre"),
      supabaseAdmin
        .from("horaires_salon")
        .select("jour, ferme, ouverture, fermeture")
        .eq("salon_id", salon.id)
        .order("jour"),
      supabaseAdmin
        .from("avis")
        .select("id, note, commentaire, client_nom, created_at")
        .eq("salon_id", salon.id)
        .eq("visible", true)
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

  const prixMin = await prixMinParSalon([salon.id]);
  return {
    salon: {
      ...versCarte(salon as unknown as LigneSalon, prixMin),
      adresse: salon.adresse,
      telephone: salon.telephone,
    },
    photos: photos ?? [],
    categories: cats ?? [],
    prestations: (prestations ?? []).map((p) => ({ ...p, prix: Number(p.prix) })),
    horaires: horaires ?? [],
    avis: avis ?? [],
  };
}

export type ContexteAvis = {
  salon: string;
  prestation: string | null;
  debut: string;
  deja_donne: boolean;
};

export async function chargerContexteAvis(token: string): Promise<ContexteAvis | null> {
  const { data } = await supabaseAdmin
    .from("rdv")
    .select("id, statut, debut, salon_id, prestations(nom), salons(nom)")
    .eq("avis_token", token)
    .maybeSingle();

  if (!data || data.statut !== "venu") return null;

  const { data: existant } = await supabaseAdmin
    .from("avis")
    .select("id")
    .eq("rdv_id", data.id)
    .maybeSingle();

  return {
    salon: data.salons?.nom ?? "",
    prestation: data.prestations?.nom ?? null,
    debut: data.debut,
    deja_donne: !!existant,
  };
}

export async function deposerAvis(input: {
  token: string;
  note: number;
  commentaire: string;
  prenom: string;
}): Promise<{ visible: boolean }> {
  const { data: rdv } = await supabaseAdmin
    .from("rdv")
    .select("id, statut, salon_id")
    .eq("avis_token", input.token)
    .maybeSingle();

  if (!rdv || rdv.statut !== "venu")
    throw new Error("Cet avis n'est pas disponible : le rendez-vous n'a pas encore eu lieu.");

  const { data: existant } = await supabaseAdmin
    .from("avis")
    .select("id")
    .eq("rdv_id", rdv.id)
    .maybeSingle();
  if (existant) throw new Error("Un avis a déjà été déposé pour ce rendez-vous.");

  const { data: params } = await supabaseAdmin
    .from("parametres_salon")
    .select("moderation_avis")
    .eq("salon_id", rdv.salon_id)
    .maybeSingle();

  const visible = !params?.moderation_avis;
  const { error } = await supabaseAdmin.from("avis").insert({
    salon_id: rdv.salon_id,
    rdv_id: rdv.id,
    note: input.note,
    commentaire: input.commentaire || null,
    client_nom: input.prenom || null,
    visible,
  });
  if (error) throw new Error(error.message);
  return { visible };
}

export async function enregistrerCandidature(input: {
  nom: string;
  telephone: string;
  email: string;
  ville: string;
  message: string;
}): Promise<{ ok: true }> {
  const { error } = await supabaseAdmin.from("candidatures_distribution").insert({
    nom: input.nom,
    telephone: input.telephone,
    email: input.email,
    ville: input.ville,
    message: input.message || null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function chargerSitemap(): Promise<{
  salons: { slug: string }[];
  pages: { categorie: string; ville: string }[];
}> {
  const { data } = await supabaseAdmin
    .from("salons")
    .select("slug, ville, categorie")
    .eq("reservation_en_ligne", true)
    .not("slug", "is", null);

  const lignes = data ?? [];
  const paires = new Map<string, { categorie: string; ville: string }>();
  for (const s of lignes) {
    if (!s.ville) continue;
    paires.set(`${s.categorie}|${s.ville}`, { categorie: s.categorie, ville: s.ville });
  }
  return {
    salons: lignes.map((s) => ({ slug: s.slug as string })),
    pages: [...paires.values()],
  };
}
