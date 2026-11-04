// Stable public image address, backed by expiring links to PRIVATE storage.
import { createFileRoute } from "@tanstack/react-router";
import { createPhotoDelivery } from "@/lib/photo-delivery";

const deliverPhoto = createPhotoDelivery(async (path, expiresIn) => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.storage
    .from("photos-salons")
    .createSignedUrl(path, expiresIn);
  return error ? null : data?.signedUrl ?? null;
});

export const Route = createFileRoute("/api/public/photos-salons/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const chemin = String((params as { _splat?: string })._splat ?? "");
        return deliverPhoto(chemin);
      },
    },
  },
});
