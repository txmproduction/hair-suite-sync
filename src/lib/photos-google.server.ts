// Synchronisation des photos de salons depuis Google Places (API New) vers notre stockage.
// Les URLs lh3.googleusercontent.com renvoyées par Google sont temporaires : on ne les stocke jamais.
// On télécharge les octets une fois pour toutes et on sert les images depuis notre propre domaine.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "photos-salons";
const MAX_PHOTOS = 5;

/** Vrai si l'URL vient de Google (donc temporaire, à remplacer). */
export const estPhotoGoogle = (url: string | null | undefined) =>
  !!url && url.includes("googleusercontent.com");

/** Chemin public servi par notre site (voir src/routes/api/public/photos-salons/$.ts). */
export const cheminPublicPhoto = (salonId: string, index: number) =>
  `/api/public/photos-salons/${salonId}/${index}.jpg`;

function cleGoogle(): string {
  const cle = process.env["GOOGLE_MAPS_API_KEY"];
  if (!cle)
    throw new Error(
      "La clé Google Maps n'est pas configurée. Ajoutez GOOGLE_MAPS_API_KEY dans les secrets du projet.",
    );
  return cle;
}

type PhotoGoogle = { name: string; authorAttributions?: { displayName?: string }[] };

/** Retrouve l'identifiant Google Places d'un salon à partir de son nom et de son adresse. */
async function resoudrePlaceId(salon: {
  nom: string;
  adresse: string | null;
  ville: string | null;
  latitude: number | null;
  longitude: number | null;
}): Promise<string | null> {
  const textQuery = [salon.nom, salon.adresse, salon.ville].filter(Boolean).join(", ");
  const corps: Record<string, unknown> = { textQuery, languageCode: "fr", pageSize: 1 };
  if (salon.latitude !== null && salon.longitude !== null) {
    corps["locationBias"] = {
      circle: {
        center: { latitude: Number(salon.latitude), longitude: Number(salon.longitude) },
        radius: 500,
      },
    };
  }

  const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": cleGoogle(),
      "X-Goog-FieldMask": "places.id",
    },
    body: JSON.stringify(corps),
  });
  if (!r.ok) throw new Error(`Recherche Google (${r.status}) : ${(await r.text()).slice(0, 200)}`);
  const data = (await r.json()) as { places?: { id?: string }[] };
  return data.places?.[0]?.id ?? null;
}

/** Liste les photos disponibles pour une fiche Google (champ « photos » = SKU Essentials). */
async function listerPhotosGoogle(placeId: string): Promise<PhotoGoogle[]> {
  const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { "X-Goog-Api-Key": cleGoogle(), "X-Goog-FieldMask": "photos" },
  });
  if (!r.ok) throw new Error(`Fiche Google (${r.status}) : ${(await r.text()).slice(0, 200)}`);
  const data = (await r.json()) as { photos?: PhotoGoogle[] };
  return (data.photos ?? []).filter((p) => !!p.name).slice(0, MAX_PHOTOS);
}

