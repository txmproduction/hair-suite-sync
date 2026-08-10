import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Instagram } from "lucide-react";
import { CATEGORIES, villeSlug } from "@/lib/categories";
import { villesFn } from "@/lib/annuaire.functions";
import logo from "@/assets/logo-light.png";

export function PiedPublic() {
  const { data: villes } = useQuery({
    queryKey: ["villes-footer"],
    queryFn: () => villesFn(),
    staleTime: 5 * 60 * 1000,
  });
  const villesAffichees = (villes ?? []).slice(0, 6);

  return (
    <footer className="border-t border-border bg-card">
      {villesAffichees.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-10">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((c) => (
              <div key={c.value}>
                <h3 className="text-sm font-semibold">{c.label}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nos {c.pluriel === c.label.toLowerCase() ? c.pluriel : `${c.label.toLowerCase()}s`} populaires
                </p>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-muted-foreground sm:grid-cols-3">
                  {villesAffichees.map((v) => (
                    <Link
                      key={v}
                      to="/$categorie/$ville"
                      params={{ categorie: c.slug, ville: villeSlug(v) }}
                      className="truncate hover:text-foreground"
                    >
                      {v}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <img src={logo} alt="HairTrack" className="h-8 w-auto" />
          <p className="mt-3 text-sm text-muted-foreground">
            La réservation beauté simple, pour les clients comme pour les salons.
          </p>
          <a
            href="https://www.instagram.com/hairtrack.fr"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium hover:text-gold"
          >
            <Instagram className="h-4 w-4" />
            HairTrack sur Instagram
          </a>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Catégories</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {CATEGORIES.map((c) => (
              <li key={c.value}>
                <Link to="/recherche" search={{ categorie: c.value }} className="hover:text-foreground">
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">HairTrack</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/" hash="pro" className="hover:text-foreground">
                Je suis un professionnel
              </Link>
            </li>
            <li>
              <Link to="/distribuer" className="hover:text-foreground">
                Distribuer HairTrack
              </Link>
            </li>
            <li>
              <Link to="/" hash="faq" className="hover:text-foreground">
                Questions fréquentes
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Mon compte
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold">Informations</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/mentions-legales" className="hover:text-foreground">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link to="/cgv" className="hover:text-foreground">
                CGV
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HairTrack — une réalisation TXM Production
      </div>
    </footer>
  );
}
