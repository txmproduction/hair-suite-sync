import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell, useContexte } from "@/components/AppShell";
import { useCategories, useEmployes, useHorairesSalon, usePrestations } from "@/lib/queries";
import { euro, JOURS } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin;
});

function Admin() {
  const { data: ctx } = useContexte();
  if (ctx && ctx.employe?.role !== "gerant") {
    return (
      <AppShell titre="Admin">
        <div className="card-soft p-6 text-sm text-muted-foreground">
          Cette section est réservée au gérant du salon.
        </div>
      </AppShell>
    );
  }
  return (
    <AppShell titre="Administration">
      <Tabs defaultValue="salon">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="salon">Salon</TabsTrigger>
          <TabsTrigger value="employes">Employés</TabsTrigger>
          <TabsTrigger value="prestations">Prestations</TabsTrigger>
          <TabsTrigger value="reservation">Réservation</TabsTrigger>
        </TabsList>
        <TabsContent value="salon">
          <OngletSalon />
        </TabsContent>
        <TabsContent value="employes">
          <OngletEmployes />
        </TabsContent>
        <TabsContent value="prestations">
          <OngletPrestations />
        </TabsContent>
        <TabsContent value="reservation">
          <OngletReservation />
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

/* ---------------- Salon ---------------- */

function OngletSalon() {
  const { data: ctx } = useContexte();
  const queryClient = useQueryClient();
  const salon = ctx?.salon;
  const salonId = salon?.id;
  const { data: horaires = [] } = useHorairesSalon(salonId);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");

  useEffect(() => {
    if (salon) {
      setNom(salon.nom);
      setAdresse(salon.adresse ?? "");
      setTelephone(salon.telephone ?? "");
    }
  }, [salon]);

  async function enregistrer() {
    if (!salonId) return;
    const { error } = await supabase
      .from("salons")
      .update({ nom, adresse, telephone })
      .eq("id", salonId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Salon enregistré");
    queryClient.invalidateQueries();
  }

  async function majHoraire(jour: number, valeurs: Partial<{ ferme: boolean; ouverture: string; fermeture: string }>) {
    if (!salonId) return;
    const existant = horaires.find((h) => h.jour === jour);
    const { error } = existant
      ? await supabase.from("horaires_salon").update(valeurs).eq("id", existant.id)
      : await supabase.from("horaires_salon").insert({ salon_id: salonId, jour, ...valeurs });
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["horaires_salon"] });
  }

  return (
    <div className="space-y-4">
      <div className="card-soft space-y-4 p-5">
        <h2 className="font-semibold">Informations</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="s-nom">Nom</Label>
            <Input id="s-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-adr">Adresse</Label>
            <Input id="s-adr" value={adresse} onChange={(e) => setAdresse(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-tel">Téléphone</Label>
            <Input id="s-tel" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
        </div>
        <Button onClick={enregistrer}>Enregistrer</Button>
      </div>

      <div className="card-soft p-5">
        <h2 className="mb-3 font-semibold">Horaires d'ouverture</h2>
        <div className="space-y-3">
          {JOURS.map((label, jour) => {
            const h = horaires.find((x) => x.jour === jour);
            const ferme = h?.ferme ?? false;
            return (
              <div key={label} className="flex flex-wrap items-center gap-3">
                <span className="w-24 text-sm font-medium">{label}</span>
                <Switch
                  checked={!ferme}
                  onCheckedChange={(v) => majHoraire(jour, { ferme: !v })}
                  aria-label={`Ouvert le ${label}`}
                />
                <Input
                  type="time"
                  step={300}
                  disabled={ferme}
                  value={(h?.ouverture ?? "09:00:00").slice(0, 5)}
                  onChange={(e) => majHoraire(jour, { ouverture: e.target.value })}
                  className="w-28"
                />
                <span className="text-muted-foreground">→</span>
                <Input
                  type="time"
                  step={300}
                  disabled={ferme}
                  value={(h?.fermeture ?? "19:00:00").slice(0, 5)}
                  onChange={(e) => majHoraire(jour, { fermeture: e.target.value })}
                  className="w-28"
                />
                {ferme && <span className="text-sm text-muted-foreground">Fermé</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Employés ---------------- */

function OngletEmployes() {
  const { data: ctx } = useContexte();
  const salonId = ctx?.salon?.id;
  const queryClient = useQueryClient();
  const { data: employes = [] } = useEmployes(salonId, true);
  const [edition, setEdition] = useState<string | null>(null);
  const [ouvert, setOuvert] = useState(false);
  const [form, setForm] = useState({
    nom: "",
    email: "",
    telephone: "",
    photo_url: "",
    voit_ca_global: false,
  });

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!salonId) return;
    const { error } = await supabase.from("employes").insert({
      salon_id: salonId,
      nom: form.nom,
      email: form.email || null,
      telephone: form.telephone || null,
      photo_url: form.photo_url || null,
      voit_ca_global: form.voit_ca_global,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Employé ajouté. Il pourra créer son compte avec cet e-mail.");
    setForm({ nom: "", email: "", telephone: "", photo_url: "", voit_ca_global: false });
    setOuvert(false);
    queryClient.invalidateQueries({ queryKey: ["employes"] });
  }

  async function maj(id: string, valeurs: Record<string, unknown>) {
    const { error } = await supabase.from("employes").update(valeurs).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["employes"] });
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setOuvert(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Ajouter un employé
      </Button>

      <div className="card-soft divide-y divide-border">
        {employes.map((e) => (
          <div key={e.id} className="p-5">
            <div className="flex items-center gap-3">
              {e.photo_url ? (
                <img src={e.photo_url} alt={e.nom} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-sm font-semibold text-gold-foreground">
                  {e.nom.slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {e.nom}
                  {e.role === "gerant" && (
                    <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-xs text-gold-foreground">
                      Gérant
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{e.email ?? "—"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Actif</span>
                <Switch
                  checked={e.actif}
                  onCheckedChange={(v) => maj(e.id, { actif: v })}
                  aria-label={`Activer ${e.nom}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Horaires"
                  onClick={() => setEdition(edition === e.id ? null : e.id)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {edition === e.id && (
              <div className="mt-4 space-y-4 border-t border-border pt-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Nom</Label>
                    <Input
                      defaultValue={e.nom}
                      onBlur={(ev) => maj(e.id, { nom: ev.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone</Label>
                    <Input
                      defaultValue={e.telephone ?? ""}
                      onBlur={(ev) => maj(e.id, { telephone: ev.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo (URL)</Label>
                    <Input
                      defaultValue={e.photo_url ?? ""}
                      onBlur={(ev) => maj(e.id, { photo_url: ev.target.value })}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={e.voit_ca_global}
                    onCheckedChange={(v) => maj(e.id, { voit_ca_global: v })}
                    aria-label="Voit le CA du salon"
                  />
                  <span className="text-sm">Peut voir le chiffre d'affaires du salon</span>
                </div>
                <HorairesEmploye employeId={e.id} salonId={salonId!} />
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={ouvert} onOpenChange={setOuvert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel employé</DialogTitle>
          </DialogHeader>
          <form onSubmit={ajouter} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="e-nom">Nom</Label>
              <Input
                id="e-nom"
                required
                value={form.nom}
                onChange={(ev) => setForm({ ...form, nom: ev.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-mail">E-mail (pour sa connexion)</Label>
              <Input
                id="e-mail"
                type="email"
                value={form.email}
                onChange={(ev) => setForm({ ...form, email: ev.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-tel">Téléphone</Label>
              <Input
                id="e-tel"
                value={form.telephone}
                onChange={(ev) => setForm({ ...form, telephone: ev.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="e-photo">Photo (URL)</Label>
              <Input
                id="e-photo"
                value={form.photo_url}
                onChange={(ev) => setForm({ ...form, photo_url: ev.target.value })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.voit_ca_global}
                onCheckedChange={(v) => setForm({ ...form, voit_ca_global: v })}
                aria-label="Voit le CA du salon"
              />
              <span className="text-sm">Peut voir le CA du salon</span>
            </div>
            <Button type="submit" className="w-full">
              Ajouter
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function HorairesEmploye({ employeId, salonId }: { employeId: string; salonId: string }) {
  const queryClient = useQueryClient();
  const { data: horaires = [] } = useQuery({
    queryKey: ["horaires_employe", employeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horaires_employe")
        .select("*")
        .eq("employe_id", employeId)
        .order("jour");
      if (error) throw error;
      return data;
    },
  });

  async function maj(jour: number, valeurs: Record<string, unknown>) {
    const existant = horaires.find((h) => h.jour === jour);
    const { error } = existant
      ? await supabase.from("horaires_employe").update(valeurs).eq("id", existant.id)
      : await supabase
          .from("horaires_employe")
          .insert({ salon_id: salonId, employe_id: employeId, jour, ...valeurs });
    if (error) {
      toast.error(error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["horaires_employe", employeId] });
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Horaires de travail</h3>
      <div className="space-y-2">
        {JOURS.map((label, jour) => {
          const h = horaires.find((x) => x.jour === jour);
          const travaille = h?.travaille ?? false;
          return (
            <div key={label} className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-sm">{label}</span>
              <Switch
                checked={travaille}
                onCheckedChange={(v) => maj(jour, { travaille: v })}
                aria-label={`Travaille le ${label}`}
              />
              <Input
                type="time"
                step={300}
                disabled={!travaille}
                value={(h?.debut ?? "09:00:00").slice(0, 5)}
                onChange={(e) => maj(jour, { debut: e.target.value })}
                className="w-28"
              />
              <span className="text-muted-foreground">→</span>
              <Input
                type="time"
                step={300}
                disabled={!travaille}
                value={(h?.fin ?? "19:00:00").slice(0, 5)}
                onChange={(e) => maj(jour, { fin: e.target.value })}
                className="w-28"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- Prestations ---------------- */

const COULEURS = ["#C9A227", "#2F6FED", "#1FA97A", "#E4572E", "#8E5BD0", "#5A5A5A"];

function OngletPrestations() {
  const { data: ctx } = useContexte();
  const salonId = ctx?.salon?.id;
  const queryClient = useQueryClient();
  const { data: categories = [] } = useCategories(salonId);
  const { data: prestations = [] } = usePrestations(salonId, true);
  const [nouvelleCat, setNouvelleCat] = useState("");
  const [edition, setEdition] = useState<{
    id?: string;
    categorie_id: string;
    nom: string;
    duree_min: number;
    prix: number;
    couleur: string;
  } | null>(null);

  function rafraichir() {
    queryClient.invalidateQueries({ queryKey: ["prestations"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  async function ajouterCategorie(e: React.FormEvent) {
    e.preventDefault();
    if (!salonId || !nouvelleCat.trim()) return;
    const { error } = await supabase
      .from("categories")
      .insert({ salon_id: salonId, nom: nouvelleCat.trim(), ordre: categories.length });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNouvelleCat("");
    rafraichir();
  }

  async function supprimerCategorie(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    rafraichir();
  }

  async function enregistrerPrestation() {
    if (!salonId || !edition) return;
    const valeurs = {
      salon_id: salonId,
      categorie_id: edition.categorie_id || null,
      nom: edition.nom,
      duree_min: edition.duree_min,
      prix: edition.prix,
      couleur: edition.couleur,
    };
    const { error } = edition.id
      ? await supabase.from("prestations").update(valeurs).eq("id", edition.id)
      : await supabase.from("prestations").insert(valeurs);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Prestation enregistrée");
    setEdition(null);
    rafraichir();
  }

  async function dupliquer(p: (typeof prestations)[number]) {
    const { error } = await supabase.from("prestations").insert({
      salon_id: p.salon_id,
      categorie_id: p.categorie_id,
      nom: `${p.nom} (copie)`,
      duree_min: p.duree_min,
      prix: p.prix,
      couleur: p.couleur,
      ordre: p.ordre + 1,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    rafraichir();
  }

  async function supprimer(id: string) {
    const { error } = await supabase.from("prestations").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    rafraichir();
  }

  async function deplacer(p: (typeof prestations)[number], sens: -1 | 1) {
    const liste = prestations
      .filter((x) => x.categorie_id === p.categorie_id)
      .sort((a, b) => a.ordre - b.ordre);
    const i = liste.findIndex((x) => x.id === p.id);
    const voisin = liste[i + sens];
    if (!voisin) return;
    await supabase.from("prestations").update({ ordre: voisin.ordre }).eq("id", p.id);
    await supabase.from("prestations").update({ ordre: p.ordre }).eq("id", voisin.id);
    rafraichir();
  }

  const groupes = [
    ...categories.map((c) => ({ id: c.id, nom: c.nom })),
    { id: "", nom: "Sans catégorie" },
  ];

  return (
    <div className="space-y-4">
      <div className="card-soft p-5">
        <h2 className="mb-3 font-semibold">Catégories</h2>
        <form onSubmit={ajouterCategorie} className="flex gap-2">
          <Input
            placeholder="Nouvelle catégorie (ex. Couleur)"
            value={nouvelleCat}
            onChange={(e) => setNouvelleCat(e.target.value)}
          />
          <Button type="submit">Ajouter</Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <span
              key={c.id}
              className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-sm"
            >
              {c.nom}
              <button
                onClick={() => supprimerCategorie(c.id)}
                aria-label={`Supprimer ${c.nom}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <Button
        onClick={() =>
          setEdition({
            categorie_id: categories[0]?.id ?? "",
            nom: "",
            duree_min: 30,
            prix: 0,
            couleur: COULEURS[0]!,
          })
        }
      >
        <Plus className="mr-2 h-4 w-4" />
        Nouvelle prestation
      </Button>

      {groupes.map((g) => {
        const liste = prestations
          .filter((p) => (p.categorie_id ?? "") === g.id)
          .sort((a, b) => a.ordre - b.ordre);
        if (!liste.length) return null;
        return (
          <div key={g.id || "sans"} className="card-soft divide-y divide-border">
            <h3 className="px-5 py-3 text-sm font-semibold text-muted-foreground">{g.nom}</h3>
            {liste.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                <span
                  className="h-8 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: p.couleur }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.nom}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.duree_min} min · {euro(Number(p.prix))}
                  </p>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => deplacer(p, -1)}
                    aria-label="Monter"
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deplacer(p, 1)}
                    aria-label="Descendre"
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => dupliquer(p)}
                    aria-label="Dupliquer"
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      setEdition({
                        id: p.id,
                        categorie_id: p.categorie_id ?? "",
                        nom: p.nom,
                        duree_min: p.duree_min,
                        prix: Number(p.prix),
                        couleur: p.couleur,
                      })
                    }
                    aria-label="Modifier"
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => supprimer(p.id)}
                    aria-label="Supprimer"
                    className="rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <Dialog open={!!edition} onOpenChange={(o) => !o && setEdition(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edition?.id ? "Modifier la prestation" : "Nouvelle prestation"}</DialogTitle>
          </DialogHeader>
          {edition && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-nom">Nom</Label>
                <Input
                  id="p-nom"
                  value={edition.nom}
                  onChange={(e) => setEdition({ ...edition, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select
                  value={edition.categorie_id}
                  onValueChange={(v) => setEdition({ ...edition, categorie_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sans catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="p-duree">Durée (min, pas de 5)</Label>
                  <Input
                    id="p-duree"
                    type="number"
                    min={5}
                    step={5}
                    value={edition.duree_min}
                    onChange={(e) =>
                      setEdition({ ...edition, duree_min: Number(e.target.value) })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="p-prix">Prix (€)</Label>
                  <Input
                    id="p-prix"
                    type="number"
                    min={0}
                    step={0.5}
                    value={edition.prix}
                    onChange={(e) => setEdition({ ...edition, prix: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Couleur</Label>
                <div className="flex gap-2">
                  {COULEURS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setEdition({ ...edition, couleur: c })}
                      aria-label={`Couleur ${c}`}
                      style={{ backgroundColor: c }}
                      className={`h-8 w-8 rounded-full ring-offset-2 ${
                        edition.couleur === c ? "ring-2 ring-ring" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
              <Button className="w-full" onClick={enregistrerPrestation}>
                Enregistrer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Réservation ---------------- */

function OngletReservation() {
  const { data: ctx } = useContexte();
  const queryClient = useQueryClient();
  const salonId = ctx?.salon?.id;
  const [type, setType] = useState<"montant" | "pourcentage">("pourcentage");
  const [valeur, setValeur] = useState(0);
  const [delai, setDelai] = useState(24);

  useEffect(() => {
    if (ctx?.parametres) {
      setType(ctx.parametres.acompte_type);
      setValeur(Number(ctx.parametres.acompte_valeur));
      setDelai(ctx.parametres.delai_annulation_h);
    }
  }, [ctx?.parametres]);

  async function enregistrer() {
    if (!salonId) return;
    const { error } = await supabase.from("parametres_salon").upsert({
      salon_id: salonId,
      acompte_type: type,
      acompte_valeur: valeur,
      delai_annulation_h: delai,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Paramètres enregistrés");
    queryClient.invalidateQueries();
  }

  return (
    <div className="card-soft space-y-4 p-5">
      <h2 className="font-semibold">Paramètres de réservation</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Type d'acompte</Label>
          <Select value={type} onValueChange={(v) => setType(v as "montant" | "pourcentage")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pourcentage">Pourcentage</SelectItem>
              <SelectItem value="montant">Montant fixe</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-val">{type === "pourcentage" ? "Acompte (%)" : "Acompte (€)"}</Label>
          <Input
            id="r-val"
            type="number"
            min={0}
            step={type === "pourcentage" ? 1 : 0.5}
            value={valeur}
            onChange={(e) => setValeur(Number(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-delai">Annulation gratuite (heures)</Label>
          <Input
            id="r-delai"
            type="number"
            min={0}
            value={delai}
            onChange={(e) => setDelai(Number(e.target.value))}
          />
        </div>
      </div>
      <Button onClick={enregistrer}>Enregistrer</Button>
    </div>
  );
}
