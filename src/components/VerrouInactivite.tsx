import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DELAI_INACTIVITE_MS, estAppareilPartage } from "@/lib/appareil-partage";

/**
 * Sur une tablette partagée, referme la session de la personne identifiée
 * après un moment sans activité et revient à l'écran neutre.
 */
export function VerrouInactivite() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!estAppareilPartage()) return;
    let minuteur: ReturnType<typeof setTimeout>;

    async function verrouiller() {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      // Rechargement complet vers l'écran neutre : aucune session ne subsiste.
      window.location.replace("/caisse-partagee");
    }


    function relancer() {
      clearTimeout(minuteur);
      minuteur = setTimeout(verrouiller, DELAI_INACTIVITE_MS);
    }

    const evenements = ["pointerdown", "keydown", "touchstart", "visibilitychange"] as const;
    evenements.forEach((e) => window.addEventListener(e, relancer, { passive: true }));
    relancer();

    return () => {
      clearTimeout(minuteur);
      evenements.forEach((e) => window.removeEventListener(e, relancer));
    };
  }, [navigate, queryClient]);

  return null;
}
