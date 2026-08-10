// Logique serveur des pages publiques (annuaire, recherche, fiche salon, avis, distribution).
// Tout passe par le client service role : aucune lecture anonyme directe des tables.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CategorieSalon } from "@/lib/categories";
import type { ContexteAvis, FicheSalon, SalonCarte } from "@/lib/annuaire-types";

export type { ContexteAvis, FicheSalon, SalonCarte };

const COLONNES =
  "id, slug, nom, ville, code_postal, categorie, description, photo_couverture_url, note_moyenne, nb_avis, note_google, nb_avis_google, statut, lien_externe, latitude, longitude";

// Un salon apparaît dans l'annuaire s'il réserve en ligne, ou s'il s'agit d'une fiche non réclamée.
const FILTRE_VISIBLE = "reservation_en_ligne.eq.true,statut.eq.non_reclame";

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
  note_google: number | null;
  nb_avis_google: number | null;
  statut: "reclame" | "non_reclame";
  lien_externe: string | null;
  latitude: number | null;
  longitude: number | null;
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
    note_google: s.note_google === null ? null : Number(s.note_google),
    nb_avis_google: s.nb_avis_google === null ? null : Number(s.nb_avis_google),
    statut: s.statut,
    prix_min: prixMin.get(s.id) ?? null,
    latitude: s.latitude === null ? null : Number(s.latitude),
    longitude: s.longitude === null ? null : Number(s.longitude),
    distance_km: null,
  };
}

export async function chargerAnnuaire(): Promise<{
  salons: SalonCarte[];
  villes: string[];
}> {
  const { data } = await supabaseAdmin
    .from("salons")
    .select(COLONNES)
    .or(FILTRE_VISIBLE)
    .not("slug", "is", null)
    .limit(120);

  const lignes = data ?? [];
  const prixMin = await prixMinParSalon(lignes.map((s) => s.id));
  const tous = lignes.map((s) => versCarte(s as LigneSalon, prixMin));

  // Mise en avant des mieux notés : on privilégie les avis HairTrack quand ils
  // existent, sinon la note Google. Un minimum d'avis évite qu'un salon avec
  // un seul 5 étoiles passe devant un salon à 4,7 sur 300 avis.
  const note = (s: SalonCarte) => s.note_moyenne ?? s.note_google ?? 0;
  const nbAvis = (s: SalonCarte) => (s.note_moyenne ? s.nb_avis : (s.nb_avis_google ?? 0));
  const salons = tous
    .filter((s) => note(s) > 0 && nbAvis(s) >= 10)
    .sort((a, b) => note(b) - note(a) || nbAvis(b) - nbAvis(a));

  const villes = [...new Set(tous.map((s) => s.ville).filter((v): v is string => !!v))].sort(
    (a, b) => a.localeCompare(b, "fr"),
  );
  return { salons, villes };
}

export type FiltresRecherche = {
  lat?: number | null;
  lng?: number | null;
  categorie: string | null;
  q: string | null;
  ville: string | null;
  noteMin: number | null;
};

export async function rechercherSalons(f: FiltresRecherche): Promise<SalonCarte[]> {
  let requete = supabaseAdmin
    .from("salons")
    .select(COLONNES)
    .or(FILTRE_VISIBLE)
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
  const cartes = lignes.map((s) => versCarte(s as LigneSalon, prixMin));

  // Recherche "autour de moi" : on calcule la distance à vol d'oiseau et on
  // trie du plus proche au plus loin, en écartant ce qui est au-delà de 50 km.
  if (typeof f.lat === "number" && typeof f.lng === "number") {
    const R = 6371; // rayon terrestre en km
    const rad = (d: number) => (d * Math.PI) / 180;
    const proches = cartes
      .map((c) => {
        if (c.latitude === null || c.longitude === null) return { ...c, distance_km: null };
        const dLat = rad(c.latitude - f.lat!);
        const dLng = rad(c.longitude - f.lng!);
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(rad(f.lat!)) * Math.cos(rad(c.latitude)) * Math.sin(dLng / 2) ** 2;
        const distance = 2 * R * Math.asin(Math.sqrt(a));
        return { ...c, distance_km: Math.round(distance * 10) / 10 };
      })
      .filter((c) => c.distance_km !== null && c.distance_km <= 50);
    proches.sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0));
    return proches;
  }

  return cartes;
}

