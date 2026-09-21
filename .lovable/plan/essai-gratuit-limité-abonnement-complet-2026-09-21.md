# Essai gratuit limité → abonnement complet

Objectif : rendre l'essai gratuit utile mais limité, afin de donner une vraie raison de passer à l'abonnement payant, avec des limites appliquées côté base de données (et non seulement dans l'écran).

## 1. Limites de l'essai (hypothèses à ajuster si besoin)

| Fonctionnalité | Essai gratuit | Abonnement complet |
| --- | --- | --- |
| Agenda, caisse, clients, statistiques | Inclus | Inclus |
| Fiche publique + réservation en ligne | Inclus | Inclus |
| Collaborateurs | 2 maximum | Illimité |
| Rendez-vous par mois | 60 maximum | Illimité |
| Acompte en ligne à la réservation | Désactivé | Inclus |
| Export CSV des statistiques | Inclus | Inclus |

Ces trois seuils (2 collaborateurs, 60 rendez-vous/mois, acomptes bloqués) sont centralisés dans un seul fichier pour être modifiés en une ligne.

## 2. Contrôle réel côté base de données

Une fonction interne calcule si un salon a « l'accès complet » (abonnement actif, hors compte suspendu). Trois garde-fous sont ajoutés en base :

- ajout d'un collaborateur au-delà de la limite d'essai → refusé
- création d'un rendez-vous au-delà du quota mensuel d'essai → refusé
- activation de l'acompte Stripe sur les prestations → refusée pendant l'essai

Ces contrôles s'appliquent quelle que soit l'origine (écran gérant, réservation en ligne, appel direct à l'API), y compris pour la réservation publique : le visiteur reçoit alors un message clair indiquant que le salon ne peut plus prendre de réservation en ligne, plutôt qu'une erreur technique.

## 3. Écrans du tableau de bord

- Nouvelle information « mes droits » (accès complet ou non, limites, consommation du mois) chargée depuis le serveur.
- Pendant l'essai, les fonctions réservées restent visibles mais grisées : bouton d'ajout de collaborateur une fois la limite atteinte, interrupteur d'acompte, et un compteur « 42 / 60 rendez-vous ce mois-ci » dans l'Admin.
- Au clic sur un élément réservé : fenêtre explicative « Cette fonctionnalité est réservée à l'abonnement complet », le détail de la limite atteinte et un bouton « Passer à l'abonnement » qui mène à la page Abonnement. Jamais de blocage muet.
- Bannière d'essai (compte à rebours existant conservé) enrichie d'un lien « Voir ce qui est inclus dans l'abonnement complet ».

## 4. Page Abonnement enrichie

- Bloc d'appel à l'action en haut de page : titre, prix, bouton « Passer à l'abonnement complet », rappel des jours d'essai restants.
- Vrai tableau comparatif ligne par ligne : colonne « Essai gratuit » vs colonne « Abonnement complet », reprenant exactement les limites du tableau ci-dessus (coche / croix / valeur).
- Les cartes de formules Essentiel et Premium et le portail de gestion Stripe restent en place, sous le comparatif.

## 5. Fin d'essai

Comportement actuel conservé : aucune fermeture de compte, écran « Votre essai gratuit est terminé », données conservées, accès à la page Abonnement et lien de contact direct par e-mail.

## Détails techniques

- Migration : `securite.acces_complet(uuid)` (SECURITY DEFINER, lit `salons.abonnement_actif` / `compte_suspendu`), plus trois triggers `BEFORE INSERT`/`UPDATE` sur `employes`, `rdv`, `parametres_salon` levant des codes d'erreur dédiés (`HT_LIMITE_EMPLOYES`, `HT_LIMITE_RDV`, `HT_ACOMPTE_ABONNEMENT`). Pas de suppression ni de changement de colonne existante.
- `src/lib/droits.ts` : constantes de limites + libellés du comparatif, partagés écran/serveur.
- `src/lib/droits.functions.ts` : `etatDroitsFn` (accès complet, limites, nombre de collaborateurs actifs, rendez-vous du mois en cours) via `requireSupabaseAuth`.
- `src/components/DialogAbonnement.tsx` : fenêtre de conversion réutilisable + petit hook d'ouverture.
- Traduction des erreurs base → message lisible dans `src/routes/_authenticated/admin.tsx`, `agenda.tsx` et `src/lib/reservation.server.ts`.
- Page `src/routes/_authenticated/abonnement.tsx` : ajout du bloc CTA haut de page et du tableau comparatif.
- Bannière dans `src/components/AppShell.tsx`.
