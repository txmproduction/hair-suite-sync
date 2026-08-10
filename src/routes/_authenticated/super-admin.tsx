import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  estSuperAdminFn,
  salonsNonReclamesFn,
  importerSalonsFn,
  convertirEnClientFn,
} from "@/lib/superadmin.functions";
import { CATEGORIES } from "@/lib/categories";

export const Route = createFileRoute("/_authenticated/super-admin")({
  component: SuperAdminPage,
});

type LigneCsv = {
  nom: string;
  adresse: string;
  ville: string;
  telephone: string;
  categorie: string;
  lien_externe: string;
  note_google: string;
  nb_avis_google: string;
  photo_couverture_url: string;
};

function parserCsv(texte: string): LigneCsv[] {
  const lignes = texte
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lignes.length) return [];
  const separateur = (lignes[0] as string).includes(";") ? ";" : ",";
  const premiere = (lignes[0] as string).toLowerCase();
  const corps = premiere.includes("nom") ? lignes.slice(1) : lignes;
  return corps.map((l) => {
    const c = l.split(separateur).map((x) => x.trim().replace(/^"|"$/g, ""));
    return {
      nom: c[0] ?? "",
      adresse: c[1] ?? "",
      ville: c[2] ?? "",
      telephone: c[3] ?? "",
      categorie: c[4] ?? "",
      lien_externe: c[5] ?? "",
      note_google: c[6] ?? "",
      nb_avis_google: c[7] ?? "",
      photo_couverture_url: c[8] ?? "",
    };
  });
}

function SuperAdminPage() {
  const queryClient = useQueryClient();
  const { data: acces, isLoading } = useQuery({
    queryKey: ["super-admin"],
    queryFn: () => estSuperAdminFn(),
  });
  const autorise = !!acces?.superAdmin;

  const { data: salons } = useQuery({
    queryKey: ["salons-non-reclames"],
    enabled: autorise,
    queryFn: () => salonsNonReclamesFn(),
  });

  const [csv, setCsv] = useState("");
  const [source, setSource] = useState("import_csv");
  const [conversion, setConversion] = useState<{ id: string; email: string; nom: string } | null>(
    null,
  );

  const importer = useMutation({
    mutationFn: () => importerSalonsFn({ data: { lignes: parserCsv(csv), source } }),
    onSuccess: (r) => {
      toast.success(`${r.crees} salon(s) importé(s).`);
      if (r.ignores.length) toast.message(`${r.ignores.length} ignoré(s)`, { description: r.ignores.slice(0, 5).join(" · ") });
      setCsv("");
      queryClient.invalidateQueries({ queryKey: ["salons-non-reclames"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertir = useMutation({
    mutationFn: () =>
      convertirEnClientFn({
        data: {
          salonId: conversion!.id,
          email: conversion!.email,
          nomGerant: conversion!.nom,
        },
      }),
    onSuccess: (r) => {
      toast.success(
        r.motDePasse
          ? `Salon converti. Mot de passe provisoire : ${r.motDePasse}`
          : "Salon converti et rattaché au compte existant.",
        { duration: 20000 },
      );
      setConversion(null);
      queryClient.invalidateQueries({ queryKey: ["salons-non-reclames"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <AppShell titre="Super-admin">Chargement…</AppShell>;
  if (!autorise)
    return (
      <AppShell titre="Super-admin">
        <p className="text-muted-foreground">Cet espace est réservé aux super-administrateurs.</p>
      </AppShell>
    );

  return (
    <AppShell titre="Super-admin">
      <section className="card-soft p-5">
        <h2 className="text-lg font-semibold">Importer des fiches non réclamées</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Une ligne par salon : nom, adresse, ville, téléphone, catégorie, lien externe, note Google, nb avis Google, URL photo de couverture (les 4 derniers sont optionnels).
          Catégories acceptées : {CATEGORIES.map((c) => c.value).join(", ")}.
        </p>
        <div className="mt-4 grid gap-3">
          <Textarea
            rows={8}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Salon Léa;12 rue de Paris;Lyon;0478000000;coiffeur;https://www.planity.com/...;4.6;128;https://exemple.com/photo.jpg"
          />
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="source">Source</Label>
            <Input id="source" value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
          <Button
            className="w-fit"
            disabled={!csv.trim() || importer.isPending}
            onClick={() => importer.mutate()}
          >
            Importer {parserCsv(csv).length || ""} salon(s)
          </Button>
        </div>
      </section>

      <section className="card-soft mt-5 p-5">
        <h2 className="text-lg font-semibold">
          Fiches non réclamées ({salons?.length ?? 0})
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Triées par nombre de clics « réservation indisponible » sur 30 jours.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Salon</th>
                <th className="py-2 pr-3 font-medium">Ville</th>
                <th className="py-2 pr-3 font-medium">Clics 30 j</th>
                <th className="py-2 pr-3 font-medium">Total</th>
                <th className="py-2 pr-3 font-medium">Source</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(salons ?? []).map((s) => (
                <tr key={s.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium">{s.nom}</span>
                    {s.telephone && (
                      <span className="ml-2 text-muted-foreground">{s.telephone}</span>
                    )}
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.ville ?? "—"}</td>
                  <td className="py-2.5 pr-3 font-semibold">{s.clics_30j}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.clics_total}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{s.source ?? "—"}</td>
                  <td className="py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConversion({ id: s.id, email: "", nom: s.nom })}
                    >
                      Convertir en client
                    </Button>
                  </td>
                </tr>
              ))}
              {!salons?.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-muted-foreground">
                    Aucune fiche non réclamée pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {conversion && (
        <section className="card-soft mt-5 p-5">
          <h2 className="text-lg font-semibold">Convertir en client</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            L'historique des clics manqués est conservé.
          </p>
          <div className="mt-4 grid gap-3 sm:max-w-md">
            <div className="grid gap-2">
              <Label htmlFor="email-gerant">E-mail du gérant</Label>
              <Input
                id="email-gerant"
                type="email"
                value={conversion.email}
                onChange={(e) => setConversion({ ...conversion, email: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nom-gerant">Nom du gérant</Label>
              <Input
                id="nom-gerant"
                value={conversion.nom}
                onChange={(e) => setConversion({ ...conversion, nom: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button disabled={convertir.isPending} onClick={() => convertir.mutate()}>
                Confirmer la conversion
              </Button>
              <Button variant="ghost" onClick={() => setConversion(null)}>
                Annuler
              </Button>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}
