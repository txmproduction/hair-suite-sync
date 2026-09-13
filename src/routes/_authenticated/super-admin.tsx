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
  clientsAbonnesFn,
  definirStatutCompteFn,
  reversementsFn,
  marquerReversementFn,
  etatPhotosFn,
  synchroniserLotPhotosFn,
  resynchroniserPhotosSalonFn,
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
  latitude: string;
  longitude: string;
  google_place_id: string;
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
      latitude: c[9] ?? "",
      longitude: c[10] ?? "",
      google_place_id: c[11] ?? "",
    };
  });
}

const BADGE: Record<string, string> = {
  permanent: "bg-emerald-100 text-emerald-800",
  essai: "bg-gold-soft text-gold-foreground",
  essai_expire: "bg-orange-100 text-orange-800",
  suspendu: "bg-red-100 text-red-800",
};

const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);

/** « 12 – 18 mai 2026 » à partir du lundi de la semaine. */
function semaineLisible(lundiIso: string) {
  const lundi = new Date(`${lundiIso}T00:00:00Z`);
  const dimanche = new Date(lundi);
  dimanche.setUTCDate(dimanche.getUTCDate() + 6);
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    d.toLocaleDateString("fr-FR", { timeZone: "UTC", ...opts });
  return `${fmt(lundi, { day: "numeric" })} – ${fmt(dimanche, { day: "numeric", month: "long", year: "numeric" })}`;
}

