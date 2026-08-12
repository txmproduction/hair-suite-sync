// Logique super-admin : import de fiches non réclamées, suivi des clics manqués, conversion en client.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { CategorieSalon } from "@/lib/categories";
import { villeSlug } from "@/lib/categories";

export async function estSuperAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

async function slugUnique(nom: string, ville: string) {
  const base = [villeSlug(nom), villeSlug(ville)].filter(Boolean).join("-") || "salon";
  let slug = base;
  let n = 2;
  for (;;) {
    const { data } = await supabaseAdmin.from("salons").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    slug = `${base}-${n++}`;
  }
}

export type LigneImport = {
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  categorie: CategorieSalon;
  lien_externe: string | null;
  note_google?: number | null;
  nb_avis_google?: number | null;
  photos?: string[];
  latitude?: number | null;
  longitude?: number | null;
};

export async function importerSalonsNonReclames(lignes: LigneImport[], source: string) {
  let crees = 0;
  const ignores: string[] = [];

  for (const l of lignes) {
    const { data: existant } = await supabaseAdmin
      .from("salons")
      .select("id")
      .ilike("nom", l.nom)
      .ilike("ville", l.ville || "%")
      .maybeSingle();
    if (existant) {
      ignores.push(`${l.nom} (${l.ville}) — déjà présent`);
      continue;
    }

    const slug = await slugUnique(l.nom, l.ville);
    const { data: cree, error } = await supabaseAdmin
      .from("salons")
      .insert({
        nom: l.nom,
        adresse: l.adresse || null,
        ville: l.ville || null,
        telephone: l.telephone || null,
        categorie: l.categorie,
        lien_externe: l.lien_externe,
        note_google: l.note_google ?? null,
        nb_avis_google: l.nb_avis_google ?? null,
        photo_couverture_url: l.photos?.[0] ?? null,
        latitude: l.latitude ?? null,
        longitude: l.longitude ?? null,
        source,
        slug,
        statut: "non_reclame",
        reservation_en_ligne: false,
        gerant_user_id: null,
      })
      .select("id")
      .single();
    if (error) {
      ignores.push(`${l.nom} — ${error.message}`);
      continue;
    }
    if (l.photos && l.photos.length > 1) {
      await supabaseAdmin.from("photos_salon").insert(
        l.photos.map((url, ordre) => ({ salon_id: cree.id, url, ordre })),
      );
    }
    crees += 1;
  }

  return { crees, ignores };
}

export type SalonNonReclame = {
  id: string;
  nom: string;
  slug: string | null;
  ville: string | null;
  telephone: string | null;
  categorie: CategorieSalon;
  lien_externe: string | null;
  source: string | null;
  clics_30j: number;
  clics_total: number;
};

export async function listerSalonsNonReclames(): Promise<SalonNonReclame[]> {
  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id, nom, slug, ville, telephone, categorie, lien_externe, source")
    .eq("statut", "non_reclame");

  const ids = (salons ?? []).map((s) => s.id);
  const clics30 = new Map<string, number>();
  const clicsTotal = new Map<string, number>();

  if (ids.length) {
    const depuis = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    const { data: clics } = await supabaseAdmin
      .from("clics_reservation_manquee")
      .select("salon_id, created_at")
      .in("salon_id", ids);
    for (const c of clics ?? []) {
      clicsTotal.set(c.salon_id, (clicsTotal.get(c.salon_id) ?? 0) + 1);
      if (c.created_at >= depuis) clics30.set(c.salon_id, (clics30.get(c.salon_id) ?? 0) + 1);
    }
  }

  return (salons ?? [])
    .map((s) => ({
      ...s,
      clics_30j: clics30.get(s.id) ?? 0,
      clics_total: clicsTotal.get(s.id) ?? 0,
    }))
    .sort((a, b) => b.clics_30j - a.clics_30j || b.clics_total - a.clics_total);
}

