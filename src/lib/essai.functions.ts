import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EtatEssai = {
  actif: boolean;
  expire: boolean;
  suspendu: boolean;
  joursRestants: number;
  finLe: string | null;
  abonnement: boolean;
};

/**
 * État de l'essai gratuit, calculé côté serveur : l'horloge locale du
 * navigateur ne peut pas être utilisée pour contourner la limite.
 */
export const etatEssaiFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EtatEssai> => {
    const { data: employe } = await context.supabase
      .from("employes")
      .select("salon_id")
      .eq("user_id", context.userId)
      .eq("actif", true)
      .maybeSingle();

    if (!employe) {
      return {
        actif: false,
        expire: false,
        suspendu: false,
        joursRestants: 0,
        finLe: null,
        abonnement: false,
      };
    }

    const { data: salon } = await context.supabase
      .from("salons")
      .select("trial_ends_at, abonnement_actif, compte_suspendu")
      .eq("id", employe.salon_id)
      .maybeSingle();

    // La suspension est prioritaire sur l'essai et sur l'abonnement.
    if (salon?.compte_suspendu) {
      return {
        actif: false,
        expire: false,
        suspendu: true,
        joursRestants: 0,
        finLe: null,
        abonnement: false,
      };
    }

    if (!salon || salon.abonnement_actif) {
      return {
        actif: false,
        expire: false,
        suspendu: false,
        joursRestants: 0,
        finLe: null,
        abonnement: true,
      };
    }

    const fin = new Date(salon.trial_ends_at).getTime();
    const restantMs = fin - Date.now();
    return {
      actif: true,
      expire: restantMs <= 0,
      suspendu: false,
      joursRestants: Math.max(0, Math.ceil(restantMs / 86_400_000)),
      finLe: salon.trial_ends_at,
      abonnement: false,
    };
  });
