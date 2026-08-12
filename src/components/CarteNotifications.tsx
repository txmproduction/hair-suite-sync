import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { estSuperAdminFn } from "@/lib/superadmin.functions";
import {
  activerNotifications,
  desactiverNotifications,
  notificationsActives,
  pushSupporte,
} from "@/lib/push-client";

/** Réservé au super-admin : abonnement aux notifications push HairTrack. */
export function CarteNotifications() {
  const { data: acces } = useQuery({
    queryKey: ["super-admin"],
    queryFn: () => estSuperAdminFn(),
  });
  const [actives, setActives] = useState(false);
  const [supporte, setSupporte] = useState(true);
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    setSupporte(pushSupporte());
    notificationsActives().then(setActives);
  }, []);

  if (!acces?.superAdmin) return null;

  async function basculer() {
    setEnCours(true);
    try {
      if (actives) {
        await desactiverNotifications();
        setActives(false);
        toast.success("Notifications désactivées.");
        return;
      }
      const resultat = await activerNotifications();
      if (resultat === "ok") {
        setActives(true);
        toast.success("Notifications activées sur cet appareil.");
      } else if (resultat === "refuse") {
        toast.error("Autorisation refusée par le navigateur.");
      } else {
        toast.message("Notifications push non disponibles sur cet appareil.");
      }
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="card-soft space-y-3 p-5">
      <h2 className="font-semibold">Notifications push (super-admin)</h2>
      <p className="text-sm text-muted-foreground">
        Recevez une notification sur votre téléphone, même application fermée, à chaque nouveau
        client qui réserve et à chaque nouveau salon référencé.
      </p>
      {supporte ? (
        <Button variant={actives ? "outline" : "default"} disabled={enCours} onClick={basculer}>
          {actives ? (
            <>
              <BellOff className="mr-2 h-4 w-4" /> Désactiver les notifications
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" /> Activer les notifications
            </>
          )}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          Cet appareil ne prend pas en charge les notifications push. Sur iPhone, ajoutez HairTrack à
          l'écran d'accueil puis réessayez.
        </p>
      )}
    </div>
  );
}