export async function convertirEnClient(input: {
  salonId: string;
  email: string;
  nomGerant: string;
}) {
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("id, nom, statut")
    .eq("id", input.salonId)
    .maybeSingle();
  if (!salon || salon.statut !== "non_reclame")
    throw new Error("Ce salon n'est pas une fiche non réclamée.");

  let userId: string | null = null;
  let motDePasse: string | null = null;

  const { data: liste } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const trouve = liste?.users.find((u) => u.email?.toLowerCase() === input.email.toLowerCase());
  if (trouve) {
    userId = trouve.id;
  } else {
    motDePasse = `HT-${crypto.randomUUID().slice(0, 12)}`;
    const { data: cree, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: motDePasse,
      email_confirm: true,
    });
    if (error || !cree.user) throw new Error(error?.message ?? "Création du compte impossible.");
    userId = cree.user.id;
  }

  const { error: eSalon } = await supabaseAdmin
    .from("salons")
    .update({ statut: "reclame", gerant_user_id: userId, reservation_en_ligne: true })
    .eq("id", salon.id);
  if (eSalon) throw new Error(eSalon.message);

  const { data: dejaEmploye } = await supabaseAdmin
    .from("employes")
    .select("id")
    .eq("salon_id", salon.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!dejaEmploye) {
    await supabaseAdmin.from("employes").insert({
      salon_id: salon.id,
      user_id: userId,
      nom: input.nomGerant || "Gérant",
      email: input.email,
      role: "gerant",
      voit_ca_global: true,
    });
  }

  const { data: params } = await supabaseAdmin
    .from("parametres_salon")
    .select("salon_id")
    .eq("salon_id", salon.id)
    .maybeSingle();
  if (!params) await supabaseAdmin.from("parametres_salon").insert({ salon_id: salon.id });

  const { data: horaires } = await supabaseAdmin
    .from("horaires_salon")
    .select("id")
    .eq("salon_id", salon.id)
    .limit(1);
  if (!horaires?.length) {
    await supabaseAdmin.from("horaires_salon").insert(
      Array.from({ length: 7 }, (_, jour) => ({ salon_id: salon.id, jour, ferme: jour === 6 })),
    );
  }

  // L'historique des clics reste rattaché au même salon_id : rien à supprimer.
  return { ok: true as const, motDePasse };
}

export type StatutCompte = "permanent" | "essai" | "essai_expire" | "suspendu";

export type ClientAbonne = {
  id: string;
  nom: string;
  ville: string | null;
  email: string | null;
  statut: StatutCompte;
  joursRestants: number;
};

/** Liste des salons réclamés avec leur statut d'abonnement calculé côté serveur. */
export async function listerClientsAbonnes(): Promise<ClientAbonne[]> {
  const { data: salons } = await supabaseAdmin
    .from("salons")
    .select("id, nom, ville, gerant_user_id, abonnement_actif, compte_suspendu, trial_ends_at")
    .eq("statut", "reclame")
    .order("nom");

  const emails = new Map<string, string>();
  const { data: liste } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  for (const u of liste?.users ?? []) if (u.email) emails.set(u.id, u.email);

  return (salons ?? []).map((s) => {
    const restantMs = new Date(s.trial_ends_at).getTime() - Date.now();
    const joursRestants = Math.max(0, Math.ceil(restantMs / 86_400_000));
    const statut: StatutCompte = s.compte_suspendu
      ? "suspendu"
      : s.abonnement_actif
        ? "permanent"
        : restantMs > 0
          ? "essai"
          : "essai_expire";
    return {
      id: s.id,
      nom: s.nom,
      ville: s.ville,
      email: s.gerant_user_id ? (emails.get(s.gerant_user_id) ?? null) : null,
      statut,
      joursRestants,
    };
  });
}

/** Définit le statut d'abonnement d'un salon (accès permanent, essai de 14 jours, suspension). */
export async function definirStatutCompte(
  salonId: string,
  statut: "permanent" | "essai" | "suspendu",
) {
  const maj =
    statut === "permanent"
      ? { abonnement_actif: true, compte_suspendu: false }
      : statut === "essai"
        ? {
            abonnement_actif: false,
            compte_suspendu: false,
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 14 * 86_400_000).toISOString(),
          }
        : { compte_suspendu: true };

  const { error } = await supabaseAdmin.from("salons").update(maj).eq("id", salonId);
  if (error) throw new Error(error.message);
  return { ok: true as const };
}
