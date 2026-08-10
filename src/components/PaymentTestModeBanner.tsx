const clientToken = import.meta.env['VITE_PAYMENTS_CLIENT_TOKEN'] as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Le paiement en ligne n'est pas encore configuré pour la production.
      </div>
    );
  }
  if (clientToken.startsWith("pk_test_")) {
    return (
      <div className="w-full border-b border-gold/30 bg-gold-soft px-4 py-2 text-center text-sm text-gold-foreground">
        Mode test : aucun paiement réel n'est effectué (carte 4242 4242 4242 4242).
      </div>
    );
  }
  return null;
}
