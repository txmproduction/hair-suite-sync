import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

export function CarouselCategories() {
  const [index, setIndex] = useState(0);
  const [deplie, setDeplie] = useState(false);
  const categorie = CATEGORIES[index]!;

  const aller = (pas: number) => {
    setIndex((i) => (i + pas + CATEGORIES.length) % CATEGORIES.length);
    setDeplie(false);
  };

  return (
    <div className="mt-7 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <div className="grid gap-0 sm:grid-cols-[40%_1fr]">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-secondary">
          <img
            key={categorie.photo}
            src={categorie.photo}
            alt={`Prestation ${categorie.label.toLowerCase()}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col justify-center p-6 sm:p-9">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {index + 1} / {CATEGORIES.length}
          </p>
          <h3 className="mt-3 text-2xl font-semibold sm:text-3xl">{categorie.label}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">{categorie.accroche}</p>

          {deplie && (
            <p className="mt-3 leading-relaxed text-muted-foreground">{categorie.detail}</p>
          )}

          <button
            type="button"
            onClick={() => setDeplie((v) => !v)}
            className="mt-3 self-start text-sm font-medium text-foreground underline underline-offset-4"
          >
            {deplie ? "Voir moins" : "Voir plus"}
          </button>

          <Link
            to="/recherche"
            search={{ categorie: categorie.value }}
            className="mt-6 inline-flex w-fit items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Voir les salons
          </Link>

          <div className="mt-7 flex items-center gap-3">
            <button
              type="button"
              onClick={() => aller(-1)}
              aria-label="Catégorie précédente"
              className="rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => aller(1)}
              aria-label="Catégorie suivante"
              className="rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-secondary"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
