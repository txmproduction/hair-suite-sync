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
      return { clientSecret: session.client_secret ?? "" };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
