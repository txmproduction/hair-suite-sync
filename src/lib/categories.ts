export type CategorieSalon =
  | "coiffeur"
  | "barbier"
  | "manucure"
  | "institut_beaute"
  | "bien_etre";

export type InfoCategorie = {
  value: CategorieSalon;
  label: string;
  pluriel: string;
  slug: string;
  accroche: string;
  emoji: string;
};

export const CATEGORIES: InfoCategorie[] = [
  {
    value: "coiffeur",
    label: "Coiffeur",
    pluriel: "coiffure",
    slug: "coiffeur",
    accroche:
      "Envie de changer complètement de tête ou juste de rafraîchir ta coupe ? Trouve un pro qui écoute, conseille et te rend la vie plus simple le matin.",
    emoji: "✂️",
  },
  {
    value: "barbier",
    label: "Barbier",
    pluriel: "barbier",
    slug: "barbier",
    accroche:
      "Barbe taillée au millimètre, dégradé impeccable, serviette chaude : le rendez-vous où l'on prend vraiment le temps de soigner les détails.",
    emoji: "🪒",
  },
  {
    value: "manucure",
    label: "Manucure",
    pluriel: "manucure",
    slug: "manucure",
    accroche:
      "Des mains nettes au quotidien ou une pose qui tient des semaines pour un grand jour : choisis la finition qui te ressemble.",
    emoji: "💅",
  },
  {
    value: "institut_beaute",
    label: "Institut de beauté",
    pluriel: "beauté",
    slug: "institut-beaute",
    accroche:
      "Soin du visage, épilation, teinture des cils… Une heure pour toi, entre de bonnes mains, et on ressort avec une meilleure mine.",
    emoji: "🌿",
  },
  {
    value: "bien_etre",
    label: "Bien-être",
    pluriel: "bien-être",
    slug: "bien-etre",
    accroche:
      "Souffler enfin. Massage, relaxation, chaleur douce : on repart les épaules légères et la tête bien plus claire.",
    emoji: "🧖",
  },
];

export const parCategorie = (v?: string | null) =>
  CATEGORIES.find((c) => c.value === v) ?? null;

export const parSlugCategorie = (s?: string | null) =>
  CATEGORIES.find((c) => c.slug === s) ?? null;

export const labelCategorie = (v?: string | null) => parCategorie(v)?.label ?? "Salon";

export const villeSlug = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
