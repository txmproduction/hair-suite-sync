import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { DELAI_INACTIVITE_MS, estAppareilPartage } from "@/lib/appareil-partage";

/**
 * Sur une tablette partagée, referme la session de la personne identifiée
 * après un moment sans activité et revient à l'écran neutre.
 */
export function VerrouInactivite() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!estAppareilPartage()) return;
    let minuteur: ReturnType<typeof setTimeout>;

    function verrouiller() {
      queryClient.cancelQueries();
      queryClient.clear();
      // Rechargement complet vers l'écran neutre, qui referme la session.
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
  }, [queryClient]);

  return null;
}
