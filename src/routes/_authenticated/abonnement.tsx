import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import logo from "@/assets/logo-light.png";
import { PLANS, planPar, prixLisible, STATUTS_ABONNEMENT, type PlanId } from "@/lib/plans";
import {
  creerCheckoutAbonnementFn,
  creerPortailAbonnementFn,
  etatAbonnementFn,
} from "@/lib/abonnement.functions";
import { getStripeEnvironment, paiementConfigure } from "@/lib/stripe";
import { useEtatEssai } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/abonnement")({
  head: () => ({
    meta: [
      { title: "Mon abonnement — HairTrack" },
      {
        name: "description",
        content:
          "Choisissez la formule HairTrack adaptée à votre salon et gérez votre abonnement mensuel en toute autonomie.",
      },
      { property: "og:title", content: "Mon abonnement — HairTrack" },
      {
        property: "og:description",
        content: "Formules Essentiel et Premium pour gérer votre salon avec HairTrack.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PageAbonnement,
});

const dateFR = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export function useEtatAbonnement() {
  return useQuery({
    queryKey: ["abonnement"],
    queryFn: () => etatAbonnementFn(),
    staleTime: 30_000,
  });
}

function PageAbonnement() {
  const { data: abo, isLoading } = useEtatAbonnement();
  const { data: essai } = useEtatEssai();
  const queryClient = useQueryClient();
  const [enCours, setEnCours] = useState<PlanId | "portail" | null>(null);

  const planActuel = planPar(abo?.plan);
  const actif = abo?.statut === "active" || abo?.statut === "trialing";
  const enEchec = abo?.statut === "past_due" || abo?.statut === "unpaid";

  async function souscrire(plan: PlanId) {
    if (!paiementConfigure()) {
      toast.error("Le paiement en ligne n'est pas encore configuré sur cette version.");
      return;
    }
    setEnCours(plan);
    try {
      const res = await creerCheckoutAbonnementFn({
        data: { plan, environment: getStripeEnvironment(), origine: window.location.origin },
      });
      if ("error" in res) throw new Error(res.error);
      window.location.href = res.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'ouvrir le paiement.");
      setEnCours(null);
    }
  }

  async function ouvrirPortail() {
    setEnCours("portail");
    try {
      const res = await creerPortailAbonnementFn({
        data: { environment: getStripeEnvironment(), origine: window.location.origin },
      });
      if ("error" in res) throw new Error(res.error);
      window.open(res.url, "_blank", "noopener");
      await queryClient.invalidateQueries({ queryKey: ["abonnement"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible d'ouvrir la gestion d'abonnement.");
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-3">
          <img src={logo} alt="HairTrack" className="h-8 w-auto" />
          <Button variant="ghost" asChild>
            <Link to="/agenda">Retour à mon espace</Link>
          </Button>
        </div>

        {enEchec && (
          <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Le dernier prélèvement a échoué. Mettez à jour votre carte bancaire depuis la gestion
            d'abonnement pour conserver votre accès.
          </div>
        )}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : actif && planActuel ? (
          <section className="card-soft mb-8 p-6">
            <h1 className="text-2xl font-semibold">Mon abonnement</h1>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Formule</dt>
                <dd className="mt-1 font-medium">
                  {planActuel.nom} — {prixLisible(planActuel.prixCentimes)}/mois
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Statut</dt>
                <dd className="mt-1 font-medium">
                  {STATUTS_ABONNEMENT[abo?.statut ?? ""] ?? abo?.statut}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                  {abo?.resiliationProgrammee ? "Fin d'accès" : "Prochain prélèvement"}
                </dt>
                <dd className="mt-1 font-medium">
                  {abo?.prochainPrelevement ? dateFR(abo.prochainPrelevement) : "—"}
                </dd>
              </div>
            </dl>
            {abo?.resiliationProgrammee && (
              <p className="mt-3 text-sm text-muted-foreground">
                Votre abonnement est résilié à la fin de la période en cours.
              </p>
            )}
            <div className="mt-5">
              <Button onClick={ouvrirPortail} disabled={enCours === "portail"}>
                {enCours === "portail" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-4 w-4" />
                )}
                Gérer mon abonnement
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Changer de formule, mettre à jour la carte, télécharger les factures ou résilier.
              </p>
            </div>
          </section>
        ) : (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold">
              {essai?.expire ? "Votre essai gratuit est terminé" : "Choisissez votre formule"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
              Vos données sont conservées. Activez votre abonnement pour continuer à utiliser
              HairTrack sans restriction. Sans engagement, résiliable à tout moment.
            </p>
            {essai?.actif && !essai.expire && (
              <p className="mt-2 text-sm text-muted-foreground">
                Essai gratuit en cours — {essai.joursRestants} jour
                {essai.joursRestants > 1 ? "s" : ""} restant{essai.joursRestants > 1 ? "s" : ""}.
              </p>
            )}
          </div>
        )}

        {(!actif || !planActuel) && (
          <div className="grid gap-4 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`card-soft flex flex-col p-6 ${
                  plan.id === "premium" ? "ring-1 ring-[hsl(var(--gold))]" : ""
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xl font-semibold">{plan.nom}</h2>
                  {plan.id === "premium" && (
                    <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold-foreground">
                      Recommandé
                    </span>
                  )}
                </div>
                <p className="mt-2 text-3xl font-semibold">
                  {prixLisible(plan.prixCentimes)}
                  <span className="text-base font-normal text-muted-foreground"> /mois</span>
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{plan.accroche}</p>
                <ul className="mt-5 flex-1 space-y-2 text-sm">
                  {plan.fonctionnalites.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6"
                  variant={plan.id === "premium" ? "default" : "outline"}
                  onClick={() => souscrire(plan.id)}
                  disabled={enCours !== null || abo?.gerant === false}
                >
                  {enCours === plan.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Choisir {plan.nom}
                </Button>
              </div>
            ))}
          </div>
        )}

        {abo?.gerant === false && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Seul le gérant du salon peut souscrire ou modifier l'abonnement.
          </p>
        )}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Tarifs TTC. Paiement sécurisé par Stripe. Une question ?
          contact.txmproduction@gmail.com
        </p>
      </div>
    </div>
  );
}
