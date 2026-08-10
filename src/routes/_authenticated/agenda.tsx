import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useContexte } from "@/components/AppShell";
import { useClients, useEmployes, useHorairesSalon, usePrestations, useRdv } from "@/lib/queries";
import {
  calculAcompte,
  dateISO,
  euro,
  heureFR,
  JOURS,
  jourIndex,
  MOYENS,
  STATUTS,
  type MoyenPaiement,
  type StatutRdv,
} from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: Agenda,
});

const ROW = 22; // hauteur d'un créneau de 15 min

function Agenda() {
  const { data: ctx } = useContexte();
  const salonId = ctx?.employe?.salon_id;
  const queryClient = useQueryClient();

  const [jour, setJour] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [vue, setVue] = useState<"jour" | "semaine">("jour");
  const [employeSemaine, setEmployeSemaine] = useState<string>("");

  const { data: employes = [] } = useEmployes(salonId);
  const { data: prestations = [] } = usePrestations(salonId);
  const { data: clients = [] } = useClients(salonId);
  const { data: horaires = [] } = useHorairesSalon(salonId);

  const finPeriode = useMemo(() => {
    const d = new Date(jour);
    d.setDate(d.getDate() + (vue === "jour" ? 1 : 7));
    return d;
  }, [jour, vue]);

  const { data: rdvs = [] } = useRdv(salonId, jour, finPeriode);

  const [minH, maxH] = useMemo(() => {
    if (!horaires.length) return [8, 20];
    const ouvertes = horaires.filter((h) => !h.ferme);
    if (!ouvertes.length) return [8, 20];
    const min = Math.min(...ouvertes.map((h) => Number(h.ouverture.slice(0, 2))));
    const max = Math.max(...ouvertes.map((h) => Number(h.fermeture.slice(0, 2))));
    return [min, Math.max(max, min + 1)];
  }, [horaires]);

  const creneaux = useMemo(() => {
    const out: number[] = [];
    for (let m = minH * 60; m < maxH * 60; m += 15) out.push(m);
    return out;
  }, [minH, maxH]);

  const colonnes = useMemo(() => {
    if (vue === "jour") {
      return employes.map((e) => ({ id: e.id, libelle: e.nom, date: jour }));
    }
    const emp = employeSemaine || employes[0]?.id || "";
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(jour);
      d.setDate(d.getDate() + i);
      return { id: emp, libelle: `${JOURS[i]} ${d.getDate()}`, date: d };
    });
  }, [vue, employes, jour, employeSemaine]);

  // Création / détail
  const [creation, setCreation] = useState<{ employeId: string; date: Date; minutes: number } | null>(
    null,
  );
  const [detail, setDetail] = useState<(typeof rdvs)[number] | null>(null);

  function rdvDeColonne(col: { id: string; date: Date }) {
    return rdvs.filter(
      (r) =>
        r.employe_id === col.id &&
        dateISO(new Date(r.debut)) === dateISO(col.date) &&
        r.statut !== "annule",
    );
  }

  async function deplacer(rdvId: string, employeId: string, date: Date, minutes: number) {
    const d = new Date(date);
    d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    const { error } = await supabase
      .from("rdv")
      .update({ employe_id: employeId, debut: d.toISOString() })
      .eq("id", rdvId);
    if (error) { toast.error(error.message); return; }
    toast.success("Rendez-vous déplacé");
    queryClient.invalidateQueries({ queryKey: ["rdv"] });
  }

  const titreJour =
    vue === "jour"
      ? jour.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
      : `Semaine du ${jour.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Précédent"
            onClick={() => {
              const d = new Date(jour);
              d.setDate(d.getDate() - (vue === "jour" ? 1 : 7));
              setJour(d);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Suivant"
            onClick={() => {
              const d = new Date(jour);
              d.setDate(d.getDate() + (vue === "jour" ? 1 : 7));
              setJour(d);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              setJour(vue === "semaine" ? debutSemaineLocal(d) : d);
            }}
          >
            Aujourd'hui
          </Button>
        </div>
        <h1 className="text-lg font-semibold capitalize">{titreJour}</h1>
        <div className="ml-auto flex items-center gap-2">
          {vue === "semaine" && (
            <Select
              value={employeSemaine || employes[0]?.id || ""}
              onValueChange={setEmployeSemaine}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Employé" />
              </SelectTrigger>
              <SelectContent>
                {employes.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Tabs
            value={vue}
            onValueChange={(v) => {
              const next = v as "jour" | "semaine";
              setVue(next);
              if (next === "semaine") setJour(debutSemaineLocal(jour));
            }}
          >
            <TabsList>
              <TabsTrigger value="jour">Jour</TabsTrigger>
              <TabsTrigger value="semaine">Semaine</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {employes.length === 0 ? (
        <div className="card-soft p-6 text-sm text-muted-foreground">
          Ajoutez vos employés dans l'onglet Admin pour afficher l'agenda.
        </div>
      ) : (
        <div className="card-soft overflow-x-auto p-3">
          <div className="flex min-w-max">
            <div className="w-14 shrink-0 pt-9">
              {creneaux.map((m) => (
                <div key={m} style={{ height: ROW }} className="relative">
                  {m % 60 === 0 && (
                    <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                      {String(Math.floor(m / 60)).padStart(2, "0")}:00
                    </span>
                  )}
                </div>
              ))}
            </div>
            {colonnes.map((col, ci) => (
              <div key={`${col.id}-${ci}`} className="w-40 shrink-0 border-l border-border px-1">
                <div className="sticky top-0 mb-1 truncate pb-2 text-center text-sm font-medium capitalize">
                  {col.libelle}
                </div>
                <div className="relative">
                  {creneaux.map((m) => (
                    <div
                      key={m}
                      style={{ height: ROW }}
                      onClick={() => setCreation({ employeId: col.id, date: col.date, minutes: m })}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        const id = e.dataTransfer.getData("text/plain");
                        if (id) deplacer(id, col.id, col.date, m);
                      }}
                      className={`cursor-pointer transition-colors hover:bg-secondary ${
                        m % 60 === 0 ? "border-t border-border" : "border-t border-border/40"
                      }`}
                    />
                  ))}
                  {rdvDeColonne(col).map((r) => {
                    const d = new Date(r.debut);
                    const top = ((d.getHours() * 60 + d.getMinutes() - minH * 60) / 15) * ROW;
                    const couleur = r.prestations?.couleur ?? "#C9A227";
                    return (
                      <button
                        key={r.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", r.id)}
                        onClick={() => setDetail(r)}
                        style={{
                          top,
                          height: (r.duree_min / 15) * ROW - 2,
                          borderLeft: `4px solid ${couleur}`,
                          backgroundColor: `${couleur}22`,
                        }}
                        className="absolute inset-x-0 overflow-hidden rounded-md px-2 py-1 text-left text-xs leading-tight"
                      >
                        <span className="block truncate font-semibold">
                          {r.clients?.nom ?? "Client"}
                        </span>
                        <span className="block truncate text-muted-foreground">
                          {r.prestations?.nom}
                        </span>
                        <span className="flex flex-wrap items-center gap-1">
                          {r.origine === "en_ligne" && (
                            <span className="rounded-full bg-gold-soft px-1.5 text-[10px] font-medium text-gold-foreground">
                              En ligne
                            </span>
                          )}
                          {r.statut !== "a_venir" && (
                            <span className="truncate text-[10px] uppercase text-muted-foreground">
                              {STATUTS.find((s) => s.value === r.statut)?.label ??
                                (r.statut === "en_attente_paiement" ? "Attente paiement" : r.statut)}
                            </span>
                          )}
                        </span>

                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {creation && (
        <DialogCreation
          creation={creation}
          onClose={() => setCreation(null)}
          salonId={salonId!}
          employes={employes}
          prestations={prestations}
          clients={clients}
          acompteAuto={(prix: number) => calculAcompte(prix, ctx?.parametres ?? null)}
        />
      )}
      {detail && (
        <DialogDetail
          rdv={detail}
          onClose={() => setDetail(null)}
          prestations={prestations}
          employes={employes}
          monEmployeId={ctx?.employe?.id ?? null}
          delaiAnnulation={ctx?.parametres?.delai_annulation_h ?? 24}
        />
      )}
    </AppShell>
  );
}

function debutSemaineLocal(d: Date) {
  const r = new Date(d);
  r.setDate(r.getDate() - jourIndex(r));
  r.setHours(0, 0, 0, 0);
  return r;
}

type Employe = { id: string; nom: string };
type Prestation = {
  id: string;
  nom: string;
  prix: number;
  duree_min: number;
  categorie_id: string | null;
};
type ClientLeger = { id: string; nom: string; telephone: string | null };

function DialogCreation({
  creation,
  onClose,
  salonId,
  employes,
  prestations,
  clients,
  acompteAuto,
}: {
  creation: { employeId: string; date: Date; minutes: number };
  onClose: () => void;
  salonId: string;
  employes: Employe[];
  prestations: Prestation[];
  clients: ClientLeger[];
  acompteAuto: (prix: number) => number;
}) {
  const queryClient = useQueryClient();
  const [recherche, setRecherche] = useState("");
  const [clientId, setClientId] = useState<string>("");
  const [nouveauNom, setNouveauNom] = useState("");
  const [nouveauTel, setNouveauTel] = useState("");
  const [prestationId, setPrestationId] = useState<string>(prestations[0]?.id ?? "");
  const [employeId, setEmployeId] = useState(creation.employeId);
  const [heure, setHeure] = useState(
    `${String(Math.floor(creation.minutes / 60)).padStart(2, "0")}:${String(
      creation.minutes % 60,
    ).padStart(2, "0")}`,
  );
  const [enCours, setEnCours] = useState(false);

  const resultats = recherche.trim()
    ? clients
        .filter(
          (c) =>
            c.nom.toLowerCase().includes(recherche.toLowerCase()) ||
            (c.telephone ?? "").includes(recherche),
        )
        .slice(0, 6)
    : [];
  const clientChoisi = clients.find((c) => c.id === clientId);
  const prestation = prestations.find((p) => p.id === prestationId);

  async function enregistrer() {
    if (!prestation) { toast.error("Choisissez une prestation"); return; }
    setEnCours(true);
    try {
      let idClient = clientId;
      if (!idClient) {
        if (!nouveauNom.trim()) throw new Error("Renseignez un client");
        const { data, error } = await supabase
          .from("clients")
          .insert({ salon_id: salonId, nom: nouveauNom.trim(), telephone: nouveauTel || null })
          .select()
          .single();
        if (error) throw error;
        idClient = data.id;
      }
      const [h, m] = heure.split(":").map(Number);
      const debut = new Date(creation.date);
      debut.setHours(h ?? 9, m ?? 0, 0, 0);

      const { error } = await supabase.from("rdv").insert({
        salon_id: salonId,
        client_id: idClient,
        employe_id: employeId,
        prestation_id: prestation.id,
        debut: debut.toISOString(),
        duree_min: prestation.duree_min,
        acompte: acompteAuto(Number(prestation.prix)),
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["rdv"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Rendez-vous créé");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur");
    } finally {
      setEnCours(false);
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau rendez-vous</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Client</Label>
            {clientChoisi ? (
              <div className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm">
                <span>
                  {clientChoisi.nom}
                  {clientChoisi.telephone ? ` — ${clientChoisi.telephone}` : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setClientId("")}>
                  Changer
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Rechercher un client (nom ou téléphone)"
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                />
                {resultats.length > 0 && (
                  <div className="divide-y divide-border rounded-md border border-border">
                    {resultats.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setClientId(c.id);
                          setRecherche("");
                        }}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-secondary"
                      >
                        {c.nom}
                        {c.telephone ? ` — ${c.telephone}` : ""}
                      </button>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Nouveau : nom"
                    value={nouveauNom}
                    onChange={(e) => setNouveauNom(e.target.value)}
                  />
                  <Input
                    placeholder="Téléphone"
                    value={nouveauTel}
                    onChange={(e) => setNouveauTel(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Prestation</Label>
            <Select value={prestationId} onValueChange={setPrestationId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {prestations.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nom} — {p.duree_min} min — {euro(Number(p.prix))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Employé</Label>
              <Select value={employeId} onValueChange={setEmployeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employes.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="heure">Heure</Label>
              <Input
                id="heure"
                type="time"
                step={300}
                value={heure}
                onChange={(e) => setHeure(e.target.value)}
              />
            </div>
          </div>

          {prestation && (
            <p className="text-sm text-muted-foreground">
              Durée bloquée : {prestation.duree_min} min · Acompte :{" "}
              {euro(acompteAuto(Number(prestation.prix)))}
            </p>
          )}

          <Button className="w-full" onClick={enregistrer} disabled={enCours}>
            Enregistrer le rendez-vous
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DialogDetail({
  rdv,
  onClose,
  prestations,
  employes,
  monEmployeId,
  delaiAnnulation,
}: {
  rdv: {
    id: string;
    salon_id: string;
    client_id: string | null;
    employe_id: string;
    prestation_id: string | null;
    debut: string;
    duree_min: number;
    statut: StatutRdv;
    acompte: number;
    clients: { nom: string; telephone: string | null } | null;
    prestations: { nom: string; couleur: string; prix: number; duree_min: number } | null;
  };
  onClose: () => void;
  prestations: Prestation[];
  employes: Employe[];
  monEmployeId: string | null;
  delaiAnnulation: number;
}) {
  const queryClient = useQueryClient();
  const [prestationId, setPrestationId] = useState(rdv.prestation_id ?? "");
  const [employeId, setEmployeId] = useState(rdv.employe_id);
  const [heure, setHeure] = useState(
    new Date(rdv.debut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
  );
  const [encaisser, setEncaisser] = useState(false);
  const [moyen, setMoyen] = useState<MoyenPaiement>("cb");

  const prix = Number(rdv.prestations?.prix ?? 0);
  const solde = Math.max(prix - Number(rdv.acompte ?? 0), 0);

  function rafraichir() {
    queryClient.invalidateQueries({ queryKey: ["rdv"] });
    queryClient.invalidateQueries({ queryKey: ["encaissements"] });
  }

  async function enregistrer() {
    const presta = prestations.find((p) => p.id === prestationId);
    const [h, m] = heure.split(":").map(Number);
    const debut = new Date(rdv.debut);
    debut.setHours(h ?? 9, m ?? 0, 0, 0);
    const { error } = await supabase
      .from("rdv")
      .update({
        prestation_id: prestationId || null,
        employe_id: employeId,
        debut: debut.toISOString(),
        duree_min: presta?.duree_min ?? rdv.duree_min,
      })
      .eq("id", rdv.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Rendez-vous modifié");
    rafraichir();
    onClose();
  }

  async function changerStatut(statut: StatutRdv) {
    const { error } = await supabase.from("rdv").update({ statut }).eq("id", rdv.id);
    if (error) { toast.error(error.message); return; }
    rafraichir();
    onClose();
  }

  async function validerEncaissement() {
    const { error } = await supabase.from("encaissements").insert({
      salon_id: rdv.salon_id,
      employe_id: rdv.employe_id || monEmployeId,
      rdv_id: rdv.id,
      client_id: rdv.client_id,
      montant: solde,
      moyen,
      lignes: [{ nom: rdv.prestations?.nom ?? "Prestation", prix }],
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("rdv").update({ statut: "venu" }).eq("id", rdv.id);
    toast.success(`Encaissé ${euro(solde)}`);
    rafraichir();
    onClose();
  }

  const heuresAvant = (new Date(rdv.debut).getTime() - Date.now()) / 3600000;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{rdv.clients?.nom ?? "Rendez-vous"}</DialogTitle>
        </DialogHeader>

        {encaisser ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4 text-sm">
              <div className="flex justify-between">
                <span>{rdv.prestations?.nom}</span>
                <span>{euro(prix)}</span>
              </div>
              {Number(rdv.acompte) > 0 && (
                <div className="mt-1 flex justify-between text-muted-foreground">
                  <span>Acompte déjà versé</span>
                  <span>− {euro(Number(rdv.acompte))}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
                <span>Solde à encaisser</span>
                <span>{euro(solde)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {MOYENS.map((m) => (
                <Button
                  key={m.value}
                  variant={moyen === m.value ? "default" : "outline"}
                  className="h-14 text-base"
                  onClick={() => setMoyen(m.value)}
                >
                  {m.label}
                </Button>
              ))}
            </div>
            <Button className="h-14 w-full text-base" onClick={validerEncaissement}>
              Valider l'encaissement
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setEncaisser(false)}>
              Retour
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {heureFR(rdv.debut)} · {rdv.duree_min} min ·{" "}
              {rdv.clients?.telephone ?? "sans téléphone"}
            </p>
            <div className="space-y-2">
              <Label>Prestation</Label>
              <Select value={prestationId} onValueChange={setPrestationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir" />
                </SelectTrigger>
                <SelectContent>
                  {prestations.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nom} — {p.duree_min} min
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Employé</Label>
                <Select value={employeId} onValueChange={setEmployeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employes.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="h-detail">Heure</Label>
                <Input
                  id="h-detail"
                  type="time"
                  step={300}
                  value={heure}
                  onChange={(e) => setHeure(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Statut</Label>
              <div className="flex flex-wrap gap-2">
                {STATUTS.map((s) => (
                  <Button
                    key={s.value}
                    size="sm"
                    variant={rdv.statut === s.value ? "default" : "outline"}
                    onClick={() => changerStatut(s.value)}
                  >
                    {s.label}
                  </Button>
                ))}
              </div>
            </div>
            {heuresAvant > 0 && heuresAvant < delaiAnnulation && (
              <p className="text-sm text-destructive">
                Annulation hors délai ({delaiAnnulation} h) : l'acompte reste dû.
              </p>
            )}
            <div className="flex flex-col gap-2">
              <Button className="h-12" onClick={() => setEncaisser(true)}>
                Terminer et encaisser
              </Button>
              <Button variant="outline" onClick={enregistrer}>
                Enregistrer les modifications
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
