import { createFileRoute } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";

export const Route = createFileRoute("/mentions-legales")({
  head: () => ({
    meta: [
      { title: "Mentions légales — HairTrack" },
      {
        name: "description",
        content:
          "Éditeur, hébergement, propriété intellectuelle et traitement des données personnelles de la plateforme de réservation HairTrack.",
      },
      { property: "og:title", content: "Mentions légales — HairTrack" },
      { property: "og:description", content: "Informations légales de la plateforme HairTrack." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hairtrack.fr/mentions-legales" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hairtrack.fr/mentions-legales" }],
  }),
  component: MentionsLegales,
});

function MentionsLegales() {
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Mentions légales</h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">Éditeur du site</h2>
            <p className="mt-2">
              Le site hairtrack.fr est édité par HairTrack. Pour toute question, une demande peut
              être adressée par email à contact@hairtrack.fr. Les coordonnées complètes de
              l'éditeur (forme juridique, siège social, numéro d'immatriculation) sont à compléter
              par l'exploitant avant la mise en production définitive.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Hébergement</h2>
            <p className="mt-2">
              Le site est hébergé sur une infrastructure cloud située dans l'Union européenne. Les
              données de réservation sont stockées dans une base de données gérée, avec chiffrement
              en transit.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Rôle de la plateforme</h2>
            <p className="mt-2">
              HairTrack est un outil de mise en relation et de gestion de rendez-vous. Les
              prestations sont réalisées par les salons indépendants référencés, seuls responsables
              de leurs tarifs, de leurs horaires et de la qualité de leurs services.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Données personnelles</h2>
            <p className="mt-2">
              Les informations transmises lors d'une réservation (nom, téléphone, email) sont
              utilisées uniquement pour la gestion du rendez-vous et sont accessibles au salon
              concerné. Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et
              de suppression de vos données, exerçable par email à contact@hairtrack.fr.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground">Propriété intellectuelle</h2>
            <p className="mt-2">
              La marque HairTrack, son logo et l'ensemble des éléments graphiques du site sont
              protégés. Toute reproduction sans autorisation est interdite.
            </p>
          </section>
        </div>
      </main>
      <PiedPublic />
    </div>
  );
}
