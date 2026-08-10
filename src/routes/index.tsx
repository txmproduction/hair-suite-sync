import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import {
  CalendarDays,
  CreditCard,
  Users,
  BarChart3,
  Clock,
  BellRing,
  ShieldCheck,
  TrendingUp,
  Handshake,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { BarreRecherche } from "@/components/annuaire/BarreRecherche";
import { CarteSalon } from "@/components/annuaire/CarteSalon";
import { CarouselCategories } from "@/components/annuaire/CarouselCategories";
import { annuaireFn } from "@/lib/annuaire.functions";
import type { SalonCarte } from "@/lib/annuaire-types";
import hero from "@/assets/hero-accueil.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HairTrack — Réservez votre rendez-vous beauté en ligne" },
      {
        name: "description",
        content:
          "Coiffeur, barbier, manucure, institut de beauté ou bien-être : trouvez un professionnel près de chez vous et réservez en ligne, 24h/24, en quelques secondes.",
      },
      { property: "og:title", content: "HairTrack — Réservez en beauté" },
      {
        property: "og:description",
        content: "Trouvez votre salon, choisissez votre créneau, c'est réservé. Simple et immédiat.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hairtrack.fr/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://hairtrack.fr/" }],
  }),
  component: Accueil,
});

const ARGUMENTS_PRO = [
  {
    icon: TrendingUp,
    titre: "Un agenda qui se remplit tout seul",
    texte:
      "Vos clients réservent quand l'idée leur vient, sans appel ni attente. Résultat : moins de créneaux perdus et plus de rendez-vous dans la semaine.",
  },
  {
    icon: Clock,
    titre: "Ouvert même quand vous êtes fermé",
    texte:
      "Une grande partie des réservations tombe le soir, le dimanche ou pendant que vous avez les mains dans les cheveux. HairTrack les prend pour vous.",
  },
  {
    icon: BellRing,
    titre: "Fini les rendez-vous oubliés",
    texte:
      "Confirmation immédiate et rappel avant la venue : votre client sait où il en est, vous aussi.",
  },
  {
    icon: ShieldCheck,
    titre: "Beaucoup moins de lapins",
    texte:
      "Vous fixez librement un acompte, en euros ou en pourcentage. Un client qui a réservé sérieusement vient — et vous n'y perdez plus votre temps.",
  },
];

const OUTILS_PRO = [
  { icon: CalendarDays, titre: "Agenda", texte: "Une colonne par collaborateur, glisser-déposer, créneaux de 15 min." },
  { icon: CreditCard, titre: "Caisse", texte: "Encaissement en 3 gestes, acompte déjà déduit." },
  { icon: Users, titre: "Clients", texte: "Historique, total dépensé, notes utiles." },
  { icon: BarChart3, titre: "Statistiques", texte: "Chiffre d'affaires en direct et export CSV." },
];

const FAQ = [
  {
    q: "HairTrack est-il gratuit pour réserver ?",
    r: "Oui. Chercher un salon, comparer les prestations et réserver un créneau ne coûte rien aux clients. Aucun abonnement, aucun frais de dossier.",
  },
  {
    q: "Dois-je payer en ligne sur HairTrack ?",
    r: "Cela dépend de la prestation et du salon : certains professionnels demandent un acompte au moment de la réservation, d'autres pas du tout. Quand un acompte est demandé, le solde se règle normalement sur place, à la fin du rendez-vous.",
  },
  {
    q: "Comment gérer mes rendez-vous ?",
    r: "À la réservation, vous recevez un lien personnel. Il vous permet de retrouver le détail de votre rendez-vous et de l'annuler dans le délai autorisé par le salon. Passé ce délai, un simple appel au salon suffit.",
  },
  {
    q: "Comment référencer mon salon ?",
    r: "Créez votre compte professionnel, renseignez vos prestations et votre fiche publique : votre salon apparaît dans les recherches et votre lien de réservation est actif immédiatement.",
  },
];

