import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reprendreFicheFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      slug: string;
      nomSalon: string;
      adresse?: string;
      telephone?: string;
      nomGerant?: string;
    }) => {
      const nomSalon = String(data.nomSalon ?? "").trim();
      if (nomSalon.length < 2) throw new Error("Merci d'indiquer le nom du salon.");
      return {
        slug: String(data.slug ?? "").slice(0, 120),
        nomSalon: nomSalon.slice(0, 160),
        adresse: String(data.adresse ?? "").trim().slice(0, 240),
        telephone: String(data.telephone ?? "").trim().slice(0, 40),
        nomGerant: String(data.nomGerant ?? "").trim().slice(0, 120),
      };
    },
  )
  .handler(async ({ data, context }) => {
    const { reprendreFiche } = await import("./annuaire.server");
    return reprendreFiche({
      ...data,
      userId: context.userId,
      email: (context.claims as { email?: string } | null)?.email ?? null,
    });
  });
