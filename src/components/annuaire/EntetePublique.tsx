import { Link } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-light.png";
import { CATEGORIES } from "@/lib/categories";

export function EntetePublique({
  ancrePro,
  transparent,
}: {
  ancrePro?: boolean | undefined;
  transparent?: boolean | undefined;
}) {
  return (
    <header
      className={
        transparent
          ? "absolute inset-x-0 top-0 z-40 text-white"
          : "sticky top-0 z-40 border-b border-border/70 bg-card/95 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link to="/" className="shrink-0">
          <img
            src={logo}
            alt="HairTrack"
            className={`h-8 w-auto ${transparent ? "brightness-0 invert" : ""}`}
          />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              to="/recherche"
              search={{ categorie: c.value }}
              className={
                transparent
                  ? "rounded-md px-2.5 py-1.5 text-sm text-white/90 transition-colors hover:text-white"
                  : "rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              }
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {ancrePro ? (
            <a
              href="#pro"
              className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              Je suis un professionnel de beauté
            </a>
          ) : (
            <Link
              to="/"
              hash="pro"
              className="hidden rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:block"
            >
              Je suis un professionnel de beauté
            </Link>
          )}
          <Button asChild variant="outline" size="sm">
            <Link to="/auth">
              <UserRound className="mr-1.5 h-4 w-4" />
              Mon compte
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {CATEGORIES.map((c) => (
          <Link
            key={c.value}
            to="/recherche"
            search={{ categorie: c.value }}
            className="whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
          >
            {c.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
