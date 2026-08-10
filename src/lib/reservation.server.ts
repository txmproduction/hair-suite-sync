// Logique serveur de la réservation en ligne publique.
// Utilise le client service role : aucun accès direct anon aux tables.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SalonPublic = {
  salon: { id: string; nom: string; adresse: string | null; telephone: string | null; slug: string };
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

export const MINUTE = 60_000;

export function calculAcompteServeur(
  prix: number,
  acompte: SalonPublic["acompte"] | null,
): number {
  if (!acompte || !acompte.valeur) return 0;
  const montant =
    acompte.type === "pourcentage" ? (prix * acompte.valeur) / 100 : acompte.valeur;
  return Math.min(Math.round(montant * 100) / 100, prix);
}

export async function chargerSalonPublic(slug: string): Promise<SalonPublic | null> {
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("id, nom, adresse, telephone, slug, reservation_en_ligne")
    .eq("slug", slug)
    .maybeSingle();

  if (!salon || !salon.reservation_en_ligne || !salon.slug) return null;

  const [{ data: categories }, { data: prestations }, { data: employes }, { data: params }] =
    await Promise.all([
      supabaseAdmin
        .from("categories")
        .select("id, nom, ordre")
        .eq("salon_id", salon.id)
        .order("ordre"),
      supabaseAdmin
        .from("prestations")
        .select("id, nom, duree_min, prix, couleur, categorie_id")
        .eq("salon_id", salon.id)
        .eq("actif", true)
        .order("ordre"),
      supabaseAdmin
        .from("employes")
        .select("id, nom, photo_url, couleur, ordre")
        .eq("salon_id", salon.id)
        .eq("actif", true)
        .order("ordre"),
      supabaseAdmin
        .from("parametres_salon")
        .select("acompte_type, acompte_valeur, delai_annulation_h")
        .eq("salon_id", salon.id)
        .maybeSingle(),
    ]);

  return {
    salon: {
      id: salon.id,
      nom: salon.nom,
      adresse: salon.adresse,
      telephone: salon.telephone,
      slug: salon.slug,
    },
    categories: categories ?? [],
    prestations: (prestations ?? []).map((p) => ({ ...p, prix: Number(p.prix) })),
    employes: (employes ?? []).map((e) => ({
      id: e.id,
      nom: e.nom,
      photo_url: e.photo_url,
      couleur: e.couleur,
    })),
    acompte: {
      type: params?.acompte_type ?? "pourcentage",
      valeur: Number(params?.acompte_valeur ?? 0),
      delai_annulation_h: params?.delai_annulation_h ?? 24,
    },
  };
}

export type JourCreneaux = { date: string; creneaux: { debut: string; employe_id: string }[] };

export async function chargerCreneaux(input: {
  slug: string;
  prestationId: string;
  employeId: string | null;
  depart: string;
  jours: number;
}): Promise<JourCreneaux[]> {
  const contexte = await chargerSalonPublic(input.slug);
  if (!contexte) return [];

  const base = new Date(`${input.depart}T00:00:00`);
  const jours: JourCreneaux[] = [];

  for (let i = 0; i < input.jours; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const { data, error } = await supabaseAdmin.rpc("creneaux_disponibles", {
      p_salon: contexte.salon.id,
      p_prestation: input.prestationId,
      p_employe: input.employeId as unknown as string,
      p_date: iso,
    });
    if (error) throw new Error(error.message);
    jours.push({
      date: iso,
      creneaux: (data ?? []).map((c: { debut: string; employe_id: string }) => ({
        debut: c.debut,
        employe_id: c.employe_id,
      })),
    });
  }
  return jours;
}

export type ResultatReservation = {
  token: string;
  paiement_url: string | null;
};

