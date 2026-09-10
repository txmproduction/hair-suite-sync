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

/** Vérifie qu'une URL renvoie bien une image (sinon la photo est ignorée). */
async function photoAccessible(url: string): Promise<boolean> {
  const controleur = new AbortController();
  const minuteur = setTimeout(() => controleur.abort(), 6000);
  try {
    let r = await fetch(url, { method: "HEAD", signal: controleur.signal, redirect: "follow" });
    if (r.status === 405 || r.status === 501)
      r = await fetch(url, { method: "GET", signal: controleur.signal, redirect: "follow" });
    if (!r.ok) return false;
    const type = r.headers.get("content-type") ?? "";
    return type.startsWith("image/") || type === "";
  } catch {
    return false;
  } finally {
    clearTimeout(minuteur);
  }
}

/** Ne conserve que les photos qui répondent réellement. */
async function photosValides(urls: string[]): Promise<string[]> {
  const resultats = await Promise.all(urls.map((u) => photoAccessible(u)));
  return urls.filter((_, i) => resultats[i]);
}

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

    const photosDemandees = l.photos ?? [];
    const photos = photosDemandees.length ? await photosValides(photosDemandees) : [];
    if (photos.length < photosDemandees.length)
      ignores.push(
        `Photo ignorée (URL invalide) : ${l.nom} (${photosDemandees.length - photos.length})`,
      );

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
        photo_couverture_url: photos[0] ?? null,
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
    if (photos.length > 1) {
      await supabaseAdmin.from("photos_salon").insert(
        photos.map((url, ordre) => ({ salon_id: cree.id, url, ordre })),
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

/* ---------------- Acomptes à reverser aux salons ---------------- */

/** Lundi (UTC) de la semaine calendaire d'une date, au format AAAA-MM-JJ. */
function lundiDeLaSemaine(iso: string): string {
  const d = new Date(iso);
  const jour = (d.getUTCDay() + 6) % 7; // 0 = lundi
  d.setUTCDate(d.getUTCDate() - jour);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export type LigneReversement = {
  salon_id: string;
  salon_nom: string;
  semaine_debut: string;
  nb_rdv: number;
  montant: number;
  iban: string | null;
  titulaire: string | null;
  statut: "a_faire" | "fait";
  date_virement: string | null;
};

export type SyntheseReversements = {
  aFaire: LigneReversement[];
  historique: LigneReversement[];
  totalAFaire: number;
};

/** Regroupe les acomptes réellement payés par salon et par semaine calendaire. */
export async function listerReversements(): Promise<SyntheseReversements> {
  const { data: rdvs } = await supabaseAdmin
    .from("rdv")
    .select("salon_id, debut, acompte, statut")
    .gt("acompte", 0)
    .neq("statut", "en_attente_paiement");

  const groupes = new Map<string, { salon_id: string; semaine: string; nb: number; montant: number }>();
  for (const r of rdvs ?? []) {
    const semaine = lundiDeLaSemaine(r.debut);
    const cle = `${r.salon_id}|${semaine}`;
    const g = groupes.get(cle) ?? { salon_id: r.salon_id, semaine, nb: 0, montant: 0 };
    g.nb += 1;
    g.montant += Number(r.acompte);
    groupes.set(cle, g);
  }

  const salonIds = [...new Set([...groupes.values()].map((g) => g.salon_id))];
  const noms = new Map<string, string>();
  const banque = new Map<string, { iban: string; titulaire: string }>();

  if (salonIds.length) {
    const [{ data: salons }, { data: comptes }] = await Promise.all([
      supabaseAdmin.from("salons").select("id, nom").in("id", salonIds),
      supabaseAdmin
        .from("coordonnees_bancaires")
        .select("salon_id, iban, titulaire_compte")
        .in("salon_id", salonIds),
    ]);
    for (const s of salons ?? []) noms.set(s.id, s.nom);
    for (const c of comptes ?? [])
      banque.set(c.salon_id, { iban: c.iban, titulaire: c.titulaire_compte });
  }

  const { data: deja } = await supabaseAdmin
    .from("reversements")
    .select("salon_id, semaine_debut, statut, date_virement");
  const soldes = new Map<string, { statut: string; date_virement: string | null }>();
  for (const r of deja ?? [])
    soldes.set(`${r.salon_id}|${r.semaine_debut}`, {
      statut: r.statut,
      date_virement: r.date_virement,
    });

  const lignes: LigneReversement[] = [...groupes.values()].map((g) => {
    const cle = `${g.salon_id}|${g.semaine}`;
    const solde = soldes.get(cle);
    const b = banque.get(g.salon_id);
    return {
      salon_id: g.salon_id,
      salon_nom: noms.get(g.salon_id) ?? "Salon",
      semaine_debut: g.semaine,
      nb_rdv: g.nb,
      montant: Math.round(g.montant * 100) / 100,
      iban: b?.iban ?? null,
      titulaire: b?.titulaire ?? null,
      statut: solde?.statut === "fait" ? "fait" : "a_faire",
      date_virement: solde?.date_virement ?? null,
    };
  });

  const aFaire = lignes
    .filter((l) => l.statut === "a_faire")
    .sort((a, b) => b.montant - a.montant || b.semaine_debut.localeCompare(a.semaine_debut));
  const historique = lignes
    .filter((l) => l.statut === "fait")
    .sort((a, b) => b.semaine_debut.localeCompare(a.semaine_debut));

  return {
    aFaire,
    historique,
    totalAFaire: Math.round(aFaire.reduce((t, l) => t + l.montant, 0) * 100) / 100,
  };
}

/** Marque une semaine comme virée : le montant ne sera plus recompté. */
export async function marquerReversementFait(input: {
  salonId: string;
  semaineDebut: string;
  montant: number;
  note?: string | null;
}) {
  const { error } = await supabaseAdmin.from("reversements").upsert(
    {
      salon_id: input.salonId,
      semaine_debut: input.semaineDebut,
      montant: input.montant,
      statut: "fait",
      date_virement: new Date().toISOString(),
      note: input.note ?? null,
    },
    { onConflict: "salon_id,semaine_debut" },
  );
  if (error) throw new Error(error.message);
  return { ok: true as const };
}
