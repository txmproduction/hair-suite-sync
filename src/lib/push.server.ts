import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { envoyerPush } from "./webpush.server";

export type ChargePush = { titre: string; corps: string; url: string };

/** Envoie une notification push à tous les super-administrateurs abonnés. */
export async function notifierSuperAdmins(charge: ChargePush): Promise<number> {
  try {
    const { data: admins } = await supabaseAdmin.from("super_admins").select("user_id");
    const ids = (admins ?? []).map((a) => a.user_id);
    if (!ids.length) return 0;

    const { data: abonnements } = await supabaseAdmin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", ids);

    let envoyes = 0;
    await Promise.all(
      (abonnements ?? []).map(async (a) => {
        try {
          const statut = await envoyerPush(a, charge);
          if (statut === 404 || statut === 410) {
            await supabaseAdmin.from("push_subscriptions").delete().eq("id", a.id);
          } else if (statut < 300) {
            envoyes++;
          } else {
            console.error(`[push] service push a répondu ${statut}`);
          }
        } catch (erreur) {
          console.error("[push] envoi impossible", erreur);
        }
      }),
    );
    return envoyes;
  } catch (erreur) {
    // Une notification ne doit jamais faire échouer l'action métier.
    console.error("[push] notification super-admin ignorée", erreur);
    return 0;
  }
}
