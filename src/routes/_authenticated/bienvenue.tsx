import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContexte } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-light.png";
import { reclamerInvitationFn } from "@/lib/invitation.functions";
import { infosRepriseFn } from "@/lib/annuaire.functions";
import { reprendreFicheFn } from "@/lib/reprise.functions";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/bienvenue")({
  validateSearch: (search: Record<string, unknown>) => {
    const reprise = typeof search["reprise"] === "string" ? (search["reprise"] as string) : undefined;
    return reprise ? { reprise } : {};
  },
  component: Bienvenue,
});

function Bienvenue() {
  const { data, isLoading, refetch } = useContexte();
  const { reprise } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [nomSalon, setNomSalon] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [nomGerant, setNomGerant] = useState("");
  const [chargement, setChargement] = useState(false);
  const [verifie, setVerifie] = useState(false);

  const { data: fiche } = useQuery({
    queryKey: ["reprise", reprise],
    enabled: !!reprise,
    queryFn: () => infosRepriseFn({ data: { slug: reprise as string } }),
  });

  useEffect(() => {
    if (!fiche) return;
    setNomSalon((v) => v || fiche.nom);
    setAdresse((v) => v || fiche.adresse);
    setTelephone((v) => v || fiche.telephone);
  }, [fiche]);

  useEffect(() => {
    if (data?.employe) {
      navigate({ to: "/agenda", replace: true });
      return;
    }
    if (!isLoading && data && !data.employe && !verifie) {
      setVerifie(true);
      reclamerInvitationFn()
        .then(async ({ salonId }) => {
          if (salonId) {
            await queryClient.invalidateQueries();
            await refetch();
          }
        })
        .catch(() => undefined);
    }
  }, [data, isLoading, navigate, queryClient, refetch, verifie]);

  async function creerSalon(e: React.FormEvent) {
    e.preventDefault();
    setChargement(true);
    try {
      if (reprise && fiche) {
        await reprendreFicheFn({
          data: { slug: reprise, nomSalon, adresse, telephone, nomGerant },
        });
        await queryClient.invalidateQueries();
        toast.success("Fiche reprise, bienvenue !");
        navigate({ to: "/admin", replace: true });
        return;
      }
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Session expirée");

      const { data: salon, error } = await supabase
        .from("salons")
        .insert({
          nom: nomSalon,
          adresse,
          telephone,
          gerant_user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      const { error: eEmp } = await supabase.from("employes").insert({
        salon_id: salon.id,
        user_id: user.id,
        nom: nomGerant || "Gérant",
        email: user.email ?? null,
        role: "gerant",
        voit_ca_global: true,
      });
      if (eEmp) throw eEmp;

      await supabase.from("parametres_salon").insert({ salon_id: salon.id });
      await supabase.from("horaires_salon").insert(
        Array.from({ length: 7 }, (_, jour) => ({
          salon_id: salon.id,
          jour,
          ferme: jour === 6,
        })),
      );

      await queryClient.invalidateQueries();
      toast.success("Salon créé !");
      navigate({ to: "/admin", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur de création");
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <img src={logo} alt="HairTrack" className="h-9 w-auto" />
        </div>
        <div className="card-soft p-6">
          <h1 className="text-xl font-semibold">
            {reprise && fiche ? "Reprenez votre fiche" : "Créez votre salon"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {reprise && fiche
              ? "Les informations connues sont pré-remplies : vérifiez-les et validez pour activer la réservation en ligne."
              : "Vous devenez gérant et pourrez inviter votre équipe."}
          </p>
          <form onSubmit={creerSalon} className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom du salon</Label>
              <Input id="nom" required value={nomSalon} onChange={(e) => setNomSalon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gerant">Votre nom</Label>
              <Input id="gerant" required value={nomGerant} onChange={(e) => setNomGerant(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tel">Téléphone</Label>
              <Input id="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={chargement}>
              {reprise && fiche ? "Reprendre ma fiche" : "Créer le salon"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
