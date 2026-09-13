// Sert les photos de salons stockées dans notre espace privé, sous une adresse publique stable.
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/photos-salons/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const chemin = String((params as { _splat?: string })._splat ?? "");
        // {salon_id}/{index}.jpg uniquement : aucune traversée de dossier possible.
        if (!/^[0-9a-f-]{36}\/\d+\.jpg$/i.test(chemin))
          return new Response("Introuvable", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage.from("photos-salons").download(chemin);
        if (error || !data) return new Response("Introuvable", { status: 404 });

        return new Response(await data.arrayBuffer(), {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable",
          },
        });
      },
    },
  },
});
