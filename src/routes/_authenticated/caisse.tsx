import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useContexte } from "@/components/AppShell";
import { useEmployes, useEncaissements, usePrestations } from "@/lib/queries";
import { euro, heureFR, MOYENS, type MoyenPaiement } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/caisse")({
  component: Caisse,
});

function Caisse() {
  const { data: ctx } = useContexte();
  const salonId = ctx?.employe?.salon_id;
  const gerant = ctx?.employe?.role === "gerant";
  const queryClient = useQueryClient();
  const [ouvert, setOuvert] = useState(false);

  const [debutJour, finJour] = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const f = new Date(d);
    f.setDate(f.getDate() + 1);
    return [d, f];
  }, []);

  const { data: encaissements = [] } = useEncaissements(salonId, debutJour, finJour);
  const total = encaissements.reduce((s, e) => s + Number(e.montant), 0);

  async function supprimer(id: string) {
    const { error } = await supabase.from("encaissements").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Encaissement supprimé");
    queryClient.invalidateQueries({ queryKey: ["encaissements"] });
  }

  return (
    <AppShell
      titre="Caisse"
      action={
        <Button className="h-12 px-5 text-base" onClick={() => setOuvert(true)}>
          <Plus className="mr-2 h-5 w-5" />
          Encaissement rapide
        </Button>
      }
    >
      <div className="card-soft mb-4 flex items-baseline justify-between p-5">
        <span className="text-sm text-muted-foreground">Total encaissé aujourd'hui</span>
        <span className="text-2xl font-semibold">{euro(total)}</span>
      </div>

      <div className="card-soft divide-y divide-border">
        <h2 className="px-5 py-3 text-sm font-semibold text-muted-foreground">
          Historique du jour
        </h2>
        {encaissements.length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">Aucun encaissement aujourd'hui.</p>
        )}
        {encaissements.map((e) => (
          <div key={e.id} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {(e.lignes as { nom: string }[] | null)?.map((l) => l.nom).join(", ") ||
                  "Encaissement"}
              </p>
              <p className="text-xs text-muted-foreground">
                {heureFR(e.created_at)} · {e.employes?.nom ?? "—"} ·{" "}
                {MOYENS.find((m) => m.value === e.moyen)?.label}
              </p>
            </div>
            <span className="font-semibold">{euro(Number(e.montant))}</span>
            {gerant && (
              <button
                onClick={() => supprimer(e.id)}
                aria-label="Supprimer"
                className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {ouvert && salonId && (
        <DialogRapide
          salonId={salonId}
          employeParDefaut={ctx?.employe?.id ?? ""}
          onClose={() => setOuvert(false)}
        />
      )}
    </AppShell>
  );
}

function DialogRapide({
  salonId,
  employeParDefaut,
  onClose,
}: {
  salonId: string;
  employeParDefaut: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: employes = [] } = useEmployes(salonId);
  const { data: prestations = [] } = usePrestations(salonId);
  const [etape, setEtape] = useState(1);
  const [employeId, setEmployeId] = useState(employeParDefaut);
  const [choisies, setChoisies] = useState<string[]>([]);

  const lignes = choisies
    .map((id) => prestations.find((p) => p.id === id))
    .filter(Boolean) as typeof prestations;
  const total = lignes.reduce((s, p) => s + Number(p.prix), 0);

  async function valider(moyen: MoyenPaiement) {
    const { error } = await supabase.from("encaissements").insert({
      salon_id: salonId,
      employe_id: employeId || null,
      montant: total,
      moyen,
      lignes: lignes.map((p) => ({ nom: p.nom, prix: Number(p.prix) })),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Encaissé ${euro(total)}`);
    queryClient.invalidateQueries({ queryKey: ["encaissements"] });
    onClose();
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {etape === 1 ? "1. Employé" : etape === 2 ? "2. Prestations" : "3. Paiement"}
          </DialogTitle>
        </DialogHeader>

        {etape === 1 && (
          <div className="grid grid-cols-2 gap-2">
            {employes.map((e) => (
              <Button
                key={e.id}
                variant={employeId === e.id ? "default" : "outline"}
                className="h-16 text-base"
                onClick={() => {
                  setEmployeId(e.id);
                  setEtape(2);
                }}
              >
                {e.nom}
              </Button>
            ))}
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-3">
            <div className="grid gap-2">
              {prestations.map((p) => {
                const actif = choisies.includes(p.id);
                return (
                  <Button
                    key={p.id}
                    variant={actif ? "default" : "outline"}
                    className="h-14 justify-between text-base"
                    onClick={() =>
                      setChoisies(actif ? choisies.filter((c) => c !== p.id) : [...choisies, p.id])
                    }
                  >
                    <span className="truncate">{p.nom}</span>
                    <span>{euro(Number(p.prix))}</span>
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-lg font-semibold">{euro(total)}</span>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEtape(1)}>
                  Retour
                </Button>
                <Button disabled={!choisies.length} onClick={() => setEtape(3)}>
                  Continuer
                </Button>
              </div>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="space-y-3">
            <p className="text-center text-3xl font-semibold">{euro(total)}</p>
            <div className="grid grid-cols-2 gap-2">
              {MOYENS.map((m) => (
                <Button key={m.value} className="h-16 text-base" onClick={() => valider(m.value)}>
                  {m.label}
                </Button>
              ))}
            </div>
            <Button variant="ghost" className="w-full" onClick={() => setEtape(2)}>
              Retour
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
