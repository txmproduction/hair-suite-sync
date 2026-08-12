import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-light.png";

const CONTACT = "contact.txmproduction@gmail.com";

/** Écran affiché quand l'essai gratuit de 14 jours est terminé. */
export function EssaiTermine({ onDeconnexion }: { onDeconnexion: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg text-center">
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="HairTrack" className="h-9 w-auto" />
        </div>
        <div className="card-soft p-7">
          <h1 className="text-2xl font-semibold">Votre essai gratuit est terminé</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Vos données sont conservées, rien n'est supprimé. HairTrack vous a plu ? Contactez-nous
            pour un accès complet sans restriction.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button asChild>
              <a
                href={`mailto:${CONTACT}?subject=${encodeURIComponent("Accès complet HairTrack")}`}
              >
                Nous contacter
              </a>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            <Button variant="ghost" onClick={onDeconnexion}>
              Se déconnecter
            </Button>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">{CONTACT}</p>
        </div>
      </div>
    </div>
  );
}
