import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CATEGORIES, type CategorieSalon } from "@/lib/categories";

const CATS = new Set(CATEGORIES.map((c) => c.value as string));

/** Coordonnée GPS valide, sinon null (on n'invente jamais une position). */
function coord(v: string | number | undefined, max: number): number | null {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n !== 0 && Math.abs(n) <= max ? n : null;
}

async function verifier(userId: string) {
  const { estSuperAdmin } = await import("./superadmin.server");
  if (!(await estSuperAdmin(userId))) throw new Error("Accès réservé aux super-administrateurs.");
}

export const estSuperAdminFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { estSuperAdmin } = await import("./superadmin.server");
    return { superAdmin: await estSuperAdmin(context.userId) };
  });

export const salonsNonReclamesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await verifier(context.userId);
    const { listerSalonsNonReclames } = await import("./superadmin.server");
    return listerSalonsNonReclames();
  });

export const importerSalonsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      lignes: {
        nom: string;
        adresse?: string;
        ville?: string;
        telephone?: string;
        categorie: string;
        lien_externe?: string;
        note_google?: string | number;
        nb_avis_google?: string | number;
        photo_couverture_url?: string;
        latitude?: string | number;
        longitude?: string | number;
      }[];
      source?: string;
    }) => {
      const lignes = (data.lignes ?? []).map((l, i) => {
        const nom = String(l.nom ?? "").trim();
        if (nom.length < 2) throw new Error(`Ligne ${i + 1} : nom manquant.`);
        const categorie = String(l.categorie ?? "").trim();
        if (!CATS.has(categorie)) throw new Error(`Ligne ${i + 1} : catégorie « ${categorie} » inconnue.`);
        const note = Number(String(l.note_google ?? "").replace(",", "."));
        const nbAvis = Number(String(l.nb_avis_google ?? "").replace(/[^\d]/g, ""));
        const photosBrutes = String(l.photo_couverture_url ?? "")
          .split("|")
          .map((u) => u.trim())
          .filter(Boolean);
        for (const u of photosBrutes) {
          if (!/^https?:\/\//.test(u)) throw new Error(`Ligne ${i + 1} : URL de photo invalide (${u.slice(0, 40)}).`);
        }
        return {
          nom: nom.slice(0, 160),
          adresse: String(l.adresse ?? "").trim().slice(0, 240),
          ville: String(l.ville ?? "").trim().slice(0, 120),
          telephone: String(l.telephone ?? "").trim().slice(0, 40),
          categorie: categorie as CategorieSalon,
          lien_externe: String(l.lien_externe ?? "").trim().slice(0, 500) || null,
          note_google: Number.isFinite(note) && note > 0 && note <= 5 ? note : null,
          nb_avis_google: Number.isFinite(nbAvis) && nbAvis > 0 ? nbAvis : null,
          photos: photosBrutes.slice(0, 20).map((u) => u.slice(0, 500)),
          latitude: coord(l.latitude, 90),
          longitude: coord(l.longitude, 180),
        };
      });
      if (!lignes.length) throw new Error("Aucune ligne à importer.");
      if (lignes.length > 500) throw new Error("500 salons maximum par import.");
      return { lignes, source: String(data.source ?? "import_csv").slice(0, 60) };
    },
  )
  .handler(async ({ data, context }) => {
    await verifier(context.userId);
    const { importerSalonsNonReclames } = await import("./superadmin.server");
    return importerSalonsNonReclames(data.lignes, data.source);
  });

export const convertirEnClientFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { salonId: string; email: string; nomGerant?: string }) => {
    const email = String(data.email ?? "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Adresse email invalide.");
    return {
      salonId: String(data.salonId),
      email: email.slice(0, 160),
      nomGerant: String(data.nomGerant ?? "").trim().slice(0, 120),
    };
  })
  .handler(async ({ data, context }) => {
    await verifier(context.userId);
    const { convertirEnClient } = await import("./superadmin.server");
    return convertirEnClient(data);
  });