function Accueil() {
  const { data } = useQuery({ queryKey: ["annuaire"], queryFn: () => annuaireFn() });
  const salons = (data?.salons ?? []) as SalonCarte[];
  const villes = data?.villes ?? [];
  const pisteRef = useRef<HTMLDivElement>(null);

  // Fait défiler d'une "page" de cartes, quelle que soit la largeur d'écran.
  const faireDefiler = (sens: number) => {
    const piste = pisteRef.current;
    if (!piste) return;
    piste.scrollBy({ left: sens * piste.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* HERO plein écran, header transparent par-dessus */}
      <section className="relative isolate flex h-screen w-full items-center overflow-hidden">
        <EntetePublique ancrePro transparent />
        <img
          src={hero.url}
          alt="Cliente dans un salon de coiffure"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/40" />
        <div className="relative mx-auto w-full max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-semibold text-white drop-shadow-sm sm:text-5xl">
            Réservez en beauté
          </h1>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-white/85">
            Simple • Immédiat • 24h/24
          </p>
          <div className="mt-8 text-left">
            <BarreRecherche villes={villes} />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 sm:py-24">
        <CarouselCategories />
      </section>



      {/* SALONS LES MIEUX NOTES */}
      <section className="border-y border-border bg-card/60 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold sm:text-3xl">
                Découvrez les salons les mieux notés
              </h2>
              <p className="mt-2 text-muted-foreground">
                Une sélection d'adresses reconnues près de chez vous.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => faireDefiler(-1)}
                aria-label="Salons précédents"
                className="rounded-full border border-border p-2.5 transition-colors hover:bg-secondary"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => faireDefiler(1)}
                aria-label="Salons suivants"
                className="rounded-full border border-border p-2.5 transition-colors hover:bg-secondary"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <Button asChild variant="outline">
                <Link to="/recherche">Voir tous les salons</Link>
              </Button>
            </div>
          </div>
          {salons.length === 0 ? (
            <p className="mt-8 text-muted-foreground">
              Les premiers salons arrivent très bientôt.
            </p>
          ) : (
            <div
              ref={pisteRef}
              className="mt-7 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {salons.slice(0, 12).map((s) => (
                <div
                  key={s.id}
                  className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-2.5rem)/3)]"
                >
                  <CarteSalon salon={s} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PRO */}
      <section id="pro" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-16">
        <span className="inline-block rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold-foreground">
          Espace professionnel
        </span>
        <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
          Vous êtes un professionnel de la beauté ?
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          HairTrack, c'est votre agenda, votre caisse et votre fiche de réservation en ligne au même
          endroit. Pensé pour la tablette du salon, utilisable dès le premier jour.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ARGUMENTS_PRO.map((a) => (
            <div key={a.titre} className="card-soft p-5">
              <a.icon className="h-5 w-5 text-gold" />
              <h3 className="mt-3 font-semibold">{a.titre}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.texte}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {OUTILS_PRO.map((o) => (
            <div key={o.titre} className="rounded-xl border border-border bg-card p-4">
              <o.icon className="h-4 w-4 text-gold" />
              <h3 className="mt-2 text-sm font-semibold">{o.titre}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{o.texte}</p>
            </div>
          ))}
        </div>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth">Créer mon salon</Link>
        </Button>
      </section>

      {/* DISTRIBUTION */}
      <section className="border-y border-border bg-card/60 py-14">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold-foreground">
              <Handshake className="h-3.5 w-3.5" />
              Opportunité
            </span>
            <h2 className="mt-4 text-2xl font-semibold sm:text-3xl">
              HairTrack recherche des distributeurs
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              On se développe région par région et on cherche des profils motivés, à l'aise avec les
              salons et les barbershops, pour aller les rencontrer et les aider à passer au
              numérique. Vous connaissez le terrain, on fournit l'outil et l'accompagnement.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/distribuer">Distribuer HairTrack</Link>
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16">
        <h2 className="text-2xl font-semibold sm:text-3xl">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-6">
          {FAQ.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.r}
                {f.q.startsWith("Comment référencer") && (
                  <Link to="/auth" className="ml-1 font-medium text-gold underline">
                    Créer mon salon
                  </Link>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <PiedPublic />
    </div>
  );
}
