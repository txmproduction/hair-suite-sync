import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-light.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Connexion — HairTrack" },
      {
        name: "description",
        content: "Connectez-vous à HairTrack pour gérer l'agenda et la caisse de votre salon.",
      },
      { property: "og:title", content: "Connexion — HairTrack" },
      {
        property: "og:description",
        content: "Accédez à l'agenda, la caisse et les statistiques de votre salon.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/agenda", replace: true });
    });
  }, [navigate]);

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    try {
      if (mode === "connexion") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: motDePasse,
        });
        if (error) throw error;
        navigate({ to: "/agenda", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: motDePasse,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/bienvenue", replace: true });
        else toast.success("Vérifiez votre boîte mail pour confirmer votre compte.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 flex justify-center">
          <img src={logo} alt="HairTrack" className="h-9 w-auto" />
        </Link>
        <div className="card-soft p-6">
          <h1 className="text-xl font-semibold">
            {mode === "connexion" ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "connexion"
              ? "Accédez à votre salon."
              : "Créez votre compte gérant ou rejoignez votre salon."}
          </p>
          <form onSubmit={soumettre} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mdp">Mot de passe</Label>
              <Input
                id="mdp"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "connexion" ? "current-password" : "new-password"}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={chargement}>
              {mode === "connexion" ? "Se connecter" : "Créer mon compte"}
            </Button>
          </form>
          <button
            onClick={() => setMode(mode === "connexion" ? "inscription" : "connexion")}
            className="mt-4 w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "connexion"
              ? "Pas encore de compte ? Créer un compte"
              : "J'ai déjà un compte"}
          </button>
        </div>
      </div>
    </div>
  );
}
