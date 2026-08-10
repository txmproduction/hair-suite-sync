import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useContexte } from "@/components/AppShell";
import { useClients } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ChevronRight, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clients")({
  component: Clients,
});

function Clients() {
  const { data: ctx } = useContexte();
  const salonId = ctx?.employe?.salon_id;
  const queryClient = useQueryClient();
  const { data: clients = [] } = useClients(salonId);
  const [recherche, setRecherche] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");

  const filtres = clients.filter(
    (c) =>
      c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      (c.telephone ?? "").includes(recherche),
  );

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    if (!salonId) return;
    const { error } = await supabase.from("clients").insert({
      salon_id: salonId,
      nom,
      telephone: telephone || null,
      email: email || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Client créé");
    setNom("");
    setTelephone("");
    setEmail("");
    setOuvert(false);
    queryClient.invalidateQueries({ queryKey: ["clients"] });
  }

  return (
    <AppShell
      titre="Clients"
      action={
        <Button onClick={() => setOuvert(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau client
        </Button>
      }
    >
      <Input
        placeholder="Rechercher par nom ou téléphone"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        className="mb-4 bg-card"
      />
      <div className="card-soft divide-y divide-border">
        {filtres.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">Aucun client trouvé.</p>
        )}
        {filtres.map((c) => (
          <Link
            key={c.id}
            to="/clients/$clientId"
            params={{ clientId: c.id }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-secondary"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.nom}</p>
              <p className="text-xs text-muted-foreground">{c.telephone ?? "—"}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau client</DialogTitle>
          </DialogHeader>
          <form onSubmit={creer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-nom">Nom</Label>
              <Input id="c-nom" required value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-tel">Téléphone</Label>
              <Input id="c-tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-mail">E-mail</Label>
              <Input
                id="c-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Créer
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
