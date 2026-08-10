import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";

const DUREE_SLIDE = 4000;

export function CarouselCategories() {
  const [index, setIndex] = useState(0);
  const [deplie, setDeplie] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [mouvementReduit, setMouvementReduit] = useState(false);
  const barreRef = useRef<HTMLDivElement>(null);
  const total = CATEGORIES.length;
  const precedente = CATEGORIES[(index - 1 + total) % total]!;
  const suivante = CATEGORIES[(index + 1) % total]!;

  // Respecte le réglage système "réduire les animations".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const appliquer = () => setMouvementReduit(mq.matches);
    appliquer();
    mq.addEventListener("change", appliquer);
    return () => mq.removeEventListener("change", appliquer);
  }, []);

  // Défilement automatique + barre de progression, en pause pendant la lecture.
  const enPause = survol || deplie || mouvementReduit;
  const progressionRef = useRef(0);

  useEffect(() => {
    progressionRef.current = 0;
    if (barreRef.current) barreRef.current.style.transform = "scaleX(0)";
  }, [index]);

  useEffect(() => {
    if (enPause) return;
    // On repart de la progression déjà accomplie plutôt que de tout remettre à zéro.
    const debut = performance.now() - progressionRef.current * DUREE_SLIDE;
    let image = 0;
    const avancer = (maintenant: number) => {
      const progression = Math.min((maintenant - debut) / DUREE_SLIDE, 1);
      progressionRef.current = progression;
      if (barreRef.current) barreRef.current.style.transform = `scaleX(${progression})`;
      if (progression >= 1) {
        setIndex((i) => (i + 1) % total);
        return;
      }
      image = requestAnimationFrame(avancer);
    };
    image = requestAnimationFrame(avancer);
    return () => cancelAnimationFrame(image);
  }, [index, enPause, total]);

  const aller = (pas: number) => {
    setIndex((i) => (i + pas + total) % total);
    setDeplie(false);
  };

  return (
    <div
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
    >
      {/* aperçus des slides voisines, rognés sur les bords */}
      <div className="pointer-events-none absolute left-0 top-1/2 hidden h-[520px] w-[90px] -translate-y-1/2 overflow-hidden lg:block">
        <img
          src={precedente.photo}
          alt=""
          aria-hidden="true"
          className="h-full w-[340px] max-w-none -translate-x-[250px] object-cover"
        />
      </div>
      <div className="pointer-events-none absolute right-0 top-1/2 hidden h-[520px] w-[90px] -translate-y-1/2 overflow-hidden lg:block">
        <img
          src={suivante.photo}
          alt=""
          aria-hidden="true"
          className="h-full w-[340px] max-w-none object-cover"
        />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {CATEGORIES.map((categorie, i) => (
              <div
                key={categorie.value}
                className="grid w-full shrink-0 grow-0 basis-full items-center gap-8 sm:grid-cols-[40%_1fr] sm:gap-12"
                aria-hidden={i === index ? undefined : "true"}
              >
                <Link
                  to="/recherche"
                  search={{ categorie: categorie.value }}
                  tabIndex={i === index ? undefined : -1}
                  className="block aspect-[3/4] max-h-[600px] w-full overflow-hidden bg-secondary"
                >
                  <img
                    src={categorie.photo}
                    alt={`Prestation ${categorie.label.toLowerCase()}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="py-2">
                  <h2 className="max-w-[14ch] text-3xl font-semibold leading-tight sm:text-5xl">
                    Découvrez nos Professionnels
                  </h2>
                  <div className="mt-6 h-[3px] w-14 bg-gold" />

                  <h3 className="mt-8 text-lg font-semibold">{categorie.label}</h3>
                  <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">
                    {categorie.accroche}
                  </p>
                  {deplie && i === index && (
                    <p className="mt-3 max-w-xl leading-relaxed text-muted-foreground">
                      {categorie.detail}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeplie((v) => !v)}
                    tabIndex={i === index ? undefined : -1}
                    className="mt-4 inline-block text-sm font-medium text-foreground underline underline-offset-4"
                  >
                    {deplie && i === index ? "Voir moins" : "Voir plus"}
                  </button>

                  <div className="mt-10 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => aller(-1)}
                      tabIndex={i === index ? undefined : -1}
                      aria-label="Catégorie précédente"
                      className="rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-secondary"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => aller(1)}
                      tabIndex={i === index ? undefined : -1}
                      aria-label="Catégorie suivante"
                      className="rounded-full border border-border p-2.5 text-foreground transition-colors hover:bg-secondary"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* trait de progression du défilement automatique */}
                    <div
                      className="ml-2 h-px w-20 overflow-hidden bg-border sm:w-28"
                      aria-hidden="true"
                    >
                      <div
                        ref={i === index ? barreRef : null}
                        className="h-full w-full origin-left bg-gold"
                        style={{ transform: "scaleX(0)" }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {index + 1} / {total}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
