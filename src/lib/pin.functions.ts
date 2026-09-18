import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/* ------------------------------------------------------------------ */
/* Côté gérant : appareils partagés et codes PIN                       */
/* ------------------------------------------------------------------ */

async function contexteGerant(supabase: {
  from: (t: string) => any;
}, userId: string) {
  const { data } = await supabase
    .from("employes")
    .select("id, salon_id, role, actif")
    .eq("user_id", userId)
    .eq("actif", true)
    .maybeSingle();
  if (!data || data.role !== "gerant") throw new Error("Réservé au gérant du salon");
  return data as { id: string; salon_id: string };
}

export const listerAppareilsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const gerant = await contexteGerant(context.supabase as never, context.userId);
    const { data } = await context.supabase
      .from("appareils_partages")
      .select("id, nom, actif, derniere_utilisation_le, created_at")
      .eq("salon_id", gerant.salon_id)
      .order("created_at", { ascending: false });
    return data ?? [];
  });

export const enrolerAppareilFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { nom: string }) => d)
  .handler(async ({ data, context }) => {
    const gerant = await contexteGerant(context.supabase as never, context.userId);
    const { genererTokenAppareil, hasherToken } = await import("./pin.server");
    const token = genererTokenAppareil();
    const { error } = await context.supabase.from("appareils_partages").insert({
      salon_id: gerant.salon_id,
      nom: data.nom.trim() || "Tablette du comptoir",
      token_hash: await hasherToken(token),
      cree_par: context.userId,
    });
    if (error) throw new Error(error.message);
    // Le jeton n'est affiché qu'une seule fois : seul son empreinte est stockée.
    return { token };
  });