export async function chargerVilles(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("salons")
    .select("ville")
    .or(FILTRE_VISIBLE)
    .not("ville", "is", null);
  return [...new Set((data ?? []).map((s) => s.ville as string))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}

/** Suggestions pour la barre de recherche : uniquement ce qui existe vraiment sur HairTrack. */
export async function chargerSuggestions(): Promise<{
  prestations: string[];
  salons: string[];
  villes: string[];
}> {
  const { data: salonsData } = await supabaseAdmin
    .from("salons")
    .select("id, nom, ville")
    .or(FILTRE_VISIBLE)
    .not("slug", "is", null);
  const lignes = salonsData ?? [];

  const { data: prestaData } = await supabaseAdmin
    .from("prestations")
    .select("nom, salon_id")
    .eq("actif", true);
  const idsVisibles = new Set(lignes.map((s) => s.id));

  const prestations = [
    ...new Set(
      (prestaData ?? [])
        .filter((p) => idsVisibles.has(p.salon_id))
        .map((p) => p.nom.trim())
        .filter(Boolean),
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  const salons = [...new Set(lignes.map((s) => s.nom))].sort((a, b) => a.localeCompare(b, "fr"));
  const villes = [
    ...new Set(lignes.map((s) => s.ville).filter((v): v is string => !!v)),
  ].sort((a, b) => a.localeCompare(b, "fr"));

  return { prestations, salons, villes };
}

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
      lien_externe: salon.lien_externe,
    },
    photos: photos ?? [],
    categories: cats ?? [],
    prestations: (prestations ?? []).map((p) => ({ ...p, prix: Number(p.prix) })),
    horaires: horaires ?? [],
    avis: avis ?? [],
  };
}

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
    .or(FILTRE_VISIBLE)
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

export async function enregistrerClicManque(salonId: string): Promise<{ ok: true }> {
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("id, statut")
    .eq("id", salonId)
    .maybeSingle();
  if (!salon || salon.statut !== "non_reclame") throw new Error("Salon introuvable.");
  await supabaseAdmin.from("clics_reservation_manquee").insert({ salon_id: salon.id });
  return { ok: true };
}

export async function infosReprise(slug: string) {
  const { data } = await supabaseAdmin
    .from("salons")
    .select("id, nom, adresse, telephone, ville, statut, slug")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || data.statut !== "non_reclame") return null;
  return {
    slug: data.slug as string,
    nom: data.nom,
    adresse: data.adresse ?? "",
    telephone: data.telephone ?? "",
    ville: data.ville ?? "",
  };
}

export async function reprendreFiche(input: {
  userId: string;
  email: string | null;
  slug: string;
  nomSalon: string;
  adresse: string;
  telephone: string;
  nomGerant: string;
}) {
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("id, statut")
    .eq("slug", input.slug)
    .maybeSingle();
  if (!salon || salon.statut !== "non_reclame")
    throw new Error("Cette fiche n'est plus disponible à la reprise.");

  const { error } = await supabaseAdmin
    .from("salons")
    .update({
      statut: "reclame",
      gerant_user_id: input.userId,
      reservation_en_ligne: true,
      nom: input.nomSalon,
      adresse: input.adresse || null,
      telephone: input.telephone || null,
    })
    .eq("id", salon.id);
  if (error) throw new Error(error.message);

  await supabaseAdmin.from("employes").insert({
    salon_id: salon.id,
    user_id: input.userId,
    nom: input.nomGerant || "Gérant",
    email: input.email,
    role: "gerant",
    voit_ca_global: true,
  });
  await supabaseAdmin.from("parametres_salon").insert({ salon_id: salon.id });
  await supabaseAdmin.from("horaires_salon").insert(
    Array.from({ length: 7 }, (_, jour) => ({ salon_id: salon.id, jour, ferme: jour === 6 })),
  );
  return { ok: true as const, salonId: salon.id };
}
