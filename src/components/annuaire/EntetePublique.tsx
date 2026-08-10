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
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4">
        <Link to="/" className="shrink-0">
          <img
            src={logo}
            alt="HairTrack"
            className={`h-7 w-auto sm:h-8 ${transparent ? "brightness-0 invert" : ""}`}
          />
        </Link>
        <nav className="hidden flex-1 items-center gap-1 lg:flex">
          {CATEGORIES.filter((c) => c.visibleNav).map((c) => (
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

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          {ancrePro ? (
            <a
              href="#pro"
              className={`whitespace-nowrap rounded-md px-2 py-1.5 text-xs sm:px-2.5 sm:text-sm ${
                transparent
                  ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="sm:hidden">Je suis un pro</span>
              <span className="hidden sm:inline">Je suis un professionnel de beauté</span>
            </a>
          ) : (
            <Link
              to="/"
              hash="pro"
              className={`whitespace-nowrap rounded-md px-2 py-1.5 text-xs sm:px-2.5 sm:text-sm ${
                transparent
                  ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="sm:hidden">Je suis un pro</span>
              <span className="hidden sm:inline">Je suis un professionnel de beauté</span>
            </Link>
          )}
          <Button
            asChild
            variant={transparent ? "default" : "outline"}
            size="sm"
          >
            <Link to="/auth">
              <UserRound className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Mon compte</span>
            </Link>
          </Button>
        </div>
      </div>
      <div className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {CATEGORIES.filter((c) => c.visibleNav).map((c) => (
          <Link
            key={c.value}
            to="/recherche"
            search={{ categorie: c.value }}
            className={
              transparent
                ? "whitespace-nowrap rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur"
                : "whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
            }
          >
            {c.label}
          </Link>
        ))}
      </div>

    </header>
  );
}