/** Télécharge une photo Google et la dépose dans notre stockage. */
async function transfererPhoto(salonId: string, index: number, photo: PhotoGoogle) {
  const media = await fetch(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200&skipHttpRedirect=true`,
    { headers: { "X-Goog-Api-Key": cleGoogle() } },
  );
  if (!media.ok) throw new Error(`Média Google (${media.status})`);
  const { photoUri } = (await media.json()) as { photoUri?: string };
  if (!photoUri) throw new Error("Aucune URL de média renvoyée par Google.");

  const image = await fetch(photoUri);
  if (!image.ok) throw new Error(`Téléchargement de la photo (${image.status})`);
  const octets = new Uint8Array(await image.arrayBuffer());
  if (octets.byteLength < 1024) throw new Error("Photo vide.");

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(`${salonId}/${index}.jpg`, octets, { contentType: "image/jpeg", upsert: true });
  if (error) throw new Error(error.message);

  return {
    url: cheminPublicPhoto(salonId, index),
    attribution: photo.authorAttributions?.[0]?.displayName ?? null,
  };
}

export type ResultatSynchro = {
  salonId: string;
  nom: string;
  photos: number;
  erreur: string | null;
};

/**
 * Récupère durablement les photos d'un salon depuis Google.
 * Ne touche jamais un salon dont la photo actuelle a été ajoutée par le salon lui-même.
 */
export async function synchroniserPhotosSalon(salonId: string): Promise<ResultatSynchro> {
  const { data: salon } = await supabaseAdmin
    .from("salons")
    .select("id, nom, adresse, ville, latitude, longitude, google_place_id, photo_couverture_url")
    .eq("id", salonId)
    .maybeSingle();
  if (!salon) return { salonId, nom: "Salon inconnu", photos: 0, erreur: "Salon introuvable." };

  const nom = salon.nom;
  try {
    let placeId = salon.google_place_id;
    if (!placeId) {
      placeId = await resoudrePlaceId({
        nom: salon.nom,
        adresse: salon.adresse,
        ville: salon.ville,
        latitude: salon.latitude === null ? null : Number(salon.latitude),
        longitude: salon.longitude === null ? null : Number(salon.longitude),
      });
      if (!placeId) throw new Error("Aucune fiche Google trouvée pour ce salon.");
      await supabaseAdmin.from("salons").update({ google_place_id: placeId }).eq("id", salon.id);
    }

    const photosGoogle = await listerPhotosGoogle(placeId);

    const transferees: { url: string; attribution: string | null }[] = [];
    for (const [i, p] of photosGoogle.entries()) {
      try {
        transferees.push(await transfererPhoto(salon.id, i, p));
      } catch {
        // Une photo manquante ne doit pas faire échouer tout le salon.
      }
    }

    await supabaseAdmin.from("photos_salon").delete().eq("salon_id", salon.id);
    if (transferees.length) {
      await supabaseAdmin.from("photos_salon").insert(
        transferees.map((p, ordre) => ({
          salon_id: salon.id,
          url: p.url,
          ordre,
          attribution: p.attribution,
        })),
      );
    }

    await supabaseAdmin
      .from("salons")
      .update({
        photo_couverture_url: transferees[0]?.url ?? null,
        photos_synchro_le: new Date().toISOString(),
        photos_erreur: transferees.length ? null : "Google ne propose aucune photo pour ce salon.",
      })
      .eq("id", salon.id);

    return { salonId: salon.id, nom, photos: transferees.length, erreur: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erreur inconnue";
    await supabaseAdmin
      .from("salons")
      .update({ photos_erreur: message.slice(0, 500), photos_synchro_le: new Date().toISOString() })
      .eq("id", salon.id);
    return { salonId: salon.id, nom, photos: 0, erreur: message };
  }
}

export type EtatPhotosGoogle = {
  aTraiter: number;
  urlsGoogle: number;
  sansPhoto: number;
  enErreur: number;
};

/** Compteurs affichés dans l'espace super-admin. */
export async function etatPhotosGoogle(): Promise<EtatPhotosGoogle> {
  const compter = async (filtre: (q: ReturnType<typeof requete>) => typeof q) => {
    const { count } = await filtre(requete());
    return count ?? 0;
  };
  const requete = () =>
    supabaseAdmin
      .from("salons")
      .select("id", { count: "exact", head: true })
      .eq("statut", "non_reclame");

  const urlsGoogle = await compter((q) => q.like("photo_couverture_url", "%googleusercontent.com%"));
  const sansPhoto = await compter((q) => q.is("photo_couverture_url", null));
  const enErreur = await compter((q) => q.not("photos_erreur", "is", null));

  return { aTraiter: urlsGoogle + sansPhoto, urlsGoogle, sansPhoto, enErreur };
}

/** Traite un lot de salons (URLs Google en priorité), 5 requêtes en parallèle maximum. */
export async function synchroniserLotPhotos(taille = 50) {
  const { data: prioritaires } = await supabaseAdmin
    .from("salons")
    .select("id")
    .eq("statut", "non_reclame")
    .like("photo_couverture_url", "%googleusercontent.com%")
    .limit(taille);

  const ids = (prioritaires ?? []).map((s) => s.id);
  if (ids.length < taille) {
    const { data: sansPhoto } = await supabaseAdmin
      .from("salons")
      .select("id")
      .eq("statut", "non_reclame")
      .is("photo_couverture_url", null)
      .is("photos_synchro_le", null)
      .limit(taille - ids.length);
    for (const s of sansPhoto ?? []) if (!ids.includes(s.id)) ids.push(s.id);
  }

  const resultats: ResultatSynchro[] = [];
  for (let i = 0; i < ids.length; i += 5) {
    const paquet = ids.slice(i, i + 5);
    resultats.push(...(await Promise.all(paquet.map((id) => synchroniserPhotosSalon(id)))));
    await new Promise((r) => setTimeout(r, 300));
  }

  const reussis = resultats.filter((r) => !r.erreur && r.photos > 0).length;
  const erreurs = resultats.filter((r) => !!r.erreur);
  return {
    traites: resultats.length,
    reussis,
    sansPhoto: resultats.filter((r) => !r.erreur && r.photos === 0).length,
    erreurs: erreurs.slice(0, 10).map((r) => `${r.nom} — ${r.erreur}`),
    nbErreurs: erreurs.length,
  };
}
