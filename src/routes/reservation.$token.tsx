import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { annulerReservationFn, reservationFn } from "@/lib/reservation.functions";
import type { RecapReservationData } from "@/lib/reservation-types";
import { euro, heureFR } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import logo from "@/assets/logo-light.png";
import { CalendarCheck, CircleAlert, Clock3, XCircle } from "lucide-react";

export const Route = createFileRoute("/reservation/$token")({
  loader: ({ params }) => reservationFn({ data: { token: params.token } }),
  head: () => ({
    meta: [
      { title: "Votre rendez-vous — HairTrack" },
      {
        name: "description",
        content:
          "Récapitulatif de votre rendez-vous réservé en ligne : prestation, praticien, date et acompte, avec possibilité d'annulation.",
      },
      { property: "og:title", content: "Votre rendez-vous — HairTrack" },
      {
        property: "og:description",
        content: "Récapitulatif et annulation de votre rendez-vous réservé en ligne.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  errorComponent: () => <Coquille>Réservation introuvable.</Coquille>,
  notFoundComponent: () => <Coquille>Réservation introuvable.</Coquille>,
  component: PageConfirmation,
});

function Coquille({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <img src={logo} alt="HairTrack" className="h-7 w-auto" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
    </div>
  );
}

const LIBELLES: Record<string, string> = {
  a_venir: "Confirmé",
  en_attente_paiement: "En attente de paiement de l'acompte",
  venu: "Terminé",
  no_show: "Non honoré",
  annule: "Annulé",
};

function PageConfirmation() {
  const initial = Route.useLoaderData() as RecapReservationData | null;
  const { token } = Route.useParams();
  const annuler = useServerFn(annulerReservationFn);
  const [recap, setRecap] = useState<RecapReservationData | null>(initial);
  const [envoi, setEnvoi] = useState(false);

  if (!recap) return <Coquille>Réservation introuvable.</Coquille>;

  const date = new Date(recap.debut);
  const annule = recap.statut === "annule";

  async function lancerAnnulation() {
    setEnvoi(true);
    try {
      const maj = await annuler({ data: { token } });
      setRecap(maj as RecapReservationData);
      toast.success("Rendez-vous annulé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Annulation impossible");
    }
    setEnvoi(false);
  }

  return (
    <Coquille>
      <div className="card-soft space-y-4 p-6">
        <div className="flex items-start gap-3">
          {annule ? (
            <XCircle className="mt-1 h-6 w-6 text-muted-foreground" />
          ) : (
            <CalendarCheck className="mt-1 h-6 w-6 text-gold-foreground" />
          )}
          <div>
            <h1 className="text-xl font-semibold">
              {annule
                ? "Rendez-vous annulé"
                : recap.statut === "en_attente_paiement"
                  ? "Rendez-vous en attente de paiement"
                  : "Rendez-vous confirmé"}
            </h1>
            <p className="text-sm text-muted-foreground">{recap.salon.nom}</p>
          </div>
        </div>

        <dl className="space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Date</dt>
            <dd className="font-medium">
              {date.toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              à {heureFR(recap.debut)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Prestation</dt>
            <dd className="font-medium">
              {recap.prestation} · {recap.duree_min} min
            </dd>
          </div>
          {recap.employe && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Praticien</dt>
              <dd className="font-medium">{recap.employe}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Prix</dt>
            <dd className="font-medium">{euro(recap.prix)}</dd>
          </div>
          {recap.acompte > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Acompte</dt>
              <dd className="font-medium">{euro(recap.acompte)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Statut</dt>
            <dd className="font-medium">{LIBELLES[recap.statut] ?? recap.statut}</dd>
          </div>
          {recap.salon.adresse && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Adresse</dt>
              <dd className="font-medium">{recap.salon.adresse}</dd>
            </div>
          )}
        </dl>

        {!annule && (
          <div className="border-t border-border pt-4">
            {recap.annulation_possible ? (
              <>
                <Button variant="outline" onClick={lancerAnnulation} disabled={envoi}>
                  Annuler mon rendez-vous
                </Button>
                <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock3 className="h-3 w-3" /> Annulation gratuite jusqu'à{" "}
                  {recap.delai_annulation_h} h avant le rendez-vous.
                </p>
              </>
            ) : (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                Le délai d'annulation en ligne ({recap.delai_annulation_h} h) est dépassé. Appelez le
                salon {recap.salon.telephone ? `au ${recap.salon.telephone}` : ""} pour modifier ce
                rendez-vous. L'acompte versé n'est pas remboursé.
              </p>
            )}
          </div>
        )}

        {recap.salon.slug && (
          <Link
            to="/reserver/$slug"
            params={{ slug: recap.salon.slug }}
            className="inline-block text-sm underline"
          >
            Prendre un autre rendez-vous
          </Link>
        )}
      </div>
    </Coquille>
  );
}
