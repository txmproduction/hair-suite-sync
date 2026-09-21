/**
 * Limites de l'essai gratuit et libellés du comparatif.
 * Les seuils sont également appliqués en base (triggers `securite.*`).
 */

export const LIMITES_ESSAI = {
  employes: 2,
  rdvParMois: 60,
  acomptes: false,
} as const;

/** Codes d'erreur levés par les garde-fous de la base de données. */
export const CODES_LIMITE = {
  HT_LIMITE_EMPLOYES: {
    titre: "Collaborateurs illimités avec l'abonnement complet",
    texte: `Pendant l'essai gratuit, vous pouvez gérer ${LIMITES_ESSAI.employes} collaborateurs. L'abonnement complet supprime cette limite.`,
  },
  HT_LIMITE_RDV: {
    titre: "Rendez-vous illimités avec l'abonnement complet",
    texte: `L'essai gratuit est limité à ${LIMITES_ESSAI.rdvParMois} rendez-vous par mois. L'abonnement complet supprime cette limite.`,
  },
  HT_ACOMPTE_ABONNEMENT: {
    titre: "L'acompte en ligne est réservé à l'abonnement complet",
    texte:
      "Demandez un acompte à la réservation pour limiter les rendez-vous non honorés. Cette fonctionnalité s'active avec l'abonnement complet.",
  },
} as const;

export type CodeLimite = keyof typeof CODES_LIMITE;

/** Retrouve un code de limite dans un message d'erreur base de données. */
export function codeLimiteDe(message: unknown): CodeLimite | null {
  const texte = typeof message === "string" ? message : String((message as Error)?.message ?? "");
  return (Object.keys(CODES_LIMITE) as CodeLimite[]).find((c) => texte.includes(c)) ?? null;
}

export type LigneComparatif = {
  libelle: string;
  essai: string | boolean;
  complet: string | boolean;
};

export const COMPARATIF: LigneComparatif[] = [
  { libelle: "Agenda jour et semaine", essai: true, complet: true },
  { libelle: "Caisse et encaissements", essai: true, complet: true },
  { libelle: "Fichier clients et historique", essai: true, complet: true },
  { libelle: "Statistiques et export CSV", essai: true, complet: true },
  { libelle: "Fiche publique et réservation en ligne", essai: true, complet: true },
  {
    libelle: "Collaborateurs",
    essai: `${LIMITES_ESSAI.employes} maximum`,
    complet: "Illimité",
  },
  {
    libelle: "Rendez-vous par mois",
    essai: `${LIMITES_ESSAI.rdvParMois} maximum`,
    complet: "Illimité",
  },
  { libelle: "Acompte en ligne à la réservation", essai: false, complet: true },
  { libelle: "Notifications et rappels", essai: true, complet: true },
  { libelle: "Support par e-mail", essai: true, complet: true },
];
