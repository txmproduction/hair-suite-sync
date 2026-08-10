import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Handshake, Euro, MapPinned, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { candidatureDistributionFn } from "@/lib/annuaire.functions";

export const Route = createFileRoute("/distribuer")({
  head: () => ({
    meta: [
      { title: "Devenir distributeur HairTrack — rémunération à la clé" },
      {
        name: "description",
        content:
          "Présentez HairTrack aux salons et barbershops de votre région et gagnez une rémunération sur chaque salon équipé. Candidature en une minute.",
      },
      { property: "og:title", content: "Devenir distributeur HairTrack" },
      {
        property: "og:description",
        content: "Digitalisez les salons de votre région avec HairTrack, et soyez rémunéré.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hairtrack.fr/distribuer" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://hairtrack.fr/distribuer" }],
  }),
  component: PageDistribuer,
});

const PRINCIPE = [
  {
    icon: MapPinned,
    titre: "Votre secteur",
    texte:
      "Vous prospectez les salons, barbershops et instituts autour de chez vous : ceux que vous connaissez déjà, et ceux qui vous ressemblent.",
  },
  {
    icon: GraduationCap,
    titre: "On vous forme",
    texte:
      "Démonstration, arguments, réponses aux objections, installation : vous êtes accompagné du premier rendez-vous jusqu'à la mise en route.",
  },
  {
    icon: Euro,
    titre: "Rémunération à la clé",
    texte:
      "Chaque salon que vous équipez vous rapporte. Plus votre secteur se développe, plus vos revenus suivent.",
  },
];

function PageDistribuer() {
  const [envoi, setEnvoi] = useState(false);
  const [fait, setFait] = useState(false);
  const [form, setForm] = useState({ nom: "", telephone: "", email: "", ville: "", message: "" });

  const maj = (champ: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [champ]: e.target.value }));

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      await candidatureDistributionFn({ data: form });
      setFait(true);
      toast.success("Candidature envoyée, on vous rappelle très vite.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-4xl px-4 py-12">
        <span className="inline-flex items-center gap-2 rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold-foreground">
          <Handshake className="h-3.5 w-3.5" />
          Programme distributeurs
        </span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Distribuer HairTrack</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Le principe est simple : vous présentez HairTrack aux salons et barbers de votre région,
          vous les accompagnez au démarrage, et vous êtes rémunéré pour chaque salon équipé. Pas
          besoin d'être commercial de métier — il faut aimer le terrain et connaître son coin.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PRINCIPE.map((p) => (
            <div key={p.titre} className="card-soft p-5">
              <p.icon className="h-5 w-5 text-gold" />
              <h2 className="mt-3 font-semibold">{p.titre}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.texte}</p>
            </div>
          ))}
        </div>

        <section className="card-soft mt-10 p-6">
          <h2 className="text-xl font-semibold">Je veux en savoir plus</h2>
          {fait ? (
            <div className="mt-4">
              <p className="text-sm">
                Merci ! Votre candidature est enregistrée, on vous contacte rapidement pour en
                discuter.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link to="/">Retour à l'accueil</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={envoyer} className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="nom">Nom et prénom</Label>
                <Input id="nom" value={form.nom} onChange={maj("nom")} required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="tel">Téléphone</Label>
                <Input
                  id="tel"
                  type="tel"
                  value={form.telephone}
                  onChange={maj("telephone")}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={maj("email")}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="ville">Ville / secteur</Label>
                <Input
                  id="ville"
                  value={form.ville}
                  onChange={maj("ville")}
                  required
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="message">Un mot sur vous (facultatif)</Label>
                <Textarea
                  id="message"
                  value={form.message}
                  onChange={maj("message")}
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" disabled={envoi}>
                  {envoi ? "Envoi…" : "Envoyer ma candidature"}
                </Button>
              </div>
            </form>
          )}
        </section>
      </main>
      <PiedPublic />
    </div>
  );
}
