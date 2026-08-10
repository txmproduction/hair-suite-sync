import { createFileRoute } from "@tanstack/react-router";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";

export const Route = createFileRoute("/cgv")({
  head: () => ({
    meta: [
      { title: "Conditions générales — réservation et acomptes | HairTrack" },
      {
        name: "description",
        content:
          "Conditions générales d'utilisation et de vente HairTrack : réservation en ligne, acompte, annulation, retard et responsabilités du salon comme du client.",
      },
      { property: "og:title", content: "Conditions générales — HairTrack" },
      {
        property: "og:description",
        content: "Règles de réservation, d'acompte et d'annulation sur HairTrack.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hairtrack.fr/cgv" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://hairtrack.fr/cgv" }],
  }),
  component: Cgv,
});

const SECTIONS = [
  {
    titre: "1. Objet",
    texte:
      "Les présentes conditions encadrent l'utilisation de la plateforme HairTrack, qui permet de réserver un rendez-vous auprès d'un salon indépendant référencé et, le cas échéant, de régler un acompte en ligne.",
  },
  {
    titre: "2. Réservation",
    texte:
      "La réservation est confirmée dès l'affichage du récapitulatif et, lorsqu'un acompte est demandé, dès l'encaissement de celui-ci. Le client s'engage à fournir des coordonnées exactes afin d'être joignable par le salon.",
  },
  {
    titre: "3. Acompte",
    texte:
      "Chaque salon fixe librement le montant ou le pourcentage d'acompte associé à ses prestations. L'acompte est déduit du montant réglé sur place à la fin du rendez-vous. Il est conservé par le salon en cas d'absence non annulée dans les délais.",
  },
  {
    titre: "4. Annulation et modification",
    texte:
      "Le client peut annuler gratuitement depuis le lien reçu à la réservation, dans le délai fixé par le salon (affiché sur sa fiche et dans le récapitulatif). Passé ce délai, l'annulation se fait directement auprès du salon et l'acompte peut rester acquis.",
  },
  {
    titre: "5. Retard",
    texte:
      "En cas de retard important, le salon peut être contraint d'écourter ou de reporter la prestation afin de respecter les rendez-vous suivants.",
  },
  {
    titre: "6. Avis clients",
    texte:
      "Les avis sont réservés aux clients ayant effectivement honoré un rendez-vous. Les contenus injurieux, diffamatoires ou hors sujet peuvent être retirés.",
  },
  {
    titre: "7. Responsabilité",
    texte:
      "HairTrack fournit l'outil de réservation et de gestion. La prestation, son contenu et sa qualité relèvent de la seule responsabilité du salon qui la réalise.",
  },
  {
    titre: "8. Droit applicable",
    texte:
      "Les présentes conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée avant toute action judiciaire.",
  },
];

function Cgv() {
  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-semibold">Conditions générales</h1>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
          {SECTIONS.map((s) => (
            <section key={s.titre}>
              <h2 className="text-lg font-semibold text-foreground">{s.titre}</h2>
              <p className="mt-2">{s.texte}</p>
            </section>
          ))}
        </div>
      </main>
      <PiedPublic />
    </div>
  );
}
