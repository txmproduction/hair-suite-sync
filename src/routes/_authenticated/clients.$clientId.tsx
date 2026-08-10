import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { dateFR, euro, heureFR, STATUTS } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/clients/$clientId")({
  component: FicheClient,
});

function FicheClient() {
  const { clientId } = Route.useParams();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState("");

  const { data } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const [{ data: client, error }, { data: rdvs }, { data: encaissements }] = await Promise.all([
        supabase.from("clients").select("*").eq("id", clientId).single(),
        supabase
          .from("rdv")
          .select("*, prestations(nom, prix), employes(nom)")
          .eq("client_id", clientId)
          .order("debut", { ascending: false }),
        supabase.from("encaissements").select("montant").eq("client_id", clientId),
      ]);
      if (error) throw error;
      return { client, rdvs: rdvs ?? [], encaissements: encaissements ?? [] };
    },
  });

  useEffect(() => {
    if (data?.client) setNotes(data.client.notes ?? "");
  }, [data?.client]);

  const totalDepense = (data?.encaissements ?? []).reduce((s, e) => s + Number(e.montant), 0);

  async function enregistrerNotes() {
    const { error } = await supabase.from("clients").update({ notes }).eq("id", clientId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Notes enregistrées");
    queryClient.invalidateQueries({ queryKey: ["client", clientId] });
  }

  return (
    <AppShell>
      <Link
        to="/clients"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Tous les clients
      </Link>

      <div className="card-soft mb-4 p-5">
        <h1 className="text-2xl font-semibold">{data?.client?.nom ?? "…"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {data?.client?.telephone ?? "—"}
          {data?.client?.email ? ` · ${data.client.email}` : ""}
        </p>
        <p className="mt-4 text-sm">
          Total dépensé :{" "}
          <span className="text-lg font-semibold text-gold-foreground">{euro(totalDepense)}</span>
        </p>
      </div>

      <div className="card-soft mb-4 divide-y divide-border">
        <h2 className="px-5 py-3 text-sm font-semibold text-muted-foreground">
          Historique des rendez-vous
        </h2>
        {(data?.rdvs ?? []).length === 0 && (
          <p className="px-5 py-6 text-sm text-muted-foreground">Aucun rendez-vous.</p>
        )}
        {(data?.rdvs ?? []).map((r) => (
          <div key={r.id} className="flex items-center gap-3 px-5 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{r.prestations?.nom ?? "Prestation"}</p>
              <p className="text-xs text-muted-foreground">
                {dateFR(r.debut)} à {heureFR(r.debut)} · {r.employes?.nom ?? "—"}
              </p>
            </div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs">
              {STATUTS.find((s) => s.value === r.statut)?.label}
            </span>
            <span className="text-sm font-medium">{euro(Number(r.prestations?.prix ?? 0))}</span>
          </div>
        ))}
      </div>

      <div className="card-soft p-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Notes</h2>
        <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button className="mt-3" onClick={enregistrerNotes}>
          Enregistrer
        </Button>
      </div>
    </AppShell>
  );
}
