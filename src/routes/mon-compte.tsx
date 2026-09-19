import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ajouterProcheFn,
  espaceClientFn,
  modifierProcheFn,
  supprimerProcheFn,
} from "@/lib/compte-client.functions";
import { supabase } from "@/integrations/supabase/client";
import { euro, heureFR } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-light.png";
import { Check, Mail, Pencil, Plus, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/mon-compte")({
  head: () => ({
    meta: [
      { title: "Mon compte — HairTrack" },
      {
        name: "description",
        content:
          "Retrouvez vos rendez-vous, ceux de vos proches, et gérez les fiches de vos proches depuis votre compte HairTrack.",
      },
      { property: "og:title", content: "Mon compte — HairTrack" },
      {
        property: "og:description",
        content: "Vos rendez-vous et ceux de vos proches, au même endroit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PageCompte,
});

const LIBELLES: Record<string, string> = {
  a_venir: "Confirmé",
  en_attente_paiement: "En attente de paiement",
  venu: "Terminé",
  no_show: "Non honoré",
  annule: "Annulé",
};

function Cadre({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <Link to="/">
            <img src={logo} alt="HairTrack" className="h-7 w-auto" />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">{children}</main>
    </div>
  );
}

function PageCompte() {
  const [session, setSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === null) return <Cadre>{null}</Cadre>;
  return session ? <Espace /> : <Connexion />;
}

function Connexion() {
  const [email, setEmail] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const [envoi, setEnvoi] = useState(false);

  async function envoyer() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error("Adresse e-mail invalide.");
      return;
    }
    setEnvoi(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/mon-compte` },
    });
    setEnvoi(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEnvoye(true);
  }

  return (
    <Cadre>
      <div className="card-soft space-y-4 p-6">
        <h1 className="text-xl font-semibold">Mon compte</h1>
        {envoye ? (
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Mail className="mt-0.5 h-4 w-4 shrink-0" />
            Un lien de connexion vient d'être envoyé à {email.trim()}. Ouvrez-le depuis cet appareil
            pour accéder à vos rendez-vous.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Indiquez l'adresse e-mail utilisée lors de vos réservations : vous recevrez un lien de
              connexion, sans mot de passe.
            </p>
            <div className="space-y-2">
              <Label htmlFor="c-mail">Adresse e-mail</Label>
              <Input
                id="c-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button onClick={envoyer} disabled={envoi} size="lg" className="w-full">
              Recevoir mon lien de connexion
            </Button>
          </>
        )}
      </div>
    </Cadre>
  );
}

type FormProche = { id?: string; prenom: string; nom: string; date_naissance: string };
const VIDE: FormProche = { prenom: "", nom: "", date_naissance: "" };

function Espace() {
  const charger = useServerFn(espaceClientFn);
  const ajouter = useServerFn(ajouterProcheFn);
  const modifier = useServerFn(modifierProcheFn);
  const supprimer = useServerFn(supprimerProcheFn);
  const queryClient = useQueryClient();
  const [filtre, setFiltre] = useState<string>("tous");
  const [form, setForm] = useState<FormProche | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["espace-client"],
    queryFn: () => charger(),
  });

  const proches = data?.proches ?? [];
  const rdv = (data?.rdv ?? []).filter((r) =>
    filtre === "tous"
      ? true
      : filtre === "moi"
        ? !r.beneficiaire_id
        : r.beneficiaire_id === filtre,
  );

  async function enregistrer() {
    if (!form) return;
    setEnvoi(true);
    try {
      const charge = {
        prenom: form.prenom,
        nom: form.nom,
        date_naissance: form.date_naissance || null,
      };
      if (form.id) await modifier({ data: { id: form.id, ...charge } });
      else await ajouter({ data: charge });
      await queryClient.invalidateQueries({ queryKey: ["espace-client"] });
      setForm(null);
      toast.success("Proche enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enregistrement impossible");
    }
    setEnvoi(false);
  }

  async function retirer(id: string) {
    try {
      await supprimer({ data: { id } });
      await queryClient.invalidateQueries({ queryKey: ["espace-client"] });
      toast.success("Proche supprimé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Suppression impossible");
    }
  }

  async function deconnexion() {
    await supabase.auth.signOut();
    queryClient.clear();
  }

  return (
    <Cadre>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Mes rendez-vous</h1>
        <Button variant="ghost" size="sm" onClick={deconnexion}>
          Se déconnecter
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: "tous", nom: "Tous" },
          { id: "moi", nom: "Moi" },
          ...proches.map((p) => ({ id: p.id, nom: `${p.prenom} ${p.nom}` })),
        ].map((o) => (
          <button
            key={o.id}
            onClick={() => setFiltre(o.id)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              filtre === o.id
                ? "bg-gold-soft text-gold-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.nom}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : rdv.length === 0 ? (
        <div className="card-soft p-6 text-sm text-muted-foreground">
          Aucun rendez-vous pour cette sélection.
        </div>
      ) : (
        <ul className="space-y-3">
          {rdv.map((r) => (
            <li key={r.id} className="card-soft p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {new Date(r.debut).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}{" "}
                  à {heureFR(r.debut)}
                </p>
                <span className="text-sm text-muted-foreground">
                  {LIBELLES[r.statut] ?? r.statut}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {r.prestation ?? "Prestation"} · {r.duree_min} min · {euro(r.prix)}
                {r.employe ? ` · ${r.employe}` : ""}
              </p>
              <p className="mt-1 text-sm">
                {r.salon}
                {r.beneficiaire && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                    <Users className="h-3 w-3" /> Pour {r.beneficiaire}
                  </span>
                )}
              </p>
              <Link
                to="/reservation/$token"
                params={{ token: r.annulation_token }}
                className="mt-2 inline-block text-sm underline"
              >
                Voir le détail
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Mes proches</h2>
        {proches.length === 0 && !form && (
          <div className="card-soft p-5 text-sm text-muted-foreground">
            Aucun proche enregistré. Ajoutez une fiche pour réserver au nom d'un proche.
          </div>
        )}
        {proches.length > 0 && (
          <ul className="card-soft divide-y divide-border">
            {proches.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                  {p.prenom.slice(0, 1).toUpperCase()}
                </span>
                <span className="flex-1">
                  <span className="block font-medium">
                    {p.prenom} {p.nom}
                  </span>
                  {p.date_naissance && (
                    <span className="text-xs text-muted-foreground">
                      Né(e) le{" "}
                      {new Date(`${p.date_naissance}T12:00:00`).toLocaleDateString("fr-FR")}
                    </span>
                  )}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setForm({
                      id: p.id,
                      prenom: p.prenom,
                      nom: p.nom,
                      date_naissance: p.date_naissance ?? "",
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => retirer(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        {form ? (
          <div className="card-soft space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="f-prenom">Prénom</Label>
                <Input
                  id="f-prenom"
                  value={form.prenom}
                  onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="f-nom">Nom</Label>
                <Input
                  id="f-nom"
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="f-naissance">Date de naissance (optionnel)</Label>
              <Input
                id="f-naissance"
                type="date"
                value={form.date_naissance}
                onChange={(e) => setForm({ ...form, date_naissance: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={enregistrer} disabled={envoi}>
                <Check className="mr-2 h-4 w-4" /> Enregistrer
              </Button>
              <Button variant="ghost" onClick={() => setForm(null)}>
                Annuler
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setForm({ ...VIDE })}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter un proche
          </Button>
        )}
        <p className="text-xs text-muted-foreground">
          Les confirmations, rappels et annulations sont toujours envoyés à votre adresse e-mail et à
          votre numéro, jamais à ceux d'un proche.
        </p>
      </section>
    </Cadre>
  );
}
