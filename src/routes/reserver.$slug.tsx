import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { creneauxFn, creerReservationFn, salonPublicFn } from "@/lib/reservation.functions";
import type { SalonPublicData, JourCreneauxData } from "@/lib/reservation-types";
import { euro, dateISO, heureFR, JOURS } from "@/lib/hairtrack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import logo from "@/assets/logo-light.png";
import { ArrowLeft, Check, Clock, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/reserver/$slug")({
  loader: ({ params }) => salonPublicFn({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const nom = loaderData?.salon.nom ?? "Réservation en ligne";
    const titre = `Réserver en ligne — ${nom}`;
    const description = `Prenez rendez-vous en ligne chez ${nom} : choisissez votre prestation, votre praticien et votre créneau en quelques secondes.`;
    return {
      meta: [
        { title: titre },
        { name: "description", content: description },
        { property: "og:title", content: titre },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <Indisponible />,
  notFoundComponent: () => <Indisponible />,
  component: PageReservation,
});

function Cadre({ children, nom, adresse, telephone }: {
  children: React.ReactNode;
  nom?: string;
  adresse?: string | null;
  telephone?: string | null;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-3 px-4 py-4">
          <img src={logo} alt="HairTrack" className="h-7 w-auto" />
          {nom && (
            <div className="ml-auto text-right">
              <p className="font-semibold leading-tight">{nom}</p>
              <p className="flex items-center justify-end gap-3 text-xs text-muted-foreground">
                {adresse && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {adresse}
                  </span>
                )}
                {telephone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {telephone}
                  </span>
                )}
              </p>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}

function Indisponible() {
  return (
    <Cadre>
      <div className="card-soft p-6 text-center">
        <h1 className="text-xl font-semibold">Réservation indisponible</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ce salon n'accepte pas (ou plus) les réservations en ligne. Contactez-le directement par
          téléphone.
        </p>
      </div>
    </Cadre>
  );
}

const ETAPES = ["Prestation", "Praticien", "Créneau", "Coordonnées"];

function PageReservation() {
  const contexte = Route.useLoaderData() as SalonPublicData | null;
  const { slug } = Route.useParams();
  const charger = useServerFn(creneauxFn);
  const reserver = useServerFn(creerReservationFn);

  const [etape, setEtape] = useState(0);
  const [prestationId, setPrestationId] = useState<string | null>(null);
  const [employeId, setEmployeId] = useState<string | null>(null);
  const [creneau, setCreneau] = useState<{ debut: string; employe_id: string } | null>(null);
  const [semaine, setSemaine] = useState(0);
  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const prestation = contexte?.prestations.find((p) => p.id === prestationId) ?? null;
  const acompte = useMemo(() => {
    const cfg = contexte?.acompte;
    if (!prestation || !cfg?.valeur) return 0;
    const m = cfg.type === "pourcentage" ? (prestation.prix * cfg.valeur) / 100 : cfg.valeur;
    return Math.min(Math.round(m * 100) / 100, prestation.prix);
  }, [prestation, contexte?.acompte]);

  const depart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + semaine * 7);
    return dateISO(d);
  }, [semaine]);

  const { data: jours = [] as JourCreneauxData[], isFetching } = useQuery({
    queryKey: ["creneaux", slug, prestationId, employeId, depart],
    enabled: etape === 2 && !!prestationId,
    queryFn: () =>
      charger({
        data: { slug, prestationId: prestationId!, employeId, depart, jours: 7 },
      }),
  });

  if (!contexte) return <Indisponible />;

  async function valider() {
    if (!prestation || !creneau) return;
    setEnvoi(true);
    try {
      const res = await reserver({
        data: {
          slug,
          prestationId: prestation.id,
          employeId,
          debut: creneau.debut,
          nom,
          telephone,
          email,
        },
      });
      if (res.paiement_url) {
        window.location.href = res.paiement_url;
        return;
      }
      window.location.href = `/reservation/${res.token}`;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Réservation impossible");
      setEnvoi(false);
    }
  }

  return (
    <Cadre
      nom={contexte.salon.nom}
      adresse={contexte.salon.adresse}
      telephone={contexte.salon.telephone}
    >
      <h1 className="mb-1 text-2xl font-semibold">Réserver en ligne</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        4 étapes, sans création de compte.
      </p>

      <ol className="mb-6 flex flex-wrap gap-2 text-xs">
        {ETAPES.map((e, i) => (
          <li
            key={e}
            className={`rounded-full px-3 py-1 font-medium ${
              i === etape
                ? "bg-gold-soft text-gold-foreground"
                : i < etape
                  ? "bg-secondary text-foreground"
                  : "bg-secondary/60 text-muted-foreground"
            }`}
          >
            {i + 1}. {e}
          </li>
        ))}
      </ol>

      {etape > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 -ml-2"
          onClick={() => setEtape((e) => e - 1)}
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Retour
        </Button>
      )}

      {/* 1. Prestation */}
      {etape === 0 && (
        <div className="space-y-4">
          {[...contexte.categories, { id: "autres", nom: "Autres prestations", ordre: 999 }]
            .map((cat) => ({
              cat,
              items: contexte.prestations.filter((p) =>
                cat.id === "autres" ? !p.categorie_id : p.categorie_id === cat.id,
              ),
            }))
            .filter((g) => g.items.length > 0)
            .map(({ cat, items }) => (
              <section key={cat.id} className="card-soft overflow-hidden">
                <h2 className="border-b border-border px-5 py-3 font-semibold">{cat.nom}</h2>
                <ul>
                  {items.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => {
                          setPrestationId(p.id);
                          setCreneau(null);
                          setEtape(1);
                        }}
                        className="flex w-full items-center gap-3 border-b border-border/60 px-5 py-3 text-left transition-colors last:border-0 hover:bg-secondary"
                      >
                        <span
                          className="h-8 w-1 rounded-full"
                          style={{ backgroundColor: p.couleur }}
                        />
                        <span className="flex-1">
                          <span className="block font-medium">{p.nom}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" /> {p.duree_min} min
                          </span>
                        </span>
                        <span className="font-semibold">{euro(p.prix)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}

      {/* 2. Praticien */}
      {etape === 1 && (
        <div className="card-soft divide-y divide-border p-2">
          <button
            onClick={() => {
              setEmployeId(null);
              setCreneau(null);
              setEtape(2);
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-secondary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft text-sm font-semibold text-gold-foreground">
              ?
            </span>
            <span>
              <span className="block font-medium">Peu importe</span>
              <span className="text-xs text-muted-foreground">
                Le premier praticien disponible
              </span>
            </span>
          </button>
          {contexte.employes.map((e) => (
            <button
              key={e.id}
              onClick={() => {
                setEmployeId(e.id);
                setCreneau(null);
                setEtape(2);
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left hover:bg-secondary"
            >
              {e.photo_url ? (
                <img src={e.photo_url} alt={e.nom} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: e.couleur }}
                >
                  {e.nom.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="font-medium">{e.nom}</span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Créneau */}
      {etape === 2 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={semaine === 0}
              onClick={() => setSemaine((s) => Math.max(0, s - 1))}
            >
              7 jours avant
            </Button>
            <Button variant="outline" size="sm" onClick={() => setSemaine((s) => s + 1)}>
              7 jours après
            </Button>
          </div>
          {isFetching && (
            <p className="text-sm text-muted-foreground">Recherche des disponibilités…</p>
          )}
          {!isFetching &&
            jours.map((j) => {
              const d = new Date(`${j.date}T12:00:00`);
              return (
                <section key={j.date} className="card-soft p-4">
                  <h2 className="mb-2 text-sm font-semibold capitalize">
                    {JOURS[(d.getDay() + 6) % 7]}{" "}
                    {d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                  </h2>
                  {j.creneaux.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucune disponibilité</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {j.creneaux.map((c) => (
                        <Button
                          key={`${c.debut}-${c.employe_id}`}
                          variant={creneau?.debut === c.debut ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            setCreneau(c);
                            setEtape(3);
                          }}
                        >
                          {heureFR(c.debut)}
                        </Button>
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
        </div>
      )}

      {/* 4. Coordonnées */}
      {etape === 3 && prestation && creneau && (
        <div className="space-y-4">
          <div className="card-soft space-y-1 p-5 text-sm">
            <div className="flex justify-between">
              <span className="font-medium">{prestation.nom}</span>
              <span>{euro(prestation.prix)}</span>
            </div>
            <p className="text-muted-foreground">
              {new Date(creneau.debut).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}{" "}
              à {heureFR(creneau.debut)} · {prestation.duree_min} min
              {employeId
                ? ` · ${contexte.employes.find((e) => e.id === employeId)?.nom}`
                : ` · ${contexte.employes.find((e) => e.id === creneau.employe_id)?.nom ?? "praticien disponible"}`}
            </p>
            {acompte > 0 && (
              <p className="border-t border-border pt-2 font-medium">
                Acompte à régler pour confirmer : {euro(acompte)}
              </p>
            )}
          </div>
          <div className="card-soft space-y-4 p-5">
            <div className="space-y-2">
              <Label htmlFor="r-nom">Nom et prénom</Label>
              <Input id="r-nom" value={nom} onChange={(e) => setNom(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="r-tel">Téléphone</Label>
                <Input
                  id="r-tel"
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-mail">Email</Label>
                <Input
                  id="r-mail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={valider} disabled={envoi}>
              <Check className="mr-2 h-4 w-4" />
              {acompte > 0 ? `Payer l'acompte de ${euro(acompte)}` : "Confirmer le rendez-vous"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Annulation gratuite en ligne jusqu'à {contexte.acompte.delai_annulation_h} h avant le
              rendez-vous.
            </p>
          </div>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Propulsé par <Link to="/" className="underline">HairTrack</Link>
      </p>
    </Cadre>
  );
}
