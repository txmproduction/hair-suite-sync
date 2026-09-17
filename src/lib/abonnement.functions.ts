import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { PLANS, type PlanId } from "@/lib/plans";

export type EtatAbonnement = {
  salonId: string | null;
  gerant: boolean;
  plan: PlanId | null;
  statut: string | null;
  prochainPrelevement: string | null;
  resiliationProgrammee: boolean;
  portailDisponible: boolean;
};

type Environnement = "sandbox" | "live";

function validerEnv(env: unknown): Environnement {
  if (env !== "sandbox" && env !== "live") throw new Error("Environnement de paiement invalide.");
  return env;
}

/** Salon du gérant connecté (l'abonnement est géré par le gérant uniquement). */
async function salonDuMembre(supabase: any, userId: string) {
  const { data } = await supabase
    .from("employes")
    .select("salon_id, role")
    .eq("user_id", userId)
    .eq("actif", true)
    .maybeSingle();
  return data as { salon_id: string; role: string } | null;
}

export const etatAbonnementFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EtatAbonnement> => {
    const membre = await salonDuMembre(context.supabase, context.userId);
    if (!membre) {
      return {
        salonId: null,
        gerant: false,
        plan: null,
        statut: null,
        prochainPrelevement: null,
        resiliationProgrammee: false,
        portailDisponible: false,
      };
    }

    const { data: abo } = await context.supabase
      .from("subscriptions")
      .select("plan, statut, current_period_end, cancel_at_period_end, stripe_customer_id")
      .eq("salon_id", membre.salon_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      salonId: membre.salon_id,
      gerant: membre.role === "gerant",
      plan: (abo?.plan as PlanId | undefined) ?? null,
      statut: abo?.statut ?? null,
      prochainPrelevement: abo?.current_period_end ?? null,
      resiliationProgrammee: Boolean(abo?.cancel_at_period_end),
      portailDisponible: Boolean(abo?.stripe_customer_id),
    };
  });

type LienResult = { url: string } | { error: string };

export const creerCheckoutAbonnementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { plan: PlanId; environment: Environnement; origine: string }) => {
    const plan = PLANS.find((p) => p.id === data.plan);
    if (!plan) throw new Error("Formule inconnue.");
    const origine = String(data.origine ?? "");
    if (!/^https?:\/\//.test(origine)) throw new Error("URL de retour invalide.");
    return {
      plan: plan.id,
      environment: validerEnv(data.environment),
      origine: origine.replace(/\/$/, "").slice(0, 300),
    };
  })
  .handler(async ({ data, context }): Promise<LienResult> => {
    const membre = await salonDuMembre(context.supabase, context.userId);
    if (!membre) return { error: "Aucun salon associé à votre compte." };
    if (membre.role !== "gerant")
      return { error: "Seul le gérant du salon peut souscrire un abonnement." };

    const plan = PLANS.find((p) => p.id === data.plan)!;
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: salon } = await supabaseAdmin
      .from("salons")
      .select("id, nom")
      .eq("id", membre.salon_id)
      .maybeSingle();

    const { data: abo } = await supabaseAdmin
      .from("subscriptions")
      .select("id, stripe_customer_id")
      .eq("salon_id", membre.salon_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const email = (context.claims as { email?: string }).email;

    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        success_url: `${data.origine}/abonnement?checkout=succes`,
        cancel_url: `${data.origine}/abonnement?checkout=annule`,
        ...(abo?.stripe_customer_id
          ? { customer: abo.stripe_customer_id }
          : email
            ? { customer_email: email }
            : {}),
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: plan.prixCentimes,
              recurring: { interval: "month" },
              product_data: { name: `HairTrack ${plan.nom}` },
            },
            quantity: 1,
          },
        ],
        client_reference_id: membre.salon_id,
        metadata: { salon_id: membre.salon_id, plan: plan.id, type: "abonnement_hairtrack" },
        subscription_data: {
          description: `Abonnement HairTrack ${plan.nom} — ${salon?.nom ?? "salon"}`,
          metadata: { salon_id: membre.salon_id, plan: plan.id, type: "abonnement_hairtrack" },
        },
      });
      if (!session.url) return { error: "Stripe n'a pas renvoyé de page de paiement." };
      return { url: session.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

export const creerPortailAbonnementFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: Environnement; origine: string }) => {
    const origine = String(data.origine ?? "");
    if (!/^https?:\/\//.test(origine)) throw new Error("URL de retour invalide.");
    return {
      environment: validerEnv(data.environment),
      origine: origine.replace(/\/$/, "").slice(0, 300),
    };
  })
  .handler(async ({ data, context }): Promise<LienResult> => {
    const membre = await salonDuMembre(context.supabase, context.userId);
    if (!membre) return { error: "Aucun salon associé à votre compte." };
    if (membre.role !== "gerant")
      return { error: "Seul le gérant du salon peut gérer l'abonnement." };

    const { data: abo } = await context.supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("salon_id", membre.salon_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!abo?.stripe_customer_id) return { error: "Aucun abonnement à gérer pour le moment." };

    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    try {
      const stripe = createStripeClient(data.environment);
      const portail = await stripe.billingPortal.sessions.create({
        customer: abo.stripe_customer_id,
        return_url: `${data.origine}/abonnement`,
      });
      return { url: portail.url };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
