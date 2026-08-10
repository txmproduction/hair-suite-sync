import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Salon = Database["public"]["Tables"]["salons"]["Row"];
export type Employe = Database["public"]["Tables"]["employes"]["Row"];
export type Categorie = Database["public"]["Tables"]["categories"]["Row"];
export type Prestation = Database["public"]["Tables"]["prestations"]["Row"];
export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type Rdv = Database["public"]["Tables"]["rdv"]["Row"];
export type Encaissement = Database["public"]["Tables"]["encaissements"]["Row"];
export type Parametres = Database["public"]["Tables"]["parametres_salon"]["Row"];
export type StatutRdv = Database["public"]["Enums"]["statut_rdv"];
export type MoyenPaiement = Database["public"]["Enums"]["moyen_paiement"];

export const JOURS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export const MOYENS: { value: MoyenPaiement; label: string }[] = [
  { value: "cb", label: "Carte bancaire" },
  { value: "especes", label: "Espèces" },
  { value: "cheque", label: "Chèque" },
  { value: "autre", label: "Autre" },
];

export const STATUTS: { value: StatutRdv; label: string }[] = [
  { value: "a_venir", label: "À venir" },
  { value: "venu", label: "Venu" },
  { value: "no_show", label: "No-show" },
  { value: "annule", label: "Annulé" },
];

export const euro = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n || 0);

export const dateISO = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const heureFR = (iso: string) =>
  new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export const dateFR = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

/** Index 0 = lundi */
export const jourIndex = (d: Date) => (d.getDay() + 6) % 7;

export const minutesDepuisMinuit = (iso: string) => {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
};

export const debutSemaine = (d: Date) => {
  const r = new Date(d);
  r.setDate(r.getDate() - jourIndex(r));
  r.setHours(0, 0, 0, 0);
  return r;
};

export type Contexte = {
  employe: Employe | null;
  salon: Salon | null;
  parametres: Parametres | null;
};

export async function chargerContexte(): Promise<Contexte> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return { employe: null, salon: null, parametres: null };

  const { data: employe } = await supabase
    .from("employes")
    .select("*")
    .eq("user_id", user.id)
    .eq("actif", true)
    .maybeSingle();

  if (!employe) return { employe: null, salon: null, parametres: null };

  const [{ data: salon }, { data: parametres }] = await Promise.all([
    supabase.from("salons").select("*").eq("id", employe.salon_id).maybeSingle(),
    supabase
      .from("parametres_salon")
      .select("*")
      .eq("salon_id", employe.salon_id)
      .maybeSingle(),
  ]);

  return { employe, salon: salon ?? null, parametres: parametres ?? null };
}

export const contexteQuery = {
  queryKey: ["contexte"],
  queryFn: chargerContexte,
};

export function calculAcompte(prix: number, p: Parametres | null) {
  if (!p || !p.acompte_valeur) return 0;
  const v = Number(p.acompte_valeur);
  const montant = p.acompte_type === "pourcentage" ? (prix * v) / 100 : v;
  return Math.min(Math.round(montant * 100) / 100, prix);
}
