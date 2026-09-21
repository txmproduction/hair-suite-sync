import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { LIMITES_ESSAI } from "@/lib/droits";

export type EtatDroits = {
  /** Abonnement actif et compte non suspendu : aucune limite. */
  accesComplet: boolean;
  gerant: boolean;
  employesActifs: number;
  limiteEmployes: number;
  rdvDuMois: number;
  limiteRdv: number;
  acomptesAutorises: boolean;
};

const VIDE: EtatDroits = {
  accesComplet: false,
  gerant: false,
  employesActifs: 0,
  limiteEmployes: LIMITES_ESSAI.employes,
  rdvDuMois: 0,
  limiteRdv: LIMITES_ESSAI.rdvParMois,
  acomptesAutorises: false,
};

/**
 * Droits réels du salon connecté : calculés côté serveur, en miroir des
 * garde-fous appliqués en base de données.
 */
export const etatDroitsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EtatDroits> => {
    const { data: employe } = await context.supabase
      .from("employes")
      .select("salon_id, role")
      .eq("user_id", context.userId)
      .eq("actif", true)
      .maybeSingle();
    if (!employe) return VIDE;

    const { data: salon } = await context.supabase
      .from("salons")
      .select("abonnement_actif, compte_suspendu")
      .eq("id", employe.salon_id)
      .maybeSingle();

    const accesComplet = Boolean(salon?.abonnement_actif) && !salon?.compte_suspendu;

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const finMois = new Date(debutMois);
    finMois.setMonth(finMois.getMonth() + 1);

    const [{ count: employes }, { count: rdv }] = await Promise.all([
      context.supabase
        .from("employes")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", employe.salon_id)
        .eq("actif", true),
      context.supabase
        .from("rdv")
        .select("id", { count: "exact", head: true })
        .eq("salon_id", employe.salon_id)
        .neq("statut", "annule")
        .gte("debut", debutMois.toISOString())
        .lt("debut", finMois.toISOString()),
    ]);

    return {
      accesComplet,
      gerant: employe.role === "gerant",
      employesActifs: employes ?? 0,
      limiteEmployes: LIMITES_ESSAI.employes,
      rdvDuMois: rdv ?? 0,
      limiteRdv: LIMITES_ESSAI.rdvParMois,
      acomptesAutorises: accesComplet,
    };
  });
