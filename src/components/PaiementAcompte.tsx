import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { creerSessionAcompteFn } from "@/lib/paiement.functions";

export function PaiementAcompte({ token, returnUrl }: { token: string; returnUrl: string }) {
  const fetchClientSecret = async (): Promise<string> => {
    const result = await creerSessionAcompteFn({
      data: { token, returnUrl, environment: getStripeEnvironment() },
    });
    if ("error" in result) throw new Error(result.error);
    if (!result.clientSecret) throw new Error("Stripe n'a pas renvoyé de session de paiement.");
    return result.clientSecret;
  };

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
