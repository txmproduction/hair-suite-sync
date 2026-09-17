/** Traitement serveur des événements Stripe Billing (abonnements HairTrack). */
import type { StripeEnv } from "@/lib/stripe.server";

const ACCES_COMPLET = new Set(["active", "trialing", "past_due"]);

function iso(seconds: unknown): string | null {
  const n = Number(seconds);
  return Number.isFinite(n) && n > 0 ? new Date(n * 1000).toISOString() : null;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Retrouve l'identifiant d'abonnement quel que soit le format de facture. */
function subscriptionIdDeFacture(invoice: any): string | null {
  const direct = invoice?.subscription;
  if (typeof direct === "string") return direct;
  if (direct?.id) return direct.id;
  const parent = invoice?.parent?.subscription_details?.subscription;
  if (typeof parent === "string") return parent;
  if (parent?.id) return parent.id;
  const ligne = invoice?.lines?.data?.[0]?.parent?.subscription_item_details?.subscription;
  return typeof ligne === "string" ? ligne : (ligne?.id ?? null);
}

async function majSalon(salonId: string, actif: boolean) {
  const db = await admin();
  await db.from("salons").update({ abonnement_actif: actif }).eq("id", salonId);
}

/** Crée ou met à jour la ligne d'abonnement du salon. */
export async function enregistrerAbonnement(subscription: any, env: StripeEnv) {
  const salonId = subscription?.metadata?.salon_id;
  if (!salonId) {
    console.log("Abonnement Stripe sans salon_id, ignoré:", subscription?.id);
    return;
  }
  const plan = subscription?.metadata?.plan === "premium" ? "premium" : "essentiel";
  const item = subscription?.items?.data?.[0];
  const fin = iso(item?.current_period_end ?? subscription?.current_period_end);
  const statut = String(subscription?.status ?? "active");

  const db = await admin();
  const { data: existant } = await db
    .from("subscriptions")
    .select("id")
    .eq("salon_id", salonId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const valeurs = {
    salon_id: salonId,
    plan,
    statut,
    stripe_customer_id:
      typeof subscription?.customer === "string"
        ? subscription.customer
        : (subscription?.customer?.id ?? null),
    stripe_subscription_id: subscription?.id ?? null,
    current_period_end: fin,
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    environment: env,
    updated_at: new Date().toISOString(),
  };

  const { error } = existant
    ? await db.from("subscriptions").update(valeurs).eq("id", existant.id)
    : await db.from("subscriptions").insert(valeurs);
  if (error) console.error("Enregistrement abonnement:", error.message);

  await majSalon(salonId, ACCES_COMPLET.has(statut));
}

/** Facture réglée : confirme le renouvellement et la prochaine échéance. */
export async function facturePayee(invoice: any, env: StripeEnv) {
  const subId = subscriptionIdDeFacture(invoice);
  if (!subId) return;
  const db = await admin();
  const { data: abo } = await db
    .from("subscriptions")
    .select("id, salon_id")
    .eq("stripe_subscription_id", subId)
    .maybeSingle();
  if (!abo) return;

  const fin =
    iso(invoice?.lines?.data?.[0]?.period?.end) ?? iso(invoice?.period_end);

  await db
    .from("subscriptions")
    .update({
      statut: "active",
      ...(fin ? { current_period_end: fin } : {}),
      environment: env,
      updated_at: new Date().toISOString(),
    })
    .eq("id", abo.id);
  await majSalon(abo.salon_id, true);
}

/** Paiement échoué : le salon passe en « past_due » (bannière d'alerte). */
export async function facturEchouee(invoice: any) {
  const subId = subscriptionIdDeFacture(invoice);
  if (!subId) return;
  const db = await admin();
  await db
    .from("subscriptions")
    .update({ statut: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subId);
}

/** Abonnement résilié : retour à l'accès limité. */
export async function abonnementResilie(subscription: any) {
  const db = await admin();
  const { data: abo } = await db
    .from("subscriptions")
    .select("id, salon_id")
    .eq("stripe_subscription_id", subscription?.id ?? "")
    .maybeSingle();
  if (!abo) return;
  await db
    .from("subscriptions")
    .update({ statut: "canceled", updated_at: new Date().toISOString() })
    .eq("id", abo.id);
  await majSalon(abo.salon_id, false);
}
