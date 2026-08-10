export type CategorieSalon =
  | "coiffeur"
  | "barbier"
  | "manucure"
  | "institut_beaute"
  | "bien_etre"
  | "massage"
  | "sophrologue"
  | "reflexologue"
  | "hypnotherapeute"
  | "naturopathe"
  | "coach_de_vie";

export type InfoCategorie = {
  value: CategorieSalon;
  label: string;
  pluriel: string;
  slug: string;
  accroche: string;
  emoji: string;
  photo: string;
  detail: string;
  visibleNav: boolean;
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
    visibleNav: true,
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
    visibleNav: true,
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
    visibleNav: true,
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
    visibleNav: true,
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
    visibleNav: true,
  },
  {
    value: "massage",
    label: "Massage",
    pluriel: "massage",
    slug: "massage",
    accroche:
      "Un vrai moment pour le corps : dénouer les tensions, relâcher le dos, repartir plus léger. Choisissez la technique qui vous convient.",
    emoji: "💆",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331256/pexels-cristian-rojas-7947825_qbpdxg.jpg",
    detail:
      "Massage relaxant, massage sportif, californien, deep tissue : chaque praticien a ses spécialités et ses durées de séance. Vous voyez tout avant de réserver, vous choisissez le créneau qui vous convient et vous êtes attendu à l'heure dite.",
    visibleNav: false,
  },
  {
    value: "sophrologue",
    label: "Sophrologue",
    pluriel: "sophrologie",
    slug: "sophrologue",
    accroche:
      "Apprendre à gérer le stress, mieux dormir, se sentir plus posé au quotidien : la sophrologie, ça se pratique avec un professionnel formé pour ça.",
    emoji: "🧘",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331256/pexels-cristian-rojas-7947825_qbpdxg.jpg",
    detail:
      "Séance individuelle ou suivi sur plusieurs semaines, gestion du stress, préparation à un événement, sommeil : les sophrologues référencés sur HairTrack affichent leurs spécialités et leurs disponibilités. Vous réservez directement le créneau qui vous arrange.",
    visibleNav: false,
  },
  {
    value: "reflexologue",
    label: "Réflexologue",
    pluriel: "réflexologie",
    slug: "reflexologue",
    accroche:
      "Une pression au bon endroit peut faire beaucoup de bien. La réflexologie plantaire ou palmaire, c'est un soin doux et précis à la fois.",
    emoji: "🦶",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331256/pexels-cristian-rojas-7947825_qbpdxg.jpg",
    detail:
      "Réflexologie plantaire, palmaire ou faciale : chaque séance cible des zones précises pour soulager tensions et fatigue. Les praticiens référencés indiquent la durée et le prix de chaque type de séance, vous réservez en ligne sans détour.",
    visibleNav: false,
  },
  {
    value: "hypnotherapeute",
    label: "Hypnothérapeute",
    pluriel: "hypnothérapie",
    slug: "hypnotherapeute",
    accroche:
      "Phobies, addictions, confiance en soi : l'hypnothérapie accompagne des sujets précis avec un professionnel formé à cette approche.",
    emoji: "🌀",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331257/pexels-mir-fialkova-2156588206-37000478_j88xq1.jpg",
    detail:
      "Une ou plusieurs séances selon l'objectif visé, en cabinet : les hypnothérapeutes référencés sur HairTrack précisent leur approche et leurs disponibilités. Vous réservez le créneau qui vous convient, en toute discrétion.",
    visibleNav: false,
  },
  {
    value: "naturopathe",
    label: "Naturopathe",
    pluriel: "naturopathie",
    slug: "naturopathe",
    accroche:
      "Alimentation, hygiène de vie, équilibre général : un bilan complet avec un naturopathe pour faire le point et ajuster ce qui doit l'être.",
    emoji: "🌱",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331257/pexels-mir-fialkova-2156588206-37000478_j88xq1.jpg",
    detail:
      "Bilan de vitalité, conseils personnalisés, suivi dans la durée : chaque naturopathe construit son propre accompagnement. La durée et le tarif de la première consultation sont indiqués avant réservation.",
    visibleNav: false,
  },
  {
    value: "coach_de_vie",
    label: "Coach de vie",
    pluriel: "coaching",
    slug: "coach-de-vie",
    accroche:
      "Un cap à trouver, une décision à prendre, une période à traverser : un coach de vie vous aide à y voir plus clair, séance après séance.",
    emoji: "🧭",
    photo:
      "https://res.cloudinary.com/dgfdye7cl/image/upload/v1786331257/pexels-mir-fialkova-2156588206-37000478_j88xq1.jpg",
    detail:
      "Séance ponctuelle ou accompagnement sur plusieurs mois, en cabinet ou à distance : chaque coach précise sa méthode. Vous réservez votre premier échange directement en ligne.",
    visibleNav: false,
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
