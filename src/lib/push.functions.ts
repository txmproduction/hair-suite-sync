import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Clé publique VAPID exposée au frontend (publique par nature). */
export const clePubliquePushFn = createServerFn({ method: "GET" }).handler(async () => {
  return { cle: process.env["VAPID_PUBLIC_KEY"] ?? null };
});

export const enregistrerPushFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { endpoint: string; p256dh: string; auth: string; userAgent?: string }) => {
    const endpoint = String(data.endpoint ?? "").trim();
    if (!/^https:\/\//.test(endpoint)) throw new Error("Abonnement push invalide.");
    const p256dh = String(data.p256dh ?? "").trim();
    const auth = String(data.auth ?? "").trim();
    if (!p256dh || !auth) throw new Error("Clés d'abonnement manquantes.");
    return {
      endpoint: endpoint.slice(0, 1000),
      p256dh,
      auth,
      userAgent: String(data.userAgent ?? "").slice(0, 300) || null,
    };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("push_subscriptions").upsert(
      {
        user_id: context.userId,
        endpoint: data.endpoint,
        p256dh: data.p256dh,
        auth: data.auth,
        user_agent: data.userAgent,
      },
      { onConflict: "endpoint" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const supprimerPushFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { endpoint: string }) => ({
    endpoint: String(data.endpoint ?? "").slice(0, 1000),
  }))
  .handler(async ({ data, context }) => {
    await context.supabase.from("push_subscriptions").delete().eq("endpoint", data.endpoint);
    return { ok: true };
  });

export const etatPushFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    return { abonnements: count ?? 0 };
  });

/** Notifie les super-admins de la création d'un nouveau salon. */
export const notifierNouveauSalonFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { salonId: string }) => ({ salonId: String(data.salonId ?? "") }))
  .handler(async ({ data, context }) => {
    const { data: salon } = await context.supabase
      .from("salons")
      .select("nom, slug, gerant_user_id")
      .eq("id", data.salonId)
      .maybeSingle();
    if (!salon || salon.gerant_user_id !== context.userId) return { ok: false };
    const { notifierSuperAdmins } = await import("./push.server");
    await notifierSuperAdmins({
      titre: "Nouveau salon référencé",
      corps: `Nouveau salon référencé : ${salon.nom}`,
      url: "/super-admin",
    });
    return { ok: true };
  });
