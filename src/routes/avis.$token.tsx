import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EntetePublique } from "@/components/annuaire/EntetePublique";
import { PiedPublic } from "@/components/annuaire/PiedPublic";
import { contexteAvisFn, deposerAvisFn } from "@/lib/annuaire.functions";
import type { ContexteAvis } from "@/lib/annuaire-types";
import { dateFR } from "@/lib/hairtrack";

export const Route = createFileRoute("/avis/$token")({
  head: () => ({
    meta: [
      { title: "Donnez votre avis sur votre rendez-vous — HairTrack" },
      {
        name: "description",
        content:
          "Partagez votre expérience après votre rendez-vous : votre avis aide le salon à progresser et les autres clients à choisir.",
      },
      { property: "og:title", content: "Donnez votre avis — HairTrack" },
      { property: "og:description", content: "Notez votre rendez-vous en quelques secondes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PageAvis,
});

function PageAvis() {
  const { token } = Route.useParams();
  const [note, setNote] = useState(0);
  const [commentaire, setCommentaire] = useState("");
  const [prenom, setPrenom] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ visible: boolean } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["contexte-avis", token],
    queryFn: () => contexteAvisFn({ data: { token } }) as Promise<ContexteAvis | null>,
  });

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!note) {
      toast.error("Choisissez une note de 1 à 5 étoiles.");
      return;
    }
    setEnvoi(true);
    try {
      const r = await deposerAvisFn({ data: { token, note, commentaire, prenom } });
      setResultat(r as { visible: boolean });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <EntetePublique />
      <main className="mx-auto max-w-xl px-4 py-12">
        {isLoading ? (
          <p className="text-muted-foreground">Chargement…</p>
        ) : !data ? (
          <div className="card-soft p-6 text-center">
            <h1 className="text-xl font-semibold">Avis indisponible</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Ce lien n'est plus valable, ou le rendez-vous n'a pas encore eu lieu. Vous pourrez
              laisser votre avis juste après votre passage au salon.
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
          </div>
        ) : data.deja_donne || resultat ? (
          <div className="card-soft p-6 text-center">
            <h1 className="text-xl font-semibold">Merci !</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {resultat && !resultat.visible
                ? "Votre avis a bien été envoyé : il sera publié après relecture par le salon."
                : "Votre avis est enregistré, il est visible sur la fiche du salon."}
            </p>
            <Button asChild variant="outline" className="mt-5">
              <Link to="/">Découvrir d'autres salons</Link>
            </Button>
          </div>
        ) : (
          <div className="card-soft p-6">
            <h1 className="text-xl font-semibold">Comment s'est passé votre rendez-vous ?</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {data.salon}
              {data.prestation ? ` — ${data.prestation}` : ""} · {dateFR(data.debut)}
            </p>
            <form onSubmit={envoyer} className="mt-6 space-y-5">
              <div>
                <Label>Votre note</Label>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`${i} étoile${i > 1 ? "s" : ""}`}
                      onClick={() => setNote(i)}
                      className="rounded-md p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${i <= note ? "fill-gold text-gold" : "text-border"}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="prenom">Votre prénom</Label>
                <Input
                  id="prenom"
                  value={prenom}
                  onChange={(e) => setPrenom(e.target.value)}
                  className="mt-1.5"
                  placeholder="Camille"
                />
              </div>
              <div>
                <Label htmlFor="commentaire">Votre commentaire (facultatif)</Label>
                <Textarea
                  id="commentaire"
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  rows={4}
                  className="mt-1.5"
                  placeholder="Accueil, résultat, ambiance…"
                />
              </div>
              <Button type="submit" size="lg" disabled={envoi}>
                {envoi ? "Envoi…" : "Publier mon avis"}
              </Button>
            </form>
          </div>
        )}
      </main>
      <PiedPublic />
    </div>
  );
}
