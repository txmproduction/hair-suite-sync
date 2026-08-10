import { createFileRoute } from "@tanstack/react-router";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

async function validerAcompte(session: any) {
  const token = session?.metadata?.rdv_token;
  if (!token) {
    console.error("Webhook paiement sans rdv_token");
    return;
  }
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin
    .from("rdv")
    .update({ statut: "a_venir", expire_at: null })
    .eq("annulation_token", token)
    .eq("statut", "en_attente_paiement");
  if (error) console.error("Maj RDV après paiement:", error.message);
}

async function traiter(request: Request, env: StripeEnv) {
  const event = await verifyWebhook(request, env);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status !== "unpaid") await validerAcompte(session);
      break;
    }
    case "checkout.session.async_payment_succeeded":
      await validerAcompte(event.data.object);
      break;
    case "checkout.session.async_payment_failed":
      console.log("Paiement d'acompte échoué", event.data.object?.metadata?.rdv_token);
      break;
    default:
      console.log("Événement non traité:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook avec env invalide:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await traiter(request, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
