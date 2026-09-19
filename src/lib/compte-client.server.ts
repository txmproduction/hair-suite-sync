// Espace client public : rendez-vous et proches du titulaire, identifié par
// l'e-mail vérifié de sa session (lien de connexion par e-mail).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type ProcheClient = {
  id: string;
  prenom: string;
  nom: string;
  date_naissance: string | null;
  client_id: string;
};

export type RdvClient = {
  id: string;
  debut: string;
  duree_min: number;
  statut: string;
  prix: number;
  acompte: number;
  prestation: string | null;
  employe: string | null;
  salon: string;
  annulation_token: string;
  beneficiaire_id: string | null;
  beneficiaire: string | null;
};

export type EspaceClient = {
  email: string;
  proches: ProcheClient[];
  rdv: RdvClient[];
};

async function fichesClient(email: string): Promise<{ id: string }[]> {
  const { data } = await supabaseAdmin
    .from("clients")
    .select("id")
    .ilike("email", email)
    .limit(100);
  return data ?? [];
}

export async function chargerEspaceClient(email: string): Promise<EspaceClient> {
  const fiches = await fichesClient(email);
  const ids = fiches.map((c) => c.id);
  if (ids.length === 0) return { email, proches: [], rdv: [] };

  const [{ data: proches }, { data: rdv }] = await Promise.all([
    supabaseAdmin
      .from("proches")
      .select("id, prenom, nom, date_naissance, client_id")
      .in("client_id", ids)
      .order("prenom"),
    supabaseAdmin
      .from("rdv")
      .select(
        "id, debut, duree_min, statut, acompte, annulation_token, beneficiaire_id, prestations(nom, prix), employes(nom), salons(nom), proches(prenom, nom)",
      )
      .in("client_id", ids)
      .order("debut", { ascending: false })
      .limit(200),
  ]);

  return {
    email,
    proches: proches ?? [],
    rdv: (rdv ?? []).map((r) => ({
      id: r.id,
      debut: r.debut,
      duree_min: r.duree_min,
      statut: r.statut,
      prix: Number(r.prestations?.prix ?? 0),
      acompte: Number(r.acompte),
      prestation: r.prestations?.nom ?? null,
      employe: r.employes?.nom ?? null,
      salon: r.salons?.nom ?? "",
      annulation_token: r.annulation_token,
      beneficiaire_id: r.beneficiaire_id,
      beneficiaire: r.proches ? `${r.proches.prenom} ${r.proches.nom}`.trim() : null,
    })),
  };
}

async function verifierProprietaire(email: string, procheId: string): Promise<string> {
  const fiches = await fichesClient(email);
  const ids = fiches.map((c) => c.id);
  const { data } = await supabaseAdmin
    .from("proches")
    .select("id, client_id")
    .eq("id", procheId)
    .maybeSingle();
  if (!data || !ids.includes(data.client_id)) throw new Error("Proche introuvable.");
  return data.id;
}

export async function ajouterProcheClient(
  email: string,
  proche: { prenom: string; nom: string; date_naissance: string | null },
): Promise<void> {
  const fiches = await fichesClient(email);
  const clientId = fiches[0]?.id;
  if (!clientId)
    throw new Error("Aucun rendez-vous n'est encore rattaché à cette adresse e-mail.");
  const { error } = await supabaseAdmin.from("proches").insert({ client_id: clientId, ...proche });
  if (error) throw new Error(error.message);
}

export async function modifierProcheClient(
  email: string,
  procheId: string,
  proche: { prenom: string; nom: string; date_naissance: string | null },
): Promise<void> {
  const id = await verifierProprietaire(email, procheId);
  const { error } = await supabaseAdmin.from("proches").update(proche).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function supprimerProcheClient(email: string, procheId: string): Promise<void> {
  const id = await verifierProprietaire(email, procheId);
  const { error } = await supabaseAdmin.from("proches").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
