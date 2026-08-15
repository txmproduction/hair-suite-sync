// Chargement serveur des pages SEO de l'annuaire : métier national,
// métier × ville (paginé), métier × département, index des villes et des métiers.
// Tout est rendu côté serveur pour que le HTML du premier octet contienne déjà
// le titre, le h1, le texte éditorial et la liste des professionnels.
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CATEGORIES, parCategorie, parSlugCategorie, villeSlug } from "@/lib/categories";
import { departementDuCodePostal, departementParSlug, type Departement } from "@/lib/geo-fr";
import type {
  IndexMetiers,
  IndexVilles,
  PageDepartement,
  PageLocale,
  PageMetier,
  StatsLocales,
} from "@/lib/annuaire-seo-types";
import type { SalonCarte } from "@/lib/annuaire-types";

export const PAR_PAGE = 20;
export const SEUIL_INDEXATION = 3;

const FILTRE_VISIBLE = "reservation_en_ligne.eq.true,statut.eq.non_reclame";
const COLONNES =
  "id, slug, nom, ville, code_postal, adresse, categorie, description, photo_couverture_url, note_moyenne, nb_avis, note_google, nb_avis_google, statut, lien_externe, latitude, longitude, updated_at";

type Ligne = {
  id: string;
  slug: string | null;
  nom: string;
  ville: string | null;
  code_postal: string | null;
  adresse: string | null;
  categorie: string;
  description: string | null;
  photo_couverture_url: string | null;
  note_moyenne: number | null;
  nb_avis: number | null;
  note_google: number | null;
  nb_avis_google: number | null;
  statut: "reclame" | "non_reclame";
  lien_externe: string | null;
  latitude: number | null;
  longitude: number | null;
  updated_at: string | null;
};

// Cache mémoire court : les pages d'annuaire sont très lues et la base bouge peu.
let cache: { at: number; lignes: Ligne[] } | null = null;
const TTL_MS = 3 * 60 * 1000;

async function toutesLesFiches(): Promise<Ligne[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.lignes;
  const lignes: Ligne[] = [];
  const taille = 1000;
  for (let page = 0; page < 20; page++) {
    const { data } = await supabaseAdmin
      .from("salons")
      .select(COLONNES)
      .or(FILTRE_VISIBLE)
      .not("slug", "is", null)
      .not("ville", "is", null)
      .range(page * taille, page * taille + taille - 1);
    const lot = (data ?? []) as unknown as Ligne[];
    lignes.push(...lot);
    if (lot.length < taille) break;
  }
  cache = { at: Date.now(), lignes };
  return lignes;
}

function versCarte(s: Ligne, prixMin: Map<string, number>): SalonCarte {
  return {
    id: s.id,
    slug: s.slug ?? "",
    nom: s.nom,
    ville: s.ville,
    code_postal: s.code_postal,
    categorie: s.categorie as SalonCarte["categorie"],
    description: s.description,
    photo_couverture_url: s.photo_couverture_url,
    note_moyenne: s.note_moyenne === null ? null : Number(s.note_moyenne),
    nb_avis: Number(s.nb_avis ?? 0),
    note_google: s.note_google === null ? null : Number(s.note_google),
    nb_avis_google: s.nb_avis_google === null ? null : Number(s.nb_avis_google),
    statut: s.statut,
    prix_min: prixMin.get(s.id) ?? null,
    latitude: s.latitude === null ? null : Number(s.latitude),
    longitude: s.longitude === null ? null : Number(s.longitude),
    distance_km: null,
  };
}

async function prestationsDe(ids: string[]) {
  if (!ids.length) return [] as { salon_id: string; nom: string; prix: number }[];
  const lots: { salon_id: string; nom: string; prix: number }[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabaseAdmin
      .from("prestations")
      .select("salon_id, nom, prix")
      .eq("actif", true)
      .in("salon_id", ids.slice(i, i + 200));
    for (const p of data ?? []) lots.push({ salon_id: p.salon_id, nom: p.nom, prix: Number(p.prix) });
  }
  return lots;
}

