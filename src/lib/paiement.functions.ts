import { createServerFn } from "@tanstack/react-start";

type SessionAcompteResult = { clientSecret: string } | { error: string };

export const creerSessionAcompteFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { token: string; returnUrl: string; environment: "sandbox" | "live" }) => {
      const token = String(data.token ?? "");
      if (!/^[a-zA-Z0-9_-]{10,60}$/.test(token)) throw new Error("Réservation introuvable.");
      const returnUrl = String(data.returnUrl ?? "");
      if (!/^https?:\/\//.test(returnUrl)) throw new Error("URL de retour invalide.");
      if (data.environment !== "sandbox" && data.environment !== "live")
        throw new Error("Environnement de paiement invalide.");
      return { token, returnUrl: returnUrl.slice(0, 500), environment: data.environment };
    },
  )
  .handler(async ({ data }): Promise<SessionAcompteResult> => {
    const { createStripeClient, getStripeErrorMessage } = await import("@/lib/stripe.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rdv } = await supabaseAdmin
      .from("rdv")
      .select("id, statut, acompte, debut, annulation_token, prestations(nom), salons(nom)")
      .eq("annulation_token", data.token)
      .maybeSingle();

    if (!rdv) return { error: "Réservation introuvable." };
    if (rdv.statut !== "en_attente_paiement")
      return { error: "Cette réservation n'attend pas de paiement." };

    const montant = Math.round(Number(rdv.acompte) * 100);
    if (montant < 50) return { error: "Montant d'acompte trop faible pour un paiement en ligne." };

    const libelle = `Acompte — ${rdv.prestations?.nom ?? "prestation"} (${
      rdv.salons?.nom ?? "salon"
    })`;

    try {
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded_page",
        return_url: data.returnUrl,
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: libelle },
              unit_amount: montant,
            },
            quantity: 1,
          },
        ],
        payment_intent_data: { description: libelle },
        metadata: { rdv_token: rdv.annulation_token, rdv_id: rdv.id },
      });
      // On mémorise la session pour pouvoir vérifier le paiement au retour,
      // sans dépendre uniquement du webhook Stripe.
      await supabaseAdmin.from("rdv").update({ paiement_ref: session.id }).eq("id", rdv.id);
      return { clientSecret: session.client_secret ?? "" };

    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/**
 * Vérifie directement auprès de Stripe si l'acompte a été réglé et confirme
 * le rendez-vous. Filet de sécurité si le webhook n'est pas encore arrivé.
 */
export const verifierAcompteFn = createServerFn({ method: "POST" })
  .inputValidator((data: { token: string; environment: "sandbox" | "live" }) => {
    const token = String(data.token ?? "");
    if (!/^[a-zA-Z0-9_-]{10,60}$/.test(token)) throw new Error("Réservation introuvable.");
    if (data.environment !== "sandbox" && data.environment !== "live")
      throw new Error("Environnement de paiement invalide.");
    return { token, environment: data.environment };
  })
  .handler(async ({ data }): Promise<{ statut: string; paye: boolean }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rdv } = await supabaseAdmin
      .from("rdv")
      .select("id, statut, paiement_ref")
      .eq("annulation_token", data.token)
      .maybeSingle();

    if (!rdv) return { statut: "inconnu", paye: false };
    if (rdv.statut !== "en_attente_paiement")
      return { statut: rdv.statut, paye: rdv.statut === "a_venir" };
    if (!rdv.paiement_ref) return { statut: rdv.statut, paye: false };

    try {
      const { createStripeClient } = await import("@/lib/stripe.server");
      const stripe = createStripeClient(data.environment);
      const session = await stripe.checkout.sessions.retrieve(rdv.paiement_ref);
      if (session.payment_status === "unpaid") return { statut: rdv.statut, paye: false };

      const { error } = await supabaseAdmin
        .from("rdv")
        .update({ statut: "a_venir", expire_at: null })
        .eq("id", rdv.id)
        .eq("statut", "en_attente_paiement");
      if (error) return { statut: rdv.statut, paye: false };
      return { statut: "a_venir", paye: true };
    } catch {
      return { statut: rdv.statut, paye: false };
    }
  });
