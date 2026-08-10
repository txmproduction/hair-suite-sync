/**
 * Catalogue des types de prestations proposés dans la recherche.
 * Volontairement indépendant de ce qui existe déjà en base : on propose aussi
 * des prestations pas encore disponibles, les salons correspondants étant
 * référencés au fur et à mesure.
 */
export type TypePrestation = { nom: string; metier: string };

export const CATALOGUE_PRESTATIONS: TypePrestation[] = [
  // Coiffure
  { nom: "Coupe femme", metier: "Coiffeur" },
  { nom: "Coupe homme", metier: "Coiffeur" },
  { nom: "Coupe enfant", metier: "Coiffeur" },
  { nom: "Brushing", metier: "Coiffeur" },
  { nom: "Coloration", metier: "Coiffeur" },
  { nom: "Balayage", metier: "Coiffeur" },
  { nom: "Mèches", metier: "Coiffeur" },
  { nom: "Patine", metier: "Coiffeur" },
  { nom: "Lissage brésilien", metier: "Coiffeur" },
  { nom: "Permanente", metier: "Coiffeur" },
  { nom: "Soin capillaire", metier: "Coiffeur" },
  { nom: "Chignon", metier: "Coiffeur" },
  { nom: "Coiffure de mariée", metier: "Coiffeur" },
  { nom: "Extensions capillaires", metier: "Coiffeur" },
  { nom: "Tresses", metier: "Coiffeur" },
  { nom: "Locks", metier: "Coiffeur" },
  { nom: "Défrisage", metier: "Coiffeur" },

  // Barbier
  { nom: "Taille de barbe", metier: "Barbier" },
  { nom: "Rasage traditionnel", metier: "Barbier" },
  { nom: "Dégradé", metier: "Barbier" },
  { nom: "Contours", metier: "Barbier" },
  { nom: "Coupe + barbe", metier: "Barbier" },
  { nom: "Serviette chaude", metier: "Barbier" },

  // Ongles
  { nom: "Manucure", metier: "Manucure" },
  { nom: "Pédicure", metier: "Manucure" },
  { nom: "Beauté des pieds", metier: "Manucure" },
  { nom: "Vernis semi-permanent", metier: "Manucure" },
  { nom: "Pose américaine", metier: "Manucure" },
  { nom: "Pose gel", metier: "Manucure" },
  { nom: "Pose résine", metier: "Manucure" },
  { nom: "Remplissage", metier: "Manucure" },
  { nom: "Nail art", metier: "Manucure" },
  { nom: "Dépose", metier: "Manucure" },

  // Institut de beauté
  { nom: "Soin du visage", metier: "Institut de beauté" },
  { nom: "Nettoyage de peau", metier: "Institut de beauté" },
  { nom: "Peeling", metier: "Institut de beauté" },
  { nom: "Épilation sourcils", metier: "Institut de beauté" },
  { nom: "Épilation visage", metier: "Institut de beauté" },
  { nom: "Épilation jambes", metier: "Institut de beauté" },
  { nom: "Épilation maillot", metier: "Institut de beauté" },
  { nom: "Épilation aisselles", metier: "Institut de beauté" },
  { nom: "Épilation laser", metier: "Institut de beauté" },
  { nom: "Teinture des cils", metier: "Institut de beauté" },
  { nom: "Extensions de cils", metier: "Institut de beauté" },
  { nom: "Rehaussement de cils", metier: "Institut de beauté" },
  { nom: "Restructuration des sourcils", metier: "Institut de beauté" },
  { nom: "Maquillage", metier: "Institut de beauté" },
  { nom: "Maquillage permanent", metier: "Institut de beauté" },
  { nom: "Microblading", metier: "Institut de beauté" },
  { nom: "Bronzage UV", metier: "Institut de beauté" },
  { nom: "Soin anti-âge", metier: "Institut de beauté" },

  // Massage et bien-être
  { nom: "Massage relaxant", metier: "Massage" },
  { nom: "Massage suédois", metier: "Massage" },
  { nom: "Massage californien", metier: "Massage" },
  { nom: "Massage deep tissue", metier: "Massage" },
  { nom: "Massage sportif", metier: "Massage" },
  { nom: "Massage aux pierres chaudes", metier: "Massage" },
  { nom: "Massage balinais", metier: "Massage" },
  { nom: "Massage thaïlandais", metier: "Massage" },
  { nom: "Massage prénatal", metier: "Massage" },
  { nom: "Massage crânien", metier: "Massage" },
  { nom: "Massage du dos", metier: "Massage" },
  { nom: "Drainage lymphatique", metier: "Massage" },
  { nom: "Madérothérapie", metier: "Massage" },
  { nom: "Palper-rouler", metier: "Massage" },
  { nom: "Réflexologie plantaire", metier: "Réflexologue" },
  { nom: "Réflexologie palmaire", metier: "Réflexologue" },
  { nom: "Hammam", metier: "Bien-être" },
  { nom: "Sauna", metier: "Bien-être" },
  { nom: "Spa", metier: "Bien-être" },
  { nom: "Balnéothérapie", metier: "Bien-être" },
  { nom: "Cryothérapie", metier: "Bien-être" },
  { nom: "Yoga", metier: "Bien-être" },

  // Accompagnement
  { nom: "Séance de sophrologie", metier: "Sophrologue" },
  { nom: "Gestion du stress", metier: "Sophrologue" },
  { nom: "Préparation mentale", metier: "Sophrologue" },
  { nom: "Séance d'hypnose", metier: "Hypnothérapeute" },
  { nom: "Arrêt du tabac", metier: "Hypnothérapeute" },
  { nom: "Bilan de vitalité", metier: "Naturopathe" },
  { nom: "Conseil en nutrition", metier: "Naturopathe" },
  { nom: "Séance de coaching", metier: "Coach de vie" },
  { nom: "Bilan de compétences", metier: "Coach de vie" },
];

/** Correspondance métier du catalogue → catégories de salons en base. */
const METIER_VERS_CATEGORIES: Record<string, string[]> = {
  Coiffeur: ["coiffeur", "barbier"],
  Barbier: ["barbier", "coiffeur"],
  Manucure: ["manucure", "institut_beaute"],
  "Institut de beauté": ["institut_beaute"],
  Massage: ["massage", "bien_etre"],
  "Bien-être": ["bien_etre", "massage"],
  Réflexologue: ["reflexologue", "bien_etre"],
  Sophrologue: ["sophrologue"],
  Hypnothérapeute: ["hypnotherapeute"],
  Naturopathe: ["naturopathe"],
  "Coach de vie": ["coach_de_vie"],
};

const sansAccent = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/**
 * Une recherche par prestation ("pose américaine", "coloration"…) ne doit pas
 * dépendre des prestations réellement saisies par les salons : on déduit les
 * catégories de professionnels qui réalisent ce type de soin.
 */
export function categoriesPourPrestation(recherche: string): string[] {
  const terme = sansAccent(recherche);
  if (terme.length < 2) return [];
  const cats = new Set<string>();
  for (const p of CATALOGUE_PRESTATIONS) {
    const nom = sansAccent(p.nom);
    if (nom.includes(terme) || terme.includes(nom)) {
      for (const c of METIER_VERS_CATEGORIES[p.metier] ?? []) cats.add(c);
    }
  }
  return [...cats];
}