export const revoquerAppareilFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const gerant = await contexteGerant(context.supabase as never, context.userId);
    const { error } = await context.supabase
      .from("appareils_partages")
      .delete()
      .eq("id", data.id)
      .eq("salon_id", gerant.salon_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const definirPinFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { employeId: string; pin: string }) => d)
  .handler(async ({ data, context }) => {
    const gerant = await contexteGerant(context.supabase as never, context.userId);
    const { hasherPin, pinValide, emailInterne } = await import("./pin.server");
    if (!pinValide(data.pin)) throw new Error("Le code doit contenir 4 à 6 chiffres");

    const { data: employe } = await context.supabase
      .from("employes")
      .select("id, salon_id, email, user_id, nom")
      .eq("id", data.employeId)
      .maybeSingle();
    if (!employe || employe.salon_id !== gerant.salon_id) throw new Error("Employé introuvable");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Un PIN doit ouvrir une vraie session : l'employé a donc besoin d'un compte.
    let userId = employe.user_id;
    if (!userId) {
      const email = employe.email?.trim() || emailInterne(employe.id);
      const { data: cree, error: erreurCompte } = await supabaseAdmin.auth.admin.createUser({
        email,
        email_confirm: true,
        password: crypto.randomUUID() + crypto.randomUUID(),
        user_metadata: { nom: employe.nom, salon_id: employe.salon_id },
      });
      if (cree?.user) {
        userId = cree.user.id;
      } else {
        // Compte déjà existant pour cet e-mail : on le retrouve.
        const { data: liste } = await supabaseAdmin.auth.admin.listUsers({ perPage: 200 });
        const existant = liste?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (!existant) throw new Error(erreurCompte?.message ?? "Impossible de créer le compte");
        userId = existant.id;
      }
      const { error: erreurLien } = await supabaseAdmin
        .from("employes")
        .update({ user_id: userId })
        .eq("id", employe.id);
      if (erreurLien) throw new Error(erreurLien.message);
    }

    const { error } = await supabaseAdmin
      .from("employes")
      .update({
        pin_hash: await hasherPin(data.pin),
        pin_maj_le: new Date().toISOString(),
        pin_essais_echoues: 0,
        pin_bloque_jusqu_a: null,
      })
      .eq("id", employe.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const supprimerPinFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { employeId: string }) => d)
  .handler(async ({ data, context }) => {
    const gerant = await contexteGerant(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("employes")
      .update({ pin_hash: null, pin_essais_echoues: 0, pin_bloque_jusqu_a: null })
      .eq("id", data.employeId)
      .eq("salon_id", gerant.salon_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Côté tablette partagée : aucune session active                      */
/* ------------------------------------------------------------------ */

async function appareilValide(token: string) {
  const { hasherToken } = await import("./pin.server");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("appareils_partages")
    .select("id, salon_id, actif")
    .eq("token_hash", await hasherToken(token))
    .maybeSingle();
  if (!data || !data.actif) throw new Error("Appareil non reconnu");
  return { appareil: data, supabaseAdmin };
}

/** Liste minimale du personnel pour l'écran « Qui êtes-vous ? ». */
export const personnelAppareilFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => d)
  .handler(async ({ data }) => {
    const { appareil, supabaseAdmin } = await appareilValide(data.token);
    const [{ data: salon }, { data: employes }] = await Promise.all([
      supabaseAdmin.from("salons").select("nom").eq("id", appareil.salon_id).maybeSingle(),
      supabaseAdmin
        .from("employes")
        .select("id, nom, photo_url, role, pin_hash")
        .eq("salon_id", appareil.salon_id)
        .eq("actif", true)
        .order("ordre")
        .order("nom"),
    ]);
    return {
      salon: salon?.nom ?? "",
      personnel: (employes ?? [])
        .filter((e) => !!e.pin_hash)
        .map((e) => ({ id: e.id, nom: e.nom, photo_url: e.photo_url, role: e.role })),
    };
  });

/**
 * Vérifie le PIN et rend un jeton à usage unique permettant d'ouvrir une
 * véritable session Supabase pour CET employé (pas de session privilégiée
 * maintenue en arrière-plan).
 */
export const deverrouillerPinFn = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; employeId: string; pin: string }) => d)
  .handler(async ({ data }) => {
    const { appareil, supabaseAdmin } = await appareilValide(data.token);
    const { verifierPin, emailInterne } = await import("./pin.server");

    const { data: employe } = await supabaseAdmin
      .from("employes")
      .select("id, salon_id, nom, email, user_id, pin_hash, pin_essais_echoues, pin_bloque_jusqu_a, actif")
      .eq("id", data.employeId)
      .maybeSingle();

    if (!employe || employe.salon_id !== appareil.salon_id || !employe.actif || !employe.pin_hash) {
      throw new Error("Code incorrect");
    }
    if (employe.pin_bloque_jusqu_a && new Date(employe.pin_bloque_jusqu_a) > new Date()) {
      throw new Error("Trop d'essais : code bloqué quelques minutes");
    }

    const ok = await verifierPin(data.pin, employe.pin_hash);
    if (!ok) {
      const essais = (employe.pin_essais_echoues ?? 0) + 1;
      await supabaseAdmin
        .from("employes")
        .update({
          pin_essais_echoues: essais,
          pin_bloque_jusqu_a:
            essais >= 5 ? new Date(Date.now() + 5 * 60_000).toISOString() : null,
        })
        .eq("id", employe.id);
      throw new Error(essais >= 5 ? "Trop d'essais : code bloqué 5 minutes" : "Code incorrect");
    }

    const email = employe.email?.trim() || emailInterne(employe.id);
    const { data: lien, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error || !lien?.properties?.hashed_token) {
      throw new Error("Connexion impossible, prévenez le gérant");
    }

    await Promise.all([
      supabaseAdmin
        .from("employes")
        .update({ pin_essais_echoues: 0, pin_bloque_jusqu_a: null })
        .eq("id", employe.id),
      supabaseAdmin
        .from("appareils_partages")
        .update({ derniere_utilisation_le: new Date().toISOString() })
        .eq("id", appareil.id),
    ]);

    return { tokenHash: lien.properties.hashed_token, email };
  });
