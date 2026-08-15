// Référentiel des départements français (métropole + outre-mer, dont la Martinique).
// Sert à construire les pages métier × département et l'index des villes,
// à partir du code postal réel des fiches en base.

export type Departement = { code: string; nom: string; slug: string };

export const DEPARTEMENTS: Departement[] = [
  { code: "01", nom: "Ain", slug: "ain" },
  { code: "02", nom: "Aisne", slug: "aisne" },
  { code: "03", nom: "Allier", slug: "allier" },
  { code: "04", nom: "Alpes-de-Haute-Provence", slug: "alpes-de-haute-provence" },
  { code: "05", nom: "Hautes-Alpes", slug: "hautes-alpes" },
  { code: "06", nom: "Alpes-Maritimes", slug: "alpes-maritimes" },
  { code: "07", nom: "Ardèche", slug: "ardeche" },
  { code: "08", nom: "Ardennes", slug: "ardennes" },
  { code: "09", nom: "Ariège", slug: "ariege" },
  { code: "10", nom: "Aube", slug: "aube" },
  { code: "11", nom: "Aude", slug: "aude" },
  { code: "12", nom: "Aveyron", slug: "aveyron" },
  { code: "13", nom: "Bouches-du-Rhône", slug: "bouches-du-rhone" },
  { code: "14", nom: "Calvados", slug: "calvados" },
  { code: "15", nom: "Cantal", slug: "cantal" },
  { code: "16", nom: "Charente", slug: "charente" },
  { code: "17", nom: "Charente-Maritime", slug: "charente-maritime" },
  { code: "18", nom: "Cher", slug: "cher" },
  { code: "19", nom: "Corrèze", slug: "correze" },
  { code: "2A", nom: "Corse-du-Sud", slug: "corse-du-sud" },
  { code: "2B", nom: "Haute-Corse", slug: "haute-corse" },
  { code: "21", nom: "Côte-d'Or", slug: "cote-d-or" },
  { code: "22", nom: "Côtes-d'Armor", slug: "cotes-d-armor" },
  { code: "23", nom: "Creuse", slug: "creuse" },
  { code: "24", nom: "Dordogne", slug: "dordogne" },
  { code: "25", nom: "Doubs", slug: "doubs" },
  { code: "26", nom: "Drôme", slug: "drome" },
  { code: "27", nom: "Eure", slug: "eure" },
  { code: "28", nom: "Eure-et-Loir", slug: "eure-et-loir" },
  { code: "29", nom: "Finistère", slug: "finistere" },
  { code: "30", nom: "Gard", slug: "gard" },
  { code: "31", nom: "Haute-Garonne", slug: "haute-garonne" },
  { code: "32", nom: "Gers", slug: "gers" },
  { code: "33", nom: "Gironde", slug: "gironde" },
  { code: "34", nom: "Hérault", slug: "herault" },
  { code: "35", nom: "Ille-et-Vilaine", slug: "ille-et-vilaine" },
  { code: "36", nom: "Indre", slug: "indre" },
  { code: "37", nom: "Indre-et-Loire", slug: "indre-et-loire" },
  { code: "38", nom: "Isère", slug: "isere" },
  { code: "39", nom: "Jura", slug: "jura" },
  { code: "40", nom: "Landes", slug: "landes" },
  { code: "41", nom: "Loir-et-Cher", slug: "loir-et-cher" },
  { code: "42", nom: "Loire", slug: "loire" },
  { code: "43", nom: "Haute-Loire", slug: "haute-loire" },
  { code: "44", nom: "Loire-Atlantique", slug: "loire-atlantique" },
  { code: "45", nom: "Loiret", slug: "loiret" },
  { code: "46", nom: "Lot", slug: "lot" },
  { code: "47", nom: "Lot-et-Garonne", slug: "lot-et-garonne" },
  { code: "48", nom: "Lozère", slug: "lozere" },
  { code: "49", nom: "Maine-et-Loire", slug: "maine-et-loire" },
  { code: "50", nom: "Manche", slug: "manche" },
  { code: "51", nom: "Marne", slug: "marne" },
  { code: "52", nom: "Haute-Marne", slug: "haute-marne" },
  { code: "53", nom: "Mayenne", slug: "mayenne" },
  { code: "54", nom: "Meurthe-et-Moselle", slug: "meurthe-et-moselle" },
  { code: "55", nom: "Meuse", slug: "meuse" },
  { code: "56", nom: "Morbihan", slug: "morbihan" },
  { code: "57", nom: "Moselle", slug: "moselle" },
  { code: "58", nom: "Nièvre", slug: "nievre" },
  { code: "59", nom: "Nord", slug: "nord" },
  { code: "60", nom: "Oise", slug: "oise" },
  { code: "61", nom: "Orne", slug: "orne" },
  { code: "62", nom: "Pas-de-Calais", slug: "pas-de-calais" },
  { code: "63", nom: "Puy-de-Dôme", slug: "puy-de-dome" },
  { code: "64", nom: "Pyrénées-Atlantiques", slug: "pyrenees-atlantiques" },
  { code: "65", nom: "Hautes-Pyrénées", slug: "hautes-pyrenees" },
  { code: "66", nom: "Pyrénées-Orientales", slug: "pyrenees-orientales" },
  { code: "67", nom: "Bas-Rhin", slug: "bas-rhin" },
  { code: "68", nom: "Haut-Rhin", slug: "haut-rhin" },
  { code: "69", nom: "Rhône", slug: "rhone" },
  { code: "70", nom: "Haute-Saône", slug: "haute-saone" },
  { code: "71", nom: "Saône-et-Loire", slug: "saone-et-loire" },
  { code: "72", nom: "Sarthe", slug: "sarthe" },
  { code: "73", nom: "Savoie", slug: "savoie" },
  { code: "74", nom: "Haute-Savoie", slug: "haute-savoie" },
  { code: "75", nom: "Paris", slug: "paris" },
  { code: "76", nom: "Seine-Maritime", slug: "seine-maritime" },
  { code: "77", nom: "Seine-et-Marne", slug: "seine-et-marne" },
  { code: "78", nom: "Yvelines", slug: "yvelines" },
  { code: "79", nom: "Deux-Sèvres", slug: "deux-sevres" },
  { code: "80", nom: "Somme", slug: "somme" },
  { code: "81", nom: "Tarn", slug: "tarn" },
  { code: "82", nom: "Tarn-et-Garonne", slug: "tarn-et-garonne" },
  { code: "83", nom: "Var", slug: "var" },
  { code: "84", nom: "Vaucluse", slug: "vaucluse" },
  { code: "85", nom: "Vendée", slug: "vendee" },
  { code: "86", nom: "Vienne", slug: "vienne" },
  { code: "87", nom: "Haute-Vienne", slug: "haute-vienne" },
  { code: "88", nom: "Vosges", slug: "vosges" },
  { code: "89", nom: "Yonne", slug: "yonne" },
  { code: "90", nom: "Territoire de Belfort", slug: "territoire-de-belfort" },
  { code: "91", nom: "Essonne", slug: "essonne" },
  { code: "92", nom: "Hauts-de-Seine", slug: "hauts-de-seine" },
  { code: "93", nom: "Seine-Saint-Denis", slug: "seine-saint-denis" },
  { code: "94", nom: "Val-de-Marne", slug: "val-de-marne" },
  { code: "95", nom: "Val-d'Oise", slug: "val-d-oise" },
  { code: "971", nom: "Guadeloupe", slug: "guadeloupe" },
  { code: "972", nom: "Martinique", slug: "martinique" },
  { code: "973", nom: "Guyane", slug: "guyane" },
  { code: "974", nom: "La Réunion", slug: "la-reunion" },
  { code: "976", nom: "Mayotte", slug: "mayotte" },
];

const PAR_CODE = new Map(DEPARTEMENTS.map((d) => [d.code, d]));
const PAR_SLUG = new Map(DEPARTEMENTS.map((d) => [d.slug, d]));

export const departementParSlug = (s?: string | null) => (s ? PAR_SLUG.get(s) ?? null : null);
export const departementParCode = (c?: string | null) => (c ? PAR_CODE.get(c) ?? null : null);

/** Déduit le département d'après le code postal (Corse et outre-mer inclus). */
export function departementDuCodePostal(cp?: string | null): Departement | null {
  const chiffres = (cp ?? "").replace(/\D/g, "");
  if (chiffres.length < 2) return null;
  if (chiffres.startsWith("97") || chiffres.startsWith("98"))
    return PAR_CODE.get(chiffres.slice(0, 3)) ?? null;
  if (chiffres.startsWith("20")) {
    const n = Number(chiffres.slice(0, 5).padEnd(5, "0"));
    return PAR_CODE.get(n < 20200 ? "2A" : "2B") ?? null;
  }
  return PAR_CODE.get(chiffres.slice(0, 2)) ?? null;
}
