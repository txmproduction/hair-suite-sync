// Génération du bloc éditorial et de la FAQ des pages métier × ville.
// Tout est construit à partir des données réelles de la base : nombre de pros,
// fourchette de prix, notes, prestations, jours d'ouverture, communes voisines.
// Le choix des tournures est déterministe (seed = slug de la page) : la page ne
// bouge pas d'un rendu à l'autre, mais deux villes n'ont pas le même texte.
import type { PageLocale, StatsLocales } from "@/lib/annuaire-seo-types";

function graine(texte: string): number {
  let h = 2166136261;
  for (let i = 0; i < texte.length; i++) {
    h ^= texte.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** Tire une variante de façon stable : même page = même texte, à chaque rendu. */
function tirer<T>(variantes: T[], seed: string, decalage: number): T {
  const i = (graine(seed) + decalage * 2654435761) % variantes.length;
  return variantes[i] as T;
}

const euros = (n: number) => `${Math.round(n)} €`;

function liste(mots: string[]): string {
  if (mots.length <= 1) return mots[0] ?? "";
  return `${mots.slice(0, -1).join(", ")} et ${mots[mots.length - 1]}`;
}

export type BlocFaq = { question: string; reponse: string };

export type ContenuLocal = {
  paragraphes: string[];
  faq: BlocFaq[];
};

export function contenuPageLocale(page: PageLocale): ContenuLocal {
  const { ville, label, plurielNom, stats, villesProches, autresMetiers, departement } = page;
  const seed = `${page.slugCategorie}-${page.villeSlug}`;
  const metier = label.toLowerCase();
  const paragraphes: string[] = [];

  // 1. Offre locale : combien de professionnels, dans quel périmètre.
  const perimetre = stats.quartiers.length
    ? tirer(
        [
          `notamment du côté de ${liste(stats.quartiers.slice(0, 3))}`,
          `répartis entre ${liste(stats.quartiers.slice(0, 3))}`,
          `avec des adresses à ${liste(stats.quartiers.slice(0, 3))}`,
          `dont plusieurs à ${liste(stats.quartiers.slice(0, 2))}`,
          `couvrant ${liste(stats.quartiers.slice(0, 3))}`,
        ],
        seed,
        1,
      )
    : "";
  paragraphes.push(
    tirer(
      [
        `HairTrack référence ${stats.nbPros} ${stats.nbPros > 1 ? plurielNom : metier} à ${ville}${departement ? ` (${departement.nom})` : ""}${perimetre ? `, ${perimetre}` : ""}. Chaque fiche affiche les prestations proposées, leur durée et leur tarif, pour que vous sachiez exactement ce que vous réservez avant de valider.`,
        `Vous cherchez un ${metier} à ${ville}${departement ? `, dans le ${departement.nom}` : ""} ? ${stats.nbPros} établissement${stats.nbPros > 1 ? "s sont référencés" : " est référencé"} sur HairTrack${perimetre ? `, ${perimetre}` : ""}, avec le détail des prestations, des durées et des prix affiché avant la réservation.`,
        `À ${ville}, ${stats.nbPros} ${stats.nbPros > 1 ? plurielNom : metier} ${stats.nbPros > 1 ? "sont accessibles" : "est accessible"} depuis HairTrack${perimetre ? `, ${perimetre}` : ""}. Prestations, durées et tarifs sont indiqués sur chaque fiche : pas de surprise au moment de payer.`,
        `Trouver un ${metier} à ${ville} ne devrait pas prendre dix appels téléphoniques. HairTrack en réunit ${stats.nbPros}${perimetre ? `, ${perimetre}` : ""}, avec pour chacun la liste des prestations, leur durée et leur prix.`,
        `${stats.nbPros} ${stats.nbPros > 1 ? plurielNom : metier} de ${ville}${departement ? ` et du ${departement.nom}` : ""} figurent sur HairTrack${perimetre ? `, ${perimetre}` : ""}. Vous comparez les prestations, les durées et les tarifs sur une seule page avant de choisir.`,
      ],
      seed,
      2,
    ),
  );

  // 2. Prix constatés localement.
  if (stats.prixMin !== null && stats.prixMax !== null) {
    const fourchette =
      stats.prixMin === stats.prixMax
        ? euros(stats.prixMin)
        : `${euros(stats.prixMin)} à ${euros(stats.prixMax)}`;
    const median = stats.prixMedian !== null ? euros(stats.prixMedian) : null;
    paragraphes.push(
      tirer(
        [
          `Côté budget, les prestations relevées à ${ville} vont de ${fourchette}${median ? `, avec un tarif médian autour de ${median}` : ""}. L'écart s'explique par la nature de la prestation : un entretien rapide et une prestation complète ne demandent ni le même temps ni le même travail.`,
          `Les tarifs constatés à ${ville} s'échelonnent de ${fourchette}${median ? ` (médiane : ${median})` : ""}. Une prestation courte et une prestation longue n'ont évidemment pas le même prix : c'est surtout le temps passé en fauteuil qui fait la différence.`,
          `Sur les fiches de ${ville}, la fourchette de prix observée est de ${fourchette}${median ? `, la médiane se situant vers ${median}` : ""}. Chaque tarif est affiché avec la durée correspondante, ce qui rend la comparaison honnête.`,
          `Comptez de ${fourchette} selon la prestation choisie à ${ville}${median ? `, le tarif médian tournant autour de ${median}` : ""}. Les prix sont ceux renseignés par les professionnels eux-mêmes, pas des estimations.`,
          `À ${ville}, les prestations référencées démarrent à ${euros(stats.prixMin)} et montent jusqu'à ${euros(stats.prixMax)}${median ? `, avec une médiane proche de ${median}` : ""}. Vous connaissez le montant avant de réserver, pas après.`,
        ],
        seed,
        3,
      ),
    );
  }

  // 3. Avis et satisfaction.
  if (stats.noteMoyenne !== null && stats.nbAvis > 0) {
    const note = stats.noteMoyenne.toFixed(1).replace(".", ",");
    paragraphes.push(
      tirer(
        [
          `La note moyenne des ${plurielNom} de ${ville} est de ${note} sur 5, sur ${stats.nbAvis} avis cumulés. Les avis proviennent de clients réellement passés en rendez-vous, ce qui donne une lecture fiable de la qualité d'accueil et du résultat.`,
          `Avec ${stats.nbAvis} avis cumulés et une moyenne de ${note}/5, les ${plurielNom} de ${ville} affichent un niveau de satisfaction solide. Seuls les clients venus en rendez-vous peuvent déposer un avis, ce qui limite les commentaires de complaisance.`,
          `Les clients de ${ville} ont laissé ${stats.nbAvis} avis, pour une moyenne de ${note} sur 5. Chaque avis est rattaché à un rendez-vous réel : impossible de noter un salon sans y être allé.`,
          `Sur ${ville}, la moyenne s'établit à ${note}/5 pour ${stats.nbAvis} avis déposés. C'est un bon repère pour départager deux adresses proches en prix et en prestations.`,
          `${stats.nbAvis} avis ont été publiés sur les ${plurielNom} de ${ville}, avec une note moyenne de ${note} sur 5. Vous pouvez lire les commentaires détaillés directement sur chaque fiche.`,
        ],
        seed,
        4,
      ),
    );
  }

  // 4. Prestations les plus proposées + jours d'ouverture.
  const morceaux: string[] = [];
  if (stats.prestations.length) {
    morceaux.push(
      tirer(
        [
          `Les prestations les plus proposées localement sont ${liste(stats.prestations.slice(0, 5))}.`,
          `Sur place, on retrouve principalement ${liste(stats.prestations.slice(0, 5))}.`,
          `Le catalogue local tourne surtout autour de ${liste(stats.prestations.slice(0, 5))}.`,
          `Les demandes les plus courantes à ${ville} : ${liste(stats.prestations.slice(0, 5))}.`,
          `Parmi les prestations disponibles à ${ville} figurent ${liste(stats.prestations.slice(0, 5))}.`,
        ],
        seed,
        5,
      ),
    );
  }
  if (stats.nbPros > 0) {
    const partSamedi = Math.round((stats.ouvertSamedi / stats.nbPros) * 100);
    if (stats.ouvertSamedi > 0) {
      morceaux.push(
        partSamedi >= 60
          ? `La majorité des adresses de ${ville} ouvrent le samedi (${stats.ouvertSamedi} sur ${stats.nbPros})`
          : `${stats.ouvertSamedi} adresse${stats.ouvertSamedi > 1 ? "s" : ""} sur ${stats.nbPros} ${stats.ouvertSamedi > 1 ? "ouvrent" : "ouvre"} le samedi à ${ville}`,
      );
    }
    morceaux.push(
      stats.ouvertDimanche > 0
        ? `et ${stats.ouvertDimanche} propose${stats.ouvertDimanche > 1 ? "nt" : ""} aussi des créneaux le dimanche.`
        : `et le dimanche reste très majoritairement fermé.`,
    );
  }
  if (morceaux.length) paragraphes.push(morceaux.join(" "));

  // 5. Réservation et alentours.
  const voisines = villesProches.slice(0, 4).map((v) => v.nom);
  paragraphes.push(
    tirer(
      [
        `La réservation se fait en ligne, 7j/7, sans appel téléphonique : vous choisissez la prestation, le créneau, et vous recevez la confirmation immédiatement.${voisines.length ? ` Si aucun horaire ne vous convient, élargissez à ${liste(voisines)}, à quelques minutes de ${ville}.` : ""}`,
        `Vous réservez directement en ligne, à toute heure, et la confirmation arrive tout de suite après validation du créneau.${voisines.length ? ` Rien de libre aujourd'hui ? Regardez du côté de ${liste(voisines)}, juste à côté.` : ""}`,
        `Tout se règle en ligne : prestation, praticien, horaire, confirmation immédiate — sans passer par le téléphone ni attendre un rappel.${voisines.length ? ` Les villes voisines comme ${liste(voisines)} élargissent le choix de créneaux.` : ""}`,
        `Réservation en ligne 7j/7, confirmation immédiate, et rappel du rendez-vous avant la date : c'est le principe de HairTrack.${voisines.length ? ` Pour plus de disponibilités, ${liste(voisines)} sont tout près.` : ""}`,
        `Choisissez votre prestation et votre créneau en ligne, à n'importe quelle heure : la confirmation est immédiate.${voisines.length ? ` Et si l'agenda est complet à ${ville}, ${liste(voisines)} restent facilement accessibles.` : ""}`,
      ],
      seed,
      6,
    ),
  );

  if (autresMetiers.length) {
    paragraphes.push(
      `À ${ville}, HairTrack référence aussi ${liste(autresMetiers.slice(0, 4).map((m) => m.label.toLowerCase()))} : les liens en bas de page mènent directement à ces pages locales.`,
    );
  }

  return { paragraphes, faq: faqPageLocale(page, stats, seed) };
}

function faqPageLocale(page: PageLocale, stats: StatsLocales, seed: string): BlocFaq[] {
  const { ville, label, plurielNom } = page;
  const metier = label.toLowerCase();
  const faq: BlocFaq[] = [];

  if (stats.prixMin !== null && stats.prixMax !== null) {
    faq.push({
      question: `Combien coûte un ${metier} à ${ville} ?`,
      reponse:
        stats.prixMin === stats.prixMax
          ? `Les prestations relevées à ${ville} sont affichées à ${euros(stats.prixMin)}. Le tarif exact figure sur chaque fiche, prestation par prestation.`
          : `Les prestations référencées à ${ville} vont de ${euros(stats.prixMin)} à ${euros(stats.prixMax)}${stats.prixMedian !== null ? `, avec un tarif médian autour de ${euros(stats.prixMedian)}` : ""}. Chaque fiche affiche le prix et la durée de chaque prestation avant la réservation.`,
    });
  }

  faq.push({
    question: `Peut-on réserver un ${metier} le dimanche à ${ville} ?`,
    reponse:
      stats.ouvertDimanche > 0
        ? `Oui : ${stats.ouvertDimanche} adresse${stats.ouvertDimanche > 1 ? "s" : ""} sur ${stats.nbPros} ouvre${stats.ouvertDimanche > 1 ? "nt" : ""} le dimanche à ${ville}. Les créneaux réellement libres apparaissent en temps réel au moment de la réservation.`
        : `Le dimanche, les ${plurielNom} de ${ville} référencés sur HairTrack sont fermés. En revanche ${stats.ouvertSamedi > 0 ? `${stats.ouvertSamedi} d'entre eux ouvrent le samedi` : "certains proposent des créneaux en soirée en semaine"}.`,
  });

  faq.push({
    question: `Comment choisir son ${metier} à ${ville} ?`,
    reponse: tirer(
      [
        `Comparez trois choses : les avis clients (${stats.nbAvis > 0 ? `${stats.nbAvis} avis déposés à ${ville}` : "affichés sur chaque fiche"}), le détail des prestations proposées, et les créneaux disponibles aux horaires qui vous arrangent.`,
        `Regardez la note et les commentaires, vérifiez que la prestation exacte que vous cherchez est bien au catalogue, puis comparez les créneaux libres selon vos disponibilités.`,
        `Le plus simple : filtrer par note, lire deux ou trois avis récents, vérifier le tarif de la prestation qui vous intéresse, et réserver le créneau qui tombe bien.`,
        `Fiez-vous aux avis rattachés à de vrais rendez-vous, à la clarté du catalogue de prestations, et à la proximité de l'adresse par rapport à votre trajet quotidien.`,
        `Notes, avis détaillés, tarifs affichés et disponibilités réelles : ces quatre repères suffisent en général à trancher entre deux adresses de ${ville}.`,
      ],
      seed,
      7,
    ),
  });

  if (stats.prestations.length) {
    faq.push({
      question: `Quelles prestations trouve-t-on chez un ${metier} à ${ville} ?`,
      reponse: `À ${ville}, les prestations les plus fréquemment proposées sont ${liste(stats.prestations.slice(0, 6))}. Le détail complet, avec durée et prix, est affiché sur la fiche de chaque professionnel.`,
    });
  }

  return faq;
}