const LIBELLE: Record<string, string> = {
  permanent: "Accès permanent",
  essai: "Essai en cours",
  essai_expire: "Essai expiré",
  suspendu: "Suspendu",
};

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

  const { data: abonnes } = useQuery({
    queryKey: ["clients-abonnes"],
    enabled: autorise,
    queryFn: () => clientsAbonnesFn(),
    refetchInterval: 15_000,
  });

  const { data: etatPhotos } = useQuery({
    queryKey: ["etat-photos"],
    enabled: autorise,
    queryFn: () => etatPhotosFn(),
  });

  const [bilanPhotos, setBilanPhotos] = useState<string[]>([]);

  const lotPhotos = useMutation({
    mutationFn: () => synchroniserLotPhotosFn(),
    onSuccess: (r) => {
      toast.success(`${r.reussis} salon(s) illustré(s) sur ${r.traites} traité(s).`);
      setBilanPhotos([
        `${r.traites} traités · ${r.reussis} avec photos · ${r.sansPhoto} sans photo Google · ${r.nbErreurs} en erreur`,
        ...r.erreurs,
      ]);
      queryClient.invalidateQueries({ queryKey: ["etat-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const photosSalon = useMutation({
    mutationFn: (salonId: string) => resynchroniserPhotosSalonFn({ data: { salonId } }),
    onSuccess: (r) => {
      if (r.erreur) toast.error(`${r.nom} — ${r.erreur}`);
      else if (!r.photos) toast.info(`${r.nom} — aucune photo disponible sur Google.`);
      else toast.success(`${r.nom} — ${r.photos} photo(s) récupérée(s).`);
      queryClient.invalidateQueries({ queryKey: ["etat-photos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });


  const changerStatut = useMutation({
    mutationFn: (v: { salonId: string; statut: "permanent" | "essai" | "suspendu" }) =>
      definirStatutCompteFn({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(
        v.statut === "permanent"
          ? "Accès permanent activé."
          : v.statut === "essai"
            ? "Nouvel essai de 14 jours activé."
            : "Compte suspendu.",
      );
      queryClient.invalidateQueries({ queryKey: ["clients-abonnes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: reversements } = useQuery({
    queryKey: ["reversements"],
    enabled: autorise,
    queryFn: () => reversementsFn(),
  });

  const [historiqueVisible, setHistoriqueVisible] = useState(false);

  const marquerVire = useMutation({
    mutationFn: (v: { salonId: string; semaineDebut: string; montant: number }) =>
      marquerReversementFn({ data: v }),
    onSuccess: () => {
      toast.success("Virement enregistré.");
      queryClient.invalidateQueries({ queryKey: ["reversements"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [csv, setCsv] = useState("");
  const [source, setSource] = useState("import_csv");
  const [conversion, setConversion] = useState<{ id: string; email: string; nom: string } | null>(
    null,
  );

  // Le serveur plafonne à 500 lignes par appel : on découpe automatiquement
  // pour pouvoir coller des milliers de salons en une seule fois.
  const TAILLE_LOT = 400;
  const [progression, setProgression] = useState<{ faits: number; total: number } | null>(null);

  const importer = useMutation({
    mutationFn: async () => {
      const lignes = parserCsv(csv);
      let crees = 0;
      const ignores: string[] = [];
      setProgression({ faits: 0, total: lignes.length });
      for (let i = 0; i < lignes.length; i += TAILLE_LOT) {
        const lot = lignes.slice(i, i + TAILLE_LOT);
        const r = await importerSalonsFn({ data: { lignes: lot, source } });
        crees += r.crees;
        ignores.push(...r.ignores);
        setProgression({ faits: Math.min(i + TAILLE_LOT, lignes.length), total: lignes.length });
      }
      return { crees, ignores };
    },
    onSuccess: (r) => {
      setProgression(null);
      toast.success(`${r.crees} salon(s) importé(s).`);
      if (r.ignores.length)
        toast.message(`${r.ignores.length} ignoré(s)`, {
          description: r.ignores.slice(0, 5).join(" · "),
        });
      setCsv("");
      queryClient.invalidateQueries({ queryKey: ["salons-non-reclames"] });
    },
    onError: (e: Error) => {
      setProgression(null);
      toast.error(e.message);
    },
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
          Une ligne par salon : nom, adresse, ville, téléphone, catégorie, lien externe, note Google, nb avis Google, photo(s), latitude, longitude (tout à partir du lien externe est optionnel). Pour plusieurs photos, séparez les URLs par un « | ». Les coordonnées permettent la recherche « autour de moi ».
          Catégories acceptées : {CATEGORIES.map((c) => c.value).join(", ")}.
        </p>
        <div className="mt-4 grid gap-3">
          <Textarea
            rows={8}
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            placeholder="Salon Léa;12 rue de Paris;Lyon;0478000000;coiffeur;;4.6;128;https://exemple.com/photo.jpg;45.764;4.8357"
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
          {progression && (
            <p className="text-sm text-muted-foreground">
              Import en cours : {progression.faits} / {progression.total} lignes traitées…
            </p>
          )}
        </div>
      </section>

      <section className="card-soft mt-5 p-5">
        <h2 className="text-lg font-semibold">Clients abonnés ({abonnes?.length ?? 0})</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vue en direct (actualisée toutes les 15 secondes). Les données d'un salon ne sont jamais
          supprimées, même en cas de suspension.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Salon</th>
                <th className="py-2 pr-3 font-medium">Ville</th>
                <th className="py-2 pr-3 font-medium">Gérant</th>
                <th className="py-2 pr-3 font-medium">Statut</th>
                <th className="py-2 pr-3 font-medium">Jours restants</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(abonnes ?? []).map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium">{c.nom}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{c.ville ?? "—"}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{c.email ?? "—"}</td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${BADGE[c.statut]}`}
                    >
                      {LIBELLE[c.statut]}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {c.statut === "essai" ? `J-${c.joursRestants}` : "—"}
                  </td>
                  <td className="py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={changerStatut.isPending}
                        onClick={() =>
                          changerStatut.mutate({ salonId: c.id, statut: "permanent" })
                        }
                      >
                        Accès permanent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={changerStatut.isPending}
                        onClick={() => changerStatut.mutate({ salonId: c.id, statut: "essai" })}
                      >
                        Essai gratuit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={changerStatut.isPending}
                        onClick={() =>
                          changerStatut.mutate({ salonId: c.id, statut: "suspendu" })
                        }
                      >
                        Suspendre
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!abonnes?.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-muted-foreground">
                    Aucun client abonné pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card-soft mt-5 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-lg font-semibold">Acomptes à reverser</h2>
          <p className="text-sm">
            Total à faire :{" "}
            <span className="font-semibold">{euro(reversements?.totalAFaire ?? 0)}</span>
          </p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Acomptes encaissés par semaine calendaire (lundi au dimanche), semaines non soldées en
          premier.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Salon</th>
                <th className="py-2 pr-3 font-medium">Semaine</th>
                <th className="py-2 pr-3 font-medium">RDV</th>
                <th className="py-2 pr-3 font-medium">Montant</th>
                <th className="py-2 pr-3 font-medium">Coordonnées bancaires</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {(reversements?.aFaire ?? []).map((l) => (
                <tr key={`${l.salon_id}-${l.semaine_debut}`} className="border-b border-border/60">
                  <td className="py-2.5 pr-3 font-medium">{l.salon_nom}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{semaineLisible(l.semaine_debut)}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{l.nb_rdv}</td>
                  <td className="py-2.5 pr-3 font-semibold">{euro(l.montant)}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">
                    {l.iban ? (
                      <>
                        <span className="block">{l.titulaire}</span>
                        <span className="block font-mono text-xs">{l.iban}</span>
                      </>
                    ) : (
                      "Non renseignées"
                    )}
                  </td>
                  <td className="py-2.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={marquerVire.isPending}
                      onClick={() =>
                        marquerVire.mutate({
                          salonId: l.salon_id,
                          semaineDebut: l.semaine_debut,
                          montant: l.montant,
                        })
                      }
                    >
                      Marquer comme viré
                    </Button>
                  </td>
                </tr>
              ))}
              {!reversements?.aFaire.length && (
                <tr>
                  <td colSpan={6} className="py-4 text-muted-foreground">
                    Aucun acompte en attente de reversement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="mt-3"
          onClick={() => setHistoriqueVisible((v) => !v)}
        >
          {historiqueVisible ? "Masquer" : "Voir"} l'historique des virements (
          {reversements?.historique.length ?? 0})
        </Button>

        {historiqueVisible && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Salon</th>
                  <th className="py-2 pr-3 font-medium">Semaine</th>
                  <th className="py-2 pr-3 font-medium">Montant</th>
                  <th className="py-2 pr-3 font-medium">Viré le</th>
                </tr>
              </thead>
              <tbody>
                {(reversements?.historique ?? []).map((l) => (
                  <tr key={`h-${l.salon_id}-${l.semaine_debut}`} className="border-b border-border/60">
                    <td className="py-2.5 pr-3">{l.salon_nom}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {semaineLisible(l.semaine_debut)}
                    </td>
                    <td className="py-2.5 pr-3">{euro(l.montant)}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">
                      {l.date_virement ? new Date(l.date_virement).toLocaleDateString("fr-FR") : "—"}
                    </td>
                  </tr>
                ))}
                {!reversements?.historique.length && (
                  <tr>
                    <td colSpan={4} className="py-4 text-muted-foreground">
                      Aucun virement enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card-soft mt-5 p-5">
        <h2 className="text-lg font-semibold">Photos Google</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Les adresses de photos fournies par Google expirent. On les télécharge une fois pour
          toutes et on les héberge nous-mêmes. Les salons qui ont mis en ligne leur propre photo ne
          sont jamais modifiés.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {[
            { label: "À traiter", valeur: etatPhotos?.aTraiter ?? 0 },
            { label: "Adresses Google expirées", valeur: etatPhotos?.urlsGoogle ?? 0 },
            { label: "Sans photo", valeur: etatPhotos?.sansPhoto ?? 0 },
            { label: "En erreur", valeur: etatPhotos?.enErreur ?? 0 },
          ].map((c) => (
            <div key={c.label} className="rounded-xl bg-secondary p-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-semibold">{c.valeur.toLocaleString("fr-FR")}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Button disabled={lotPhotos.isPending} onClick={() => lotPhotos.mutate()}>
            {lotPhotos.isPending ? "Synchronisation…" : "Synchroniser un lot de 50"}
          </Button>
        </div>
        {bilanPhotos.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
            {bilanPhotos.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
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
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConversion({ id: s.id, email: "", nom: s.nom })}
                      >
                        Convertir en client
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={photosSalon.isPending}
                        onClick={() => photosSalon.mutate(s.id)}
                      >
                        Resynchroniser les photos
                      </Button>
                    </div>
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
