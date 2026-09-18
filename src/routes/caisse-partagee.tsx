import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { deverrouillerPinFn, personnelAppareilFn } from "@/lib/pin.functions";
import {
  enregistrerAppareil,
  oublierAppareil,
  tokenAppareil,
} from "@/lib/appareil-partage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Delete, Lock } from "lucide-react";
import logo from "@/assets/logo-light.png";

export const Route = createFileRoute("/caisse-partagee")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Caisse partagée — HairTrack" },
      {
        name: "description",
        content:
          "Écran d'identification de la tablette de comptoir : chaque personne saisit son code pour accéder à sa caisse.",
      },
      { property: "og:title", content: "Caisse partagée — HairTrack" },
      {
        property: "og:description",
        content: "Identification par code sur la tablette partagée du salon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CaissePartagee,
});


type Membre = { id: string; nom: string; photo_url: string | null; role: string };

function CaissePartagee() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [saisieToken, setSaisieToken] = useState("");
  const [salon, setSalon] = useState("");
  const [personnel, setPersonnel] = useState<Membre[]>([]);
  const [choisi, setChoisi] = useState<Membre | null>(null);
  const [pin, setPin] = useState("");
  const [occupe, setOccupe] = useState(false);

  // Écran neutre : personne ne doit rester identifié en arrière-plan.
  useEffect(() => {
    (async () => {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      // Lien d'installation fourni par le gérant : ?appareil=<jeton>
      const params = new URLSearchParams(window.location.search);
      const fourni = params.get("appareil");
      if (fourni) {
        enregistrerAppareil(fourni);
        window.history.replaceState(null, "", "/caisse-partagee");
      }
      setToken(tokenAppareil());
    })();
  }, [queryClient]);


  useEffect(() => {
    if (!token) return;
    personnelAppareilFn({ data: { token } })
      .then((r) => {
        setSalon(r.salon);
        setPersonnel(r.personnel);
      })
      .catch(() => {
        oublierAppareil();
        setToken(null);
        toast.error("Cet appareil n'est plus reconnu, demandez un nouveau code au gérant.");
      });
  }, [token]);

  async function associer(e: React.FormEvent) {
    e.preventDefault();
    const t = saisieToken.trim();
    if (!t) return;
    setOccupe(true);
    try {
      await personnelAppareilFn({ data: { token: t } });
      enregistrerAppareil(t);
      setToken(t);
      setSaisieToken("");
    } catch {
      toast.error("Code d'appareil invalide.");
    } finally {
      setOccupe(false);
    }
  }

  async function valider(code: string) {
    if (!token || !choisi) return;
    setOccupe(true);
    try {
      const { tokenHash } = await deverrouillerPinFn({
        data: { token, employeId: choisi.id, pin: code },
      });
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "email" });
      if (error) throw error;
      setPin("");
      setChoisi(null);
      navigate({ to: choisi.role === "gerant" ? "/agenda" : "/caisse", replace: true });
    } catch (error) {
      setPin("");
      toast.error(error instanceof Error ? error.message : "Code incorrect");
    } finally {
      setOccupe(false);
    }
  }

  function taper(chiffre: string) {
    const suite = (pin + chiffre).slice(0, 4);
    setPin(suite);
    if (suite.length === 4) valider(suite);
  }

  if (!token) {
    return (
      <Cadre>
        <h1 className="text-xl font-semibold">Associer cette tablette</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saisissez le code d'appareil fourni par le gérant du salon (Admin → Appareils partagés).
        </p>
        <form onSubmit={associer} className="mt-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code-appareil">Code d'appareil</Label>
            <Input
              id="code-appareil"
              value={saisieToken}
              onChange={(e) => setSaisieToken(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button type="submit" className="w-full" disabled={occupe}>
            Associer
          </Button>
        </form>
      </Cadre>
    );
  }

  if (!choisi) {
    return (
      <Cadre large>
        <p className="text-sm text-muted-foreground">{salon}</p>
        <h1 className="text-xl font-semibold">Qui êtes-vous ?</h1>
        {personnel.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucun code n'a encore été créé. Le gérant doit définir un code pour chaque personne.
          </p>
        )}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {personnel.map((m) => (
            <button
              key={m.id}
              onClick={() => setChoisi(m)}
              className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
            >
              {m.photo_url ? (
                <img src={m.photo_url} alt={m.nom} className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft text-base font-semibold text-gold-foreground">
                  {m.nom.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium">{m.nom}</span>
            </button>
          ))}
        </div>
      </Cadre>
    );
  }

  return (
    <Cadre>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        Code de {choisi.nom}
      </div>
      <div className="mt-4 flex justify-center gap-3">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${pin.length > i ? "bg-foreground" : "bg-border"}`}
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((c) => (
          <Button
            key={c}
            variant="outline"
            className="h-16 text-xl"
            disabled={occupe}
            onClick={() => taper(c)}
          >
            {c}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="h-16"
          onClick={() => {
            setPin("");
            setChoisi(null);
          }}
        >
          Retour
        </Button>
        <Button variant="outline" className="h-16 text-xl" disabled={occupe} onClick={() => taper("0")}>
          0
        </Button>
        <Button
          variant="ghost"
          className="h-16"
          aria-label="Effacer"
          onClick={() => setPin(pin.slice(0, -1))}
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>
    </Cadre>
  );
}

function Cadre({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className={large ? "w-full max-w-xl" : "w-full max-w-sm"}>
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="HairTrack" className="h-9 w-auto" />
        </div>
        <div className="card-soft p-6">{children}</div>
      </div>
    </div>
  );
}
