import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function emailDeSession(claims: Record<string, unknown> | undefined): string {
  const email = typeof claims?.["email"] === "string" ? (claims["email"] as string) : "";
  if (!email) throw new Error("Session sans adresse e-mail.");
  return email.trim().toLowerCase();
}

function nettoyerProche(data: {
  prenom: string;
  nom: string;
  date_naissance?: string | null;
}) {
  const prenom = String(data.prenom ?? "").trim();
  const nom = String(data.nom ?? "").trim();
  if (prenom.length < 2 || nom.length < 1)
    throw new Error("Merci d'indiquer le prénom et le nom du proche.");
  const naissance = String(data.date_naissance ?? "").trim();
  return {
    prenom: prenom.slice(0, 80),
    nom: nom.slice(0, 80),
    date_naissance: /^\d{4}-\d{2}-\d{2}$/.test(naissance) ? naissance : null,
  };
}

export const espaceClientFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { chargerEspaceClient } = await import("./compte-client.server");
    return chargerEspaceClient(emailDeSession(context.claims as Record<string, unknown>));
  });

export const ajouterProcheFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { prenom: string; nom: string; date_naissance?: string | null }) =>
    nettoyerProche(data),
  )
  .handler(async ({ data, context }) => {
    const { ajouterProcheClient } = await import("./compte-client.server");
    await ajouterProcheClient(emailDeSession(context.claims as Record<string, unknown>), data);
    return { ok: true };
  });

export const modifierProcheFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id: string; prenom: string; nom: string; date_naissance?: string | null }) => ({
      id: String(data.id),
      ...nettoyerProche(data),
    }),
  )
  .handler(async ({ data, context }) => {
    const { modifierProcheClient } = await import("./compte-client.server");
    const { id, ...proche } = data;
    await modifierProcheClient(
      emailDeSession(context.claims as Record<string, unknown>),
      id,
      proche,
    );
    return { ok: true };
  });

export const supprimerProcheFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => ({ id: String(data.id) }))
  .handler(async ({ data, context }) => {
    const { supprimerProcheClient } = await import("./compte-client.server");
    await supprimerProcheClient(emailDeSession(context.claims as Record<string, unknown>), data.id);
    return { ok: true };
  });
