import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Rattache le compte connecté à la fiche employé créée par son gérant.
 * L'email est lu côté serveur depuis la session vérifiée : le client ne
 * peut pas revendiquer l'invitation de quelqu'un d'autre.
 */
export const reclamerInvitationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ salonId: string | null }> => {
    const { supabase, userId } = context;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const email = user?.email;
    if (!user || !email || !user.email_confirmed_at) return { salonId: null };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("employes")
      .update({ user_id: userId })
      .is("user_id", null)
      .eq("actif", true)
      .ilike("email", email)
      .select("salon_id")
      .maybeSingle();

    if (error) {
      console.error("reclamerInvitation:", error.message);
      return { salonId: null };
    }
    return { salonId: data?.salon_id ?? null };
  });