export async function creerReservationPublique(input: {
  slug: string;
  prestationId: string;
  employeId: string | null;
  debut: string;
  nom: string;
  telephone: string;
  email: string;
}): Promise<ResultatReservation> {
  const contexte = await chargerSalonPublic(input.slug);
  if (!contexte) throw new Error("Réservation en ligne indisponible pour ce salon.");

  const prestation = contexte.prestations.find((p) => p.id === input.prestationId);
  if (!prestation) throw new Error("Prestation introuvable ou inactive.");

  if (input.employeId && !contexte.employes.some((e) => e.id === input.employeId)) {
    throw new Error("Praticien introuvable pour ce salon.");
  }

  const debut = new Date(input.debut);
  if (Number.isNaN(debut.getTime()) || debut.getTime() < Date.now()) {
    throw new Error("Créneau invalide.");
  }

  // Revalidation serveur du créneau au moment de l'insertion
  const jour = new Date(debut.toLocaleString("sv-SE", { timeZone: "Europe/Paris" }))
    .toISOString()
    .slice(0, 10);
  const { data: dispos, error: erreurDispos } = await supabaseAdmin.rpc("creneaux_disponibles", {
    p_salon: contexte.salon.id,
    p_prestation: prestation.id,
    p_employe: input.employeId as unknown as string,
    p_date: jour,
  });
  if (erreurDispos) throw new Error(erreurDispos.message);

  const correspondance = (dispos ?? []).find(
    (c: { debut: string; employe_id: string }) =>
      new Date(c.debut).getTime() === debut.getTime() &&
      (!input.employeId || c.employe_id === input.employeId),
  );
  if (!correspondance) throw new Error("Ce créneau vient d'être réservé. Choisissez-en un autre.");

  const employeId: string = correspondance.employe_id;

  // Client : réutilisation par téléphone, sinon création
  const telephone = input.telephone.trim();
  let clientId: string | null = null;
  if (telephone) {
    const { data: existant } = await supabaseAdmin
      .from("clients")
      .select("id")
      .eq("salon_id", contexte.salon.id)
      .eq("telephone", telephone)
      .maybeSingle();
    clientId = existant?.id ?? null;
  }
  if (!clientId) {
    const { data: cree, error } = await supabaseAdmin
      .from("clients")
      .insert({
        salon_id: contexte.salon.id,
        nom: input.nom.trim(),
        telephone: telephone || null,
        email: input.email.trim() || null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    clientId = cree.id;
  } else {
    await supabaseAdmin
      .from("clients")
      .update({ nom: input.nom.trim(), email: input.email.trim() || null })
      .eq("id", clientId);
  }

  const acompte = calculAcompteServeur(prestation.prix, contexte.acompte);
  const avecPaiement = acompte > 0;

  const { data: rdv, error } = await supabaseAdmin
    .from("rdv")
    .insert({
      salon_id: contexte.salon.id,
      client_id: clientId,
      employe_id: employeId,
      prestation_id: prestation.id,
      debut: debut.toISOString(),
      duree_min: prestation.duree_min,
      statut: avecPaiement ? "en_attente_paiement" : "a_venir",
      acompte: avecPaiement ? acompte : 0,
      origine: "en_ligne",
      expire_at: avecPaiement ? new Date(Date.now() + 15 * 60_000).toISOString() : null,
    })
    .select("id, annulation_token")
    .single();

  if (error) {
    if (error.code === "23P01") {
      throw new Error("Ce créneau vient d'être réservé. Choisissez-en un autre.");
    }
    throw new Error(error.message);
  }

  return { token: rdv.annulation_token, paiement_url: null };
}

export type RecapReservation = {
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

export async function chargerReservation(token: string): Promise<RecapReservation | null> {
  const { data } = await supabaseAdmin
    .from("rdv")
    .select(
      "id, statut, debut, duree_min, acompte, salon_id, prestations(nom, prix), employes(nom), salons(nom, adresse, telephone, slug)",
    )
    .eq("annulation_token", token)
    .maybeSingle();

  if (!data) return null;

  const { data: params } = await supabaseAdmin
    .from("parametres_salon")
    .select("delai_annulation_h")
    .eq("salon_id", data.salon_id)
    .maybeSingle();

  const delai = params?.delai_annulation_h ?? 24;
  const limite = new Date(data.debut).getTime() - delai * 3600_000;

  return {
    statut: data.statut,
    debut: data.debut,
    duree_min: data.duree_min,
    acompte: Number(data.acompte),
    prestation: data.prestations?.nom ?? null,
    prix: Number(data.prestations?.prix ?? 0),
    employe: data.employes?.nom ?? null,
    salon: {
      nom: data.salons?.nom ?? "",
      adresse: data.salons?.adresse ?? null,
      telephone: data.salons?.telephone ?? null,
      slug: data.salons?.slug ?? null,
    },
    annulation_possible:
      (data.statut === "a_venir" || data.statut === "en_attente_paiement") &&
      Date.now() < limite,
    delai_annulation_h: delai,
  };
}

export async function annulerReservationPublique(token: string): Promise<RecapReservation> {
  const recap = await chargerReservation(token);
  if (!recap) throw new Error("Réservation introuvable.");
  if (!recap.annulation_possible) {
    throw new Error(
      `L'annulation en ligne n'est plus possible (délai de ${recap.delai_annulation_h} h dépassé). Appelez le salon.`,
    );
  }
  const { error } = await supabaseAdmin
    .from("rdv")
    .update({ statut: "annule" })
    .eq("annulation_token", token);
  if (error) throw new Error(error.message);
  const apres = await chargerReservation(token);
  return apres!;
}
