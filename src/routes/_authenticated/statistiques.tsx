import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell, useContexte } from "@/components/AppShell";
import { useEmployes, useEncaissements } from "@/lib/queries";
import { debutSemaine, euro, MOYENS } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/statistiques")({
  component: Statistiques,
});

type Periode = "jour" | "semaine" | "mois";

function bornes(periode: Periode, decalage = 0) {
  const debut = new Date();
  debut.setHours(0, 0, 0, 0);
  let fin: Date;
  if (periode === "jour") {
    debut.setDate(debut.getDate() + decalage);
    fin = new Date(debut);
    fin.setDate(fin.getDate() + 1);
  } else if (periode === "semaine") {
    const d = debutSemaine(debut);
    d.setDate(d.getDate() + decalage * 7);
    fin = new Date(d);
    fin.setDate(fin.getDate() + 7);
    return [d, fin] as const;
  } else {
    const d = new Date(debut.getFullYear(), debut.getMonth() + decalage, 1);
    fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return [d, fin] as const;
  }
  return [debut, fin] as const;
}

function Statistiques() {
  const { data: ctx } = useContexte();
  const salonId = ctx?.employe?.salon_id;
  const gerant = ctx?.employe?.role === "gerant";
  const [periode, setPeriode] = useState<Periode>("jour");

  const [debut, fin] = useMemo(() => bornes(periode, 0), [periode]);
  const [debutPrec, finPrec] = useMemo(() => bornes(periode, -1), [periode]);

  const { data: employes = [] } = useEmployes(salonId, true);
  const { data: actuels = [] } = useEncaissements(salonId, debut, fin);
  const { data: precedents = [] } = useEncaissements(salonId, debutPrec, finPrec);

  const total = actuels.reduce((s, e) => s + Number(e.montant), 0);
  const totalPrec = precedents.reduce((s, e) => s + Number(e.montant), 0);
  const evolution = totalPrec ? ((total - totalPrec) / totalPrec) * 100 : null;

  const parEmploye = employes
    .map((e) => ({
      nom: e.nom,
      total: actuels
        .filter((a) => a.employe_id === e.id)
        .reduce((s, a) => s + Number(a.montant), 0),
    }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total);

  const parPrestation = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of actuels) {
      const lignes = (e.lignes as { nom: string; prix: number }[] | null) ?? [];
      if (!lignes.length) map.set("Autre", (map.get("Autre") ?? 0) + Number(e.montant));
      for (const l of lignes) map.set(l.nom, (map.get(l.nom) ?? 0) + Number(l.prix));
    }
    return [...map.entries()].map(([nom, total]) => ({ nom, total })).sort((a, b) => b.total - a.total);
  }, [actuels]);

  const parMoyen = MOYENS.map((m) => ({
    label: m.label,
    total: actuels.filter((a) => a.moyen === m.value).reduce((s, a) => s + Number(a.montant), 0),
  })).filter((x) => x.total > 0);

  function exporterCSV() {
    const entetes = ["Date", "Heure", "Employé", "Prestations", "Montant", "Moyen de paiement"];
    const lignes = actuels.map((e) => {
      const d = new Date(e.created_at);
      const presta = ((e.lignes as { nom: string }[] | null) ?? []).map((l) => l.nom).join(" + ");
      return [
        d.toLocaleDateString("fr-FR"),
        d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
        e.employes?.nom ?? "",
        presta,
        String(Number(e.montant).toFixed(2)).replace(".", ","),
        MOYENS.find((m) => m.value === e.moyen)?.label ?? "",
      ];
    });
    const csv = [entetes, ...lignes]
      .map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";"))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `encaissements-${periode}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!gerant && !ctx?.employe?.voit_ca_global) {
    const monTotal = actuels
      .filter((a) => a.employe_id === ctx?.employe?.id)
      .reduce((s, a) => s + Number(a.montant), 0);
    return (
      <AppShell titre="Mon chiffre d'affaires">
        <Tabs value={periode} onValueChange={(v) => setPeriode(v as Periode)} className="mb-4">
          <TabsList>
            <TabsTrigger value="jour">Jour</TabsTrigger>
            <TabsTrigger value="semaine">Semaine</TabsTrigger>
            <TabsTrigger value="mois">Mois</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="card-soft p-6">
          <p className="text-sm text-muted-foreground">Mon CA sur la période</p>
          <p className="mt-2 text-3xl font-semibold">{euro(monTotal)}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      titre="Statistiques"
      action={
        <Button variant="outline" onClick={exporterCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      }
    >
      <Tabs value={periode} onValueChange={(v) => setPeriode(v as Periode)} className="mb-4">
        <TabsList>
          <TabsTrigger value="jour">Jour</TabsTrigger>
          <TabsTrigger value="semaine">Semaine</TabsTrigger>
          <TabsTrigger value="mois">Mois</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <div className="card-soft p-5">
          <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
          <p className="mt-1 text-3xl font-semibold">{euro(total)}</p>
          {evolution !== null && (
            <p
              className={`mt-1 text-xs ${evolution >= 0 ? "text-gold-foreground" : "text-destructive"}`}
            >
              {evolution >= 0 ? "+" : ""}
              {evolution.toFixed(0)} % vs période précédente
            </p>
          )}
        </div>
        <div className="card-soft p-5">
          <p className="text-sm text-muted-foreground">Encaissements</p>
          <p className="mt-1 text-3xl font-semibold">{actuels.length}</p>
        </div>
        <div className="card-soft p-5">
          <p className="text-sm text-muted-foreground">Panier moyen</p>
          <p className="mt-1 text-3xl font-semibold">
            {euro(actuels.length ? total / actuels.length : 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Repartition titre="Par employé" lignes={parEmploye.map((x) => ({ nom: x.nom, total: x.total }))} total={total} />
        <Repartition titre="Par prestation" lignes={parPrestation} total={total} />
        <Repartition
          titre="Par moyen de paiement"
          lignes={parMoyen.map((x) => ({ nom: x.label, total: x.total }))}
          total={total}
        />
      </div>
    </AppShell>
  );
}

function Repartition({
  titre,
  lignes,
  total,
}: {
  titre: string;
  lignes: { nom: string; total: number }[];
  total: number;
}) {
  return (
    <div className="card-soft p-5">
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{titre}</h2>
      {lignes.length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée.</p>}
      <div className="space-y-3">
        {lignes.map((l) => (
          <div key={l.nom}>
            <div className="flex justify-between text-sm">
              <span className="truncate">{l.nom}</span>
              <span className="font-medium">
                {euro(l.total)}
                {total ? ` · ${Math.round((l.total / total) * 100)} %` : ""}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-gold"
                style={{ width: `${total ? (l.total / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
