import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo-light.png";
import { CalendarDays, CreditCard, Users, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "HairTrack — Logiciel de gestion pour salons et instituts" },
      {
        name: "description",
        content:
          "Agenda par employé, encaissement en 3 clics, fiches clients et statistiques de chiffre d'affaires pour votre salon de coiffure ou institut de beauté.",
      },
      { property: "og:title", content: "HairTrack — Gestion de salon" },
      {
        property: "og:description",
        content: "Agenda, caisse, clients et statistiques, sur tablette comme sur mobile.",
      },
    ],
  }),
  component: Accueil,
});

const ATOUTS = [
  { icon: CalendarDays, titre: "Agenda", texte: "Une colonne par employé, créneaux de 15 minutes." },
  { icon: CreditCard, titre: "Caisse", texte: "Encaissement en 3 étapes, acompte déduit." },
  { icon: Users, titre: "Clients", texte: "Historique, total dépensé et notes." },
  { icon: BarChart3, titre: "Statistiques", texte: "CA en temps réel et export CSV." },
];

function Accueil() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/agenda", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <img src={logo} alt="HairTrack" className="h-8 w-auto" />
        <Button asChild variant="outline">
          <Link to="/auth">Se connecter</Link>
        </Button>
      </header>
      <section className="mx-auto max-w-3xl px-5 pb-10 pt-8 text-center">
        <span className="inline-block rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold-foreground">
          Coiffure &amp; beauté
        </span>
        <h1 className="mt-5 text-4xl font-semibold leading-tight sm:text-5xl">
          Votre salon, entièrement piloté.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Agenda partagé, caisse tactile, fiche client et chiffre d'affaires en temps réel.
          Pensé pour la tablette du salon.
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">Créer mon salon</Link>
          </Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-4 px-5 pb-16 sm:grid-cols-2 lg:grid-cols-4">
        {ATOUTS.map((a) => (
          <div key={a.titre} className="card-soft p-5">
            <a.icon className="h-5 w-5 text-gold" />
            <h2 className="mt-3 font-semibold">{a.titre}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{a.texte}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