async function horairesDe(ids: string[]) {
  if (!ids.length) return [] as { salon_id: string; jour: number; ferme: boolean }[];
  const lots: { salon_id: string; jour: number; ferme: boolean }[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabaseAdmin
      .from("horaires_salon")
      .select("salon_id, jour, ferme")
      .in("salon_id", ids.slice(i, i + 200));
    for (const h of data ?? []) lots.push({ salon_id: h.salon_id, jour: h.jour, ferme: h.ferme });
  }
  return lots;
}

function medianeDe(valeurs: number[]): number | null {
  if (!valeurs.length) return null;
  const t = [...valeurs].sort((a, b) => a - b);
  const m = Math.floor(t.length / 2);
  return t.length % 2 ? (t[m] as number) : (((t[m - 1] as number) + (t[m] as number)) / 2);
}

async function statsDe(lignes: Ligne[], villeCourante?: string): Promise<StatsLocales> {
  const ids = lignes.map((s) => s.id);
  const [prestations, horaires] = await Promise.all([prestationsDe(ids), horairesDe(ids)]);

  const prix = prestations.map((p) => p.prix).filter((p) => p > 0);
  const frequence = new Map<string, number>();
  for (const p of prestations) {
    const nom = p.nom.trim();
    if (!nom) continue;
    const cle = nom.charAt(0).toUpperCase() + nom.slice(1).toLowerCase();
    frequence.set(cle, (frequence.get(cle) ?? 0) + 1);
  }
  const prestationsTop = [...frequence.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
    .slice(0, 6)
    .map(([nom]) => nom);

  const ouverts = (jour: number) =>
    new Set(horaires.filter((h) => h.jour === jour && !h.ferme).map((h) => h.salon_id)).size;

  // Avis : on additionne les avis HairTrack et Google réels, sans jamais inventer de note.
  let sommeNotes = 0;
  let totalAvis = 0;
  for (const s of lignes) {
    const nbHt = Number(s.nb_avis ?? 0);
    if (s.note_moyenne !== null && nbHt > 0) {
      sommeNotes += Number(s.note_moyenne) * nbHt;
      totalAvis += nbHt;
    }
    const nbG = Number(s.nb_avis_google ?? 0);
    if (s.note_google !== null && nbG > 0) {
      sommeNotes += Number(s.note_google) * nbG;
      totalAvis += nbG;
    }
  }

  // « Quartiers » réels : on repart des adresses et codes postaux présents en base.
  const quartiers = [
    ...new Set(
      lignes
        .map((s) => {
          if (villeCourante && s.ville && s.ville !== villeCourante) return s.ville;
          const cp = (s.code_postal ?? "").trim();
          return cp ? `${villeCourante ?? s.ville ?? ""} ${cp}`.trim() : null;
        })
        .filter((v): v is string => !!v),
    ),
  ].slice(0, 6);

  return {
    nbPros: lignes.length,
    prixMin: prix.length ? Math.min(...prix) : null,
    prixMax: prix.length ? Math.max(...prix) : null,
    prixMedian: medianeDe(prix),
    noteMoyenne: totalAvis > 0 ? Math.round((sommeNotes / totalAvis) * 10) / 10 : null,
    nbAvis: totalAvis,
    prestations: prestationsTop,
    ouvertSamedi: ouverts(5),
    ouvertDimanche: ouverts(6),
    quartiers,
  };
}

const deptDe = (s: Ligne) => departementDuCodePostal(s.code_postal);

function distanceKm(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
): number | null {
  if (a.latitude === null || a.longitude === null || b.latitude === null || b.longitude === null)
    return null;
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const trierSalons = (a: SalonCarte, b: SalonCarte) => {
  const note = (s: SalonCarte) => s.note_moyenne ?? s.note_google ?? 0;
  const nb = (s: SalonCarte) => (s.note_moyenne ? s.nb_avis : (s.nb_avis_google ?? 0));
  return (
    (b.statut === "reclame" ? 1 : 0) - (a.statut === "reclame" ? 1 : 0) ||
    note(b) - note(a) ||
    nb(b) - nb(a) ||
    a.nom.localeCompare(b.nom, "fr")
  );
};

export async function chargerPageLocale(
  slugCategorie: string,
  slugVille: string,
  page = 1,
): Promise<PageLocale | null> {
  const info = parSlugCategorie(slugCategorie);
  if (!info) return null;

  const lignes = await toutesLesFiches();
  const dansVille = lignes.filter((s) => s.ville && villeSlug(s.ville) === slugVille);
  if (!dansVille.length) return null;
  const ville = (dansVille[0] as Ligne).ville as string;
  const duMetier = dansVille.filter((s) => s.categorie === info.value);
  if (!duMetier.length) return null;

  const ids = duMetier.map((s) => s.id);
  const prixMin = new Map<string, number>();
  for (const p of await prestationsDe(ids)) {
    const actuel = prixMin.get(p.salon_id);
    if (p.prix > 0 && (actuel === undefined || p.prix < actuel)) prixMin.set(p.salon_id, p.prix);
  }

  const cartes = duMetier.map((s) => versCarte(s, prixMin)).sort(trierSalons);
  const total = cartes.length;
  const nbPages = Math.max(1, Math.ceil(total / PAR_PAGE));
  const pageSure = Math.min(Math.max(1, page), nbPages);

  const departement = deptDe(duMetier[0] as Ligne);
  const stats = await statsDe(duMetier, ville);

  // Villes voisines réelles : calcul par distance sur les coordonnées en base.
  const centre = duMetier.find((s) => s.latitude !== null && s.longitude !== null) ?? null;
  const parVille = new Map<string, { nom: string; nb: number; lignes: Ligne[] }>();
  for (const s of lignes) {
    if (!s.ville || s.categorie !== info.value) continue;
    const slug = villeSlug(s.ville);
    if (slug === slugVille) continue;
    const entree = parVille.get(slug) ?? { nom: s.ville, nb: 0, lignes: [] };
    entree.nb += 1;
    entree.lignes.push(s);
    parVille.set(slug, entree);
  }
  const villesProches = [...parVille.entries()]
    .map(([slug, v]) => {
      const proche = centre
        ? Math.min(
            ...v.lignes.map((l) => distanceKm(centre, l) ?? Number.POSITIVE_INFINITY),
          )
        : Number.POSITIVE_INFINITY;
      return { slug, nom: v.nom, nb: v.nb, distance: proche };
    })
    .sort((a, b) => a.distance - b.distance || b.nb - a.nb || a.nom.localeCompare(b.nom, "fr"))
    .slice(0, 10)
    .map(({ slug, nom, nb }) => ({ slug, nom, nb }));

  const autresMetiers = CATEGORIES.filter((c) => c.value !== info.value)
    .map((c) => ({
      slug: c.slug,
      label: c.label,
      nb: dansVille.filter((s) => s.categorie === c.value).length,
    }))
    .filter((m) => m.nb > 0)
    .sort((a, b) => b.nb - a.nb);

  const dates = duMetier.map((s) => s.updated_at).filter((d): d is string => !!d);
  const lastmod = dates.length ? dates.sort().at(-1) ?? null : null;

  return {
    categorie: info.value,
    slugCategorie: info.slug,
    label: info.label,
    plurielNom: info.plurielNom,
    ville,
    villeSlug: slugVille,
    departement: departement ? { ...departement } : null,
    salons: cartes.slice((pageSure - 1) * PAR_PAGE, pageSure * PAR_PAGE),
    total,
    page: pageSure,
    nbPages,
    stats,
    villesProches,
    autresMetiers,
    lastmod,
  };
}

export async function chargerPageMetier(slugCategorie: string): Promise<PageMetier | null> {
  const info = parSlugCategorie(slugCategorie);
  if (!info) return null;
  const lignes = (await toutesLesFiches()).filter((s) => s.categorie === info.value);

  const parVille = new Map<string, { nom: string; nb: number; dept: Departement | null }>();
  const parDept = new Map<string, { departement: Departement; nb: number }>();
  for (const s of lignes) {
    if (!s.ville) continue;
    const slug = villeSlug(s.ville);
    const d = deptDe(s);
    const v = parVille.get(slug) ?? { nom: s.ville, nb: 0, dept: d };
    v.nb += 1;
    parVille.set(slug, v);
    if (d) {
      const e = parDept.get(d.slug) ?? { departement: d, nb: 0 };
      e.nb += 1;
      parDept.set(d.slug, e);
    }
  }

  const ids = lignes.slice(0, 60).map((s) => s.id);
  const prixMin = new Map<string, number>();
  for (const p of await prestationsDe(ids)) {
    const actuel = prixMin.get(p.salon_id);
    if (p.prix > 0 && (actuel === undefined || p.prix < actuel)) prixMin.set(p.salon_id, p.prix);
  }

  return {
    categorie: info.value,
    slugCategorie: info.slug,
    label: info.label,
    plurielNom: info.plurielNom,
    total: lignes.length,
    villes: [...parVille.entries()]
      .map(([slug, v]) => ({
        slug,
        nom: v.nom,
        nb: v.nb,
        departement: v.dept ? { ...v.dept } : null,
      }))
      .sort((a, b) => b.nb - a.nb || a.nom.localeCompare(b.nom, "fr")),
    departements: [...parDept.values()]
      .map((e) => ({ departement: { ...e.departement }, nb: e.nb }))
      .sort((a, b) => b.nb - a.nb || a.departement.nom.localeCompare(b.departement.nom, "fr")),
    salons: lignes
      .slice(0, 60)
      .map((s) => versCarte(s, prixMin))
      .sort(trierSalons)
      .slice(0, 12),
  };
}

export async function chargerPageDepartement(
  slugCategorie: string,
  slugDepartement: string,
): Promise<PageDepartement | null> {
  const info = parSlugCategorie(slugCategorie);
  const dep = departementParSlug(slugDepartement);
  if (!info || !dep) return null;

  const lignes = (await toutesLesFiches()).filter(
    (s) => s.categorie === info.value && deptDe(s)?.code === dep.code,
  );
  if (!lignes.length) return null;

  const parVille = new Map<string, { nom: string; nb: number }>();
  for (const s of lignes) {
    if (!s.ville) continue;
    const slug = villeSlug(s.ville);
    const v = parVille.get(slug) ?? { nom: s.ville, nb: 0 };
    v.nb += 1;
    parVille.set(slug, v);
  }

  const prixMin = new Map<string, number>();
  for (const p of await prestationsDe(lignes.map((s) => s.id))) {
    const actuel = prixMin.get(p.salon_id);
    if (p.prix > 0 && (actuel === undefined || p.prix < actuel)) prixMin.set(p.salon_id, p.prix);
  }

  return {
    categorie: info.value,
    slugCategorie: info.slug,
    label: info.label,
    plurielNom: info.plurielNom,
    departement: { ...dep },
    total: lignes.length,
    villes: [...parVille.entries()]
      .map(([slug, v]) => ({ slug, nom: v.nom, nb: v.nb }))
      .sort((a, b) => b.nb - a.nb || a.nom.localeCompare(b.nom, "fr")),
    salons: lignes
      .map((s) => versCarte(s, prixMin))
      .sort(trierSalons)
      .slice(0, 12),
    stats: await statsDe(lignes),
  };
}

export async function chargerIndexVilles(): Promise<IndexVilles> {
  const lignes = await toutesLesFiches();
  const groupes = new Map<
    string,
    { departement: Departement; villes: Map<string, { nom: string; nb: number; metiers: Set<string> }> }
  >();
  for (const s of lignes) {
    const d = deptDe(s);
    if (!d || !s.ville) continue;
    const g = groupes.get(d.slug) ?? { departement: d, villes: new Map() };
    const slug = villeSlug(s.ville);
    const v = g.villes.get(slug) ?? { nom: s.ville, nb: 0, metiers: new Set<string>() };
    v.nb += 1;
    const info = parCategorie(s.categorie);
    if (info) v.metiers.add(info.slug);
    g.villes.set(slug, v);
    groupes.set(d.slug, g);
  }

  const sortie = [...groupes.values()]
    .map((g) => ({
      departement: { ...g.departement },
      villes: [...g.villes.entries()]
        .map(([slug, v]) => ({ slug, nom: v.nom, nb: v.nb, metiers: [...v.metiers] }))
        .sort((a, b) => a.nom.localeCompare(b.nom, "fr")),
    }))
    .sort((a, b) => a.departement.code.localeCompare(b.departement.code));

  return { total: sortie.reduce((n, g) => n + g.villes.length, 0), groupes: sortie };
}

export async function chargerIndexMetiers(): Promise<IndexMetiers> {
  const lignes = await toutesLesFiches();
  return {
    metiers: CATEGORIES.map((c) => {
      const duMetier = lignes.filter((s) => s.categorie === c.value);
      const parVille = new Map<string, { nom: string; nb: number }>();
      for (const s of duMetier) {
        if (!s.ville) continue;
        const slug = villeSlug(s.ville);
        const v = parVille.get(slug) ?? { nom: s.ville, nb: 0 };
        v.nb += 1;
        parVille.set(slug, v);
      }
      return {
        slug: c.slug,
        label: c.label,
        plurielNom: c.plurielNom,
        nb: duMetier.length,
        villes: [...parVille.entries()]
          .map(([slug, v]) => ({ slug, nom: v.nom, nb: v.nb }))
          .sort((a, b) => b.nb - a.nb || a.nom.localeCompare(b.nom, "fr"))
          .slice(0, 20),
      };
    }).filter((m) => m.nb > 0),
  };
}

/** Données des sitemaps : uniquement des URLs en 200 et indexables. */
export async function chargerDonneesSitemap() {
  const lignes = await toutesLesFiches();

  const parPaire = new Map<string, { categorie: string; ville: string; nb: number; lastmod: string | null }>();
  const parMetierVille = new Map<string, number>();
  const parDept = new Map<string, { slugCategorie: string; slugDept: string; nb: number }>();

  for (const s of lignes) {
    if (!s.ville) continue;
    const info = parCategorie(s.categorie);
    if (!info) continue;
    const cle = `${info.slug}|${villeSlug(s.ville)}`;
    const e = parPaire.get(cle) ?? {
      categorie: info.slug,
      ville: villeSlug(s.ville),
      nb: 0,
      lastmod: null,
    };
    e.nb += 1;
    if (s.updated_at && (!e.lastmod || s.updated_at > e.lastmod)) e.lastmod = s.updated_at;
    parPaire.set(cle, e);
    parMetierVille.set(info.slug, (parMetierVille.get(info.slug) ?? 0) + 1);

    const d = deptDe(s);
    if (d) {
      const cleD = `${info.slug}|${d.slug}`;
      const eD = parDept.get(cleD) ?? { slugCategorie: info.slug, slugDept: d.slug, nb: 0 };
      eD.nb += 1;
      parDept.set(cleD, eD);
    }
  }

  return {
    // Une page ville n'entre dans le sitemap que si elle est indexable (>= 3 pros).
    pagesVilles: [...parPaire.values()]
      .filter((p) => p.nb >= SEUIL_INDEXATION)
      .map((p) => ({
        loc: `/${p.categorie}/${p.ville}`,
        lastmod: p.lastmod,
        nb: p.nb,
      })),
    pagesDepartements: [...parDept.values()]
      .filter((d) => d.nb >= SEUIL_INDEXATION)
      .map((d) => ({ loc: `/${d.slugCategorie}/${d.slugDept}`, nb: d.nb })),
    pagesMetiers: [...parMetierVille.entries()].map(([slug, nb]) => ({
      loc: `/${slug}`,
      nb,
    })),
    salons: lignes
      .filter((s) => s.slug)
      .map((s) => ({ loc: `/salon/${s.slug}`, lastmod: s.updated_at })),
  };
}

/** Redirection 301 enregistrée en base pour un ancien chemin indexé. */
export async function chercherRedirection(chemin: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("redirections")
    .select("chemin_cible")
    .eq("chemin_source", chemin)
    .maybeSingle();
  return data?.chemin_cible ?? null;
}
