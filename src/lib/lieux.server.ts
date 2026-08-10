/**
 * Recherche de lieux pour le champ « Où ? ».
 * France (Martinique et DOM inclus) : API officielle geo.api.gouv.fr, gratuite et sans clé.
 * Suisse : liste embarquée des principales localités (pas d'API publique équivalente).
 */

export type Lieu = {
  ville: string;
  codePostal: string;
  pays: "FR" | "CH";
  region: string;
};

/** Principales localités suisses, priorité au bassin lémanique et frontalier. */
const LOCALITES_SUISSE: Lieu[] = [
  ["Genève", "1200", "Genève"],
  ["Carouge", "1227", "Genève"],
  ["Meyrin", "1217", "Genève"],
  ["Vernier", "1214", "Genève"],
  ["Lancy", "1212", "Genève"],
  ["Versoix", "1290", "Genève"],
  ["Nyon", "1260", "Vaud"],
  ["Morges", "1110", "Vaud"],
  ["Lausanne", "1000", "Vaud"],
  ["Renens", "1020", "Vaud"],
  ["Vevey", "1800", "Vaud"],
  ["Montreux", "1820", "Vaud"],
  ["Yverdon-les-Bains", "1400", "Vaud"],
  ["Aigle", "1860", "Vaud"],
  ["Monthey", "1870", "Valais"],
  ["Martigny", "1920", "Valais"],
  ["Sion", "1950", "Valais"],
  ["Sierre", "3960", "Valais"],
  ["Verbier", "1936", "Valais"],
  ["Fribourg", "1700", "Fribourg"],
  ["Bulle", "1630", "Fribourg"],
  ["Neuchâtel", "2000", "Neuchâtel"],
  ["La Chaux-de-Fonds", "2300", "Neuchâtel"],
  ["Delémont", "2800", "Jura"],
  ["Bienne", "2500", "Berne"],
  ["Berne", "3000", "Berne"],
  ["Thoune", "3600", "Berne"],
  ["Interlaken", "3800", "Berne"],
  ["Bâle", "4000", "Bâle"],
  ["Olten", "4600", "Soleure"],
  ["Soleure", "4500", "Soleure"],
  ["Aarau", "5000", "Argovie"],
  ["Baden", "5400", "Argovie"],
  ["Lucerne", "6000", "Lucerne"],
  ["Zoug", "6300", "Zoug"],
  ["Bellinzone", "6500", "Tessin"],
  ["Lugano", "6900", "Tessin"],
  ["Locarno", "6600", "Tessin"],
  ["Coire", "7000", "Grisons"],
  ["Davos", "7270", "Grisons"],
  ["Saint-Moritz", "7500", "Grisons"],
  ["Zurich", "8000", "Zurich"],
  ["Winterthour", "8400", "Zurich"],
  ["Uster", "8610", "Zurich"],
  ["Schaffhouse", "8200", "Schaffhouse"],
  ["Saint-Gall", "9000", "Saint-Gall"],
  ["Rapperswil", "8640", "Saint-Gall"],
  ["Frauenfeld", "8500", "Thurgovie"],
].map(([ville, codePostal, region]) => ({
  ville: ville as string,
  codePostal: codePostal as string,
  pays: "CH" as const,
  region: region as string,
}));

const sansAccents = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

type CommuneApi = {
  nom: string;
  codesPostaux?: string[];
  departement?: { nom?: string; code?: string };
};

async function appelerGeoApi(url: string): Promise<CommuneApi[]> {
  try {
    const reponse = await fetch(url, { headers: { accept: "application/json" } });
    if (!reponse.ok) return [];
    const donnees = (await reponse.json()) as CommuneApi[];
    return Array.isArray(donnees) ? donnees : [];
  } catch {
    // Le référentiel externe est indisponible : on renverra simplement la Suisse.
    return [];
  }
}

export async function rechercherLieux(q: string): Promise<Lieu[]> {
  const terme = q.trim();
  if (terme.length < 2) return [];

  const estNumerique = /^\d+$/.test(terme);
  let communes: CommuneApi[] = [];

  if (estNumerique) {
    // Un code postal se cherche par préfixe : on passe par le département
    // (les DOM comme la Martinique ont un code sur 3 chiffres).
    const departement = terme.startsWith("97") ? terme.slice(0, 3) : terme.slice(0, 2);
    communes = await appelerGeoApi(
      `https://geo.api.gouv.fr/departements/${departement}/communes?fields=nom,codesPostaux,departement`,
    );
  } else {
    communes = await appelerGeoApi(
      `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(terme)}&fields=nom,codesPostaux,departement&boost=population&limit=25`,
    );
  }

  const lieuxFr: Lieu[] = [];
  for (const c of communes) {
    for (const cp of c.codesPostaux ?? []) {
      if (estNumerique && !cp.startsWith(terme)) continue;
      lieuxFr.push({
        ville: c.nom,
        codePostal: cp,
        pays: "FR",
        region: c.departement?.nom ?? "",
      });
    }
  }

  const t = sansAccents(terme);
  const lieuxCh = LOCALITES_SUISSE.filter((l) =>
    estNumerique ? l.codePostal.startsWith(terme) : sansAccents(l.ville).includes(t),
  );

  // On classe d'abord les correspondances les plus proches du début du terme.
  const score = (l: Lieu) =>
    estNumerique
      ? l.codePostal.startsWith(terme)
        ? 0
        : 1
      : sansAccents(l.ville).startsWith(t)
        ? 0
        : 1;

  return [...lieuxFr, ...lieuxCh]
    .sort((a, b) => score(a) - score(b) || a.codePostal.localeCompare(b.codePostal))
    .slice(0, 12);
}
