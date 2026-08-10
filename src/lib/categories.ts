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
  photo: string;
  detail: string;
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
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331255/pexels-cottonbro-7428093_gwspgb.jpg",
    detail:
      "Coupe, couleur, balayage, lissage ou simple entretien : les salons référencés sur HairTrack affichent leurs tarifs et leurs durées avant que vous réserviez, pour éviter les mauvaises surprises. Vous choisissez votre coiffeur, votre créneau, et vous recevez la confirmation immédiatement. Certains salons demandent un petit acompte pour sécuriser le rendez-vous, le solde se règle sur place.",
  },
  {
    value: "barbier",
    label: "Barbier",
    pluriel: "barbier",
    slug: "barbier",
    accroche:
      "Barbe taillée au millimètre, dégradé impeccable, serviette chaude : le rendez-vous où l'on prend vraiment le temps de soigner les détails.",
    emoji: "🪒",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331261/pexels-ron-lach-10317437_fdoib1.jpg",
    detail:
      "Taille de barbe, contours nets, dégradé américain, rasage à l'ancienne : les barbershops travaillent souvent sur des créneaux courts et très demandés, surtout en fin de semaine. En réservant en ligne, vous prenez la place qui vous convient sans passer par le téléphone et sans attendre au comptoir.",
  },
  {
    value: "manucure",
    label: "Manucure",
    pluriel: "manucure",
    slug: "manucure",
    accroche:
      "Des mains nettes au quotidien ou une pose qui tient des semaines pour un grand jour : choisis la finition qui te ressemble.",
    emoji: "💅",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331261/pexels-suzyhazelwood-1328383_cju3ek.jpg",
    detail:
      "Manucure classique, semi-permanent, gel, pose complète ou remplissage : les durées varient beaucoup d'une prestation à l'autre, et c'est justement ce que vous voyez avant de valider. Vous savez combien de temps prévoir et à quel prix, puis vous choisissez la prothésiste avec qui vous avez l'habitude de travailler.",
  },
  {
    value: "institut_beaute",
    label: "Institut de beauté",
    pluriel: "beauté",
    slug: "institut-beaute",
    accroche:
      "Soin du visage, épilation, teinture des cils… Une heure pour toi, entre de bonnes mains, et on ressort avec une meilleure mine.",
    emoji: "🌿",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331257/pexels-mir-fialkova-2156588206-37000478_j88xq1.jpg",
    detail:
      "Soin du visage, épilation, teinture des cils, maquillage, beauté du regard : les instituts proposent des protocoles précis, souvent sur mesure. Le détail des prestations et des durées est affiché, vous réservez le créneau qui s'intègre dans votre journée et l'institut vous confirme aussitôt.",
  },
  {
    value: "bien_etre",
    label: "Bien-être",
    pluriel: "bien-être",
    slug: "bien-etre",
    accroche:
      "Souffler enfin. Massage, relaxation, chaleur douce : on repart les épaules légères et la tête bien plus claire.",
    emoji: "🧖",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331256/pexels-cristian-rojas-7947825_qbpdxg.jpg",
    detail:
      "Massage relaxant, massage sportif, réflexologie, hammam ou sauna : ces rendez-vous demandent du temps et un peu d'organisation. En réservant en ligne, vous bloquez la plage horaire qu'il vous faut, à l'avance, et vous arrivez simplement le jour venu sans rien avoir à rappeler.",
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
