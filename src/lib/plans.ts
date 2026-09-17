export type PlanId = "essentiel" | "premium";

export type Plan = {
  id: PlanId;
  nom: string;
  /** Prix mensuel en centimes d'euro (tarifs provisoires, ajustables). */
  prixCentimes: number;
  accroche: string;
  fonctionnalites: string[];
};

export const PLANS: Plan[] = [
  {
    id: "essentiel",
    nom: "Essentiel",
    prixCentimes: 2900,
    accroche: "Tout le nécessaire pour gérer votre salon au quotidien.",
    fonctionnalites: [
      "Agenda jour et semaine, illimité",
      "Caisse et encaissements",
      "Fichier clients et historique",
      "Fiche salon publique sur HairTrack",
      "Jusqu'à 3 collaborateurs",
    ],
  },
  {
    id: "premium",
    nom: "Premium",
    prixCentimes: 5900,
    accroche: "Pour développer votre activité et automatiser la réservation.",
    fonctionnalites: [
      "Tout l'Essentiel, sans limite de collaborateurs",
      "Réservation en ligne 24/7",
      "Acomptes en ligne à la réservation",
      "Notifications push et rappels",
      "Statistiques avancées et export CSV",
      "Avis clients et mise en avant dans l'annuaire",
    ],
  },
];

export const planPar = (id: string | null | undefined): Plan | undefined =>
  PLANS.find((p) => p.id === id);

export const prixLisible = (centimes: number) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: centimes % 100 === 0 ? 0 : 2,
  }).format(centimes / 100);

export const STATUTS_ABONNEMENT: Record<string, string> = {
  trialing: "Période d'essai",
  active: "Actif",
  past_due: "Paiement en échec",
  unpaid: "Paiement en échec",
  incomplete: "Paiement à finaliser",
  canceled: "Résilié",
};
