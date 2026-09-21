import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Check } from "lucide-react";
import { CODES_LIMITE, codeLimiteDe, type CodeLimite } from "@/lib/droits";

/**
 * Fenêtre de conversion affichée quand une fonctionnalité réservée à
 * l'abonnement complet est sollicitée pendant l'essai gratuit.
 */
export function DialogAbonnement({
  code,
  onClose,
}: {
  code: CodeLimite | null;
  onClose: () => void;
}) {
  const contenu = code ? CODES_LIMITE[code] : null;
  return (
    <Dialog open={!!contenu} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold-foreground" />
            Fonctionnalité réservée à l'abonnement complet
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm font-medium">{contenu?.titre}</p>
        <p className="text-sm text-muted-foreground">{contenu?.texte}</p>
        <ul className="mt-1 space-y-2 text-sm">
          {["Collaborateurs illimités", "Rendez-vous illimités", "Acompte en ligne à la réservation"].map(
            (f) => (
              <li key={f} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-gold-foreground" />
                <span>{f}</span>
              </li>
            ),
          )}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild onClick={onClose}>
            <Link to="/abonnement">Passer à l'abonnement</Link>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Petit utilitaire : ouvre la fenêtre depuis un clic ou une erreur base. */
export function useDialogAbonnement() {
  const [code, setCode] = useState<CodeLimite | null>(null);
  return {
    code,
    ouvrir: (c: CodeLimite) => setCode(c),
    fermer: () => setCode(null),
    /** Retourne true si l'erreur correspond à une limite d'essai. */
    depuisErreur: (erreur: unknown) => {
      const c = codeLimiteDe(erreur instanceof Error ? erreur.message : erreur);
      if (c) setCode(c);
      return !!c;
    },
    dialog: <DialogAbonnement code={code} onClose={() => setCode(null)} />,
  };
}
