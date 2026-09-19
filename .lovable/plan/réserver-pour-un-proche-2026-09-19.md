# Réserver pour un proche

## Point important avant de commencer

Aujourd'hui, la réservation en ligne HairTrack se fait **sans compte client** : le visiteur saisit nom + téléphone + e-mail à la dernière étape, et retrouve son rendez-vous via un lien unique. Il n'existe donc ni « espace client », ni « Mes rendez-vous », ni « paramètres du compte » où poser une section « Mes proches ».

Deux conséquences sur votre demande :

- Les points 1 à 4 (proches, étape « Pour qui ? », bénéficiaire sur le rendez-vous, notifications au seul titulaire) se font dans le parcours existant.
- Les points 5 et 6 (historique par bénéficiaire, gestion des proches hors réservation) supposent un espace client. Je propose de le créer, en version légère.

**Hypothèse retenue** (dites-moi si vous préférez autrement) : un espace client accessible par lien e-mail (aucun mot de passe). Le client saisit son e-mail, reçoit un lien, et accède à « Mes rendez-vous » et « Mes proches ». Si vous préférez, on peut livrer d'abord les points 1 à 4 seuls et remettre l'espace client à plus tard.

## Ce que le client verra

1. **Pendant la réservation** : après avoir saisi ses coordonnées, une étape « Pour qui est ce rendez-vous ? » avec « Moi-même », la liste de ses proches déjà enregistrés, et « + Ajouter un proche » (prénom, nom, date de naissance optionnelle) qui l'ajoute aussitôt au rendez-vous en cours. Un seul clic pour « Moi-même », comme aujourd'hui.
2. **Sur la confirmation et le rappel** : mention « Rendez-vous pour Léa Martin » quand ce n'est pas le titulaire.
3. **Espace client** (`/mon-compte`) : connexion par lien e-mail, liste des rendez-vous à venir et passés avec onglets « Tous / Moi / chaque proche », détail complet (prestation, date, prix), et une section « Mes proches » pour ajouter, modifier, supprimer.
4. **Côté salon** : le nom du bénéficiaire apparaît sur la fiche du rendez-vous dans l'agenda et dans l'historique de la fiche client, pour que le praticien sache qui vient.

Les e-mails et SMS restent envoyés uniquement au titulaire du compte, jamais au proche.

## Détails techniques

### Base de données (une migration additive)

- `public.proches` : `id uuid pk`, `client_id uuid not null references clients(id) on delete cascade`, `prenom text not null`, `nom text not null`, `date_naissance date null`, `created_at timestamptz not null default now()`. Index sur `client_id`.
- `public.rdv.beneficiaire_id uuid null references proches(id) on delete set null`. `null` = le titulaire (comportement actuel inchangé).
- GRANT + RLS : `proches` lisible/modifiable par le salon propriétaire du client via les helpers existants (`securite.current_salon_id()`, `securite.is_gerant()`, `securite.voit_clients()`), même logique que `clients`. Aucun accès `anon` : le parcours public et l'espace client passent par des fonctions serveur en service role, comme le reste de la réservation.

### Serveur

- `src/lib/reservation.server.ts` : `creerReservationPublique` accepte `beneficiaireId` (vérifié comme appartenant au client résolu par téléphone) ou `nouveauProche` (prénom/nom/date) qu'elle crée puis rattache ; écrit `beneficiaire_id` sur le rdv. `chargerReservation` renvoie le nom du bénéficiaire.
- Nouvelle fonction serveur publique `prochesDuClientFn` : à partir du téléphone + salon, renvoie les proches connus (prénom/nom seulement) pour alimenter l'étape « Pour qui ? ».
- Nouveau `src/lib/compte-client.server.ts` + `.functions.ts` : envoi du lien e-mail, chargement des rendez-vous du client (tous salons, groupés par bénéficiaire), CRUD des proches.

### Interface

- `src/routes/reserver.$slug.tsx` : les 4 étapes deviennent 5, avec l'étape « Pour qui ? » insérée après les coordonnées (l'identité du titulaire est nécessaire pour retrouver ses proches). Cartes cliquables reprenant le style des étapes praticien/prestation existantes, aucun nouveau composant.
- `src/routes/reservation.$token.tsx` : ligne « Pour : … » quand un bénéficiaire est renseigné.
- Nouvelles routes `src/routes/mon-compte.tsx` (connexion + rendez-vous avec onglets) et la section « Mes proches » dans la même page, en réutilisant `card-soft`, `Button`, `Input`, `Label`.
- `src/routes/_authenticated/agenda.tsx` et `clients.$clientId.tsx` : affichage du bénéficiaire.

### Notifications

Le code d'envoi continue de lire l'e-mail/téléphone de `clients` uniquement ; `proches` n'expose aucun contact (pas de champ téléphone/e-mail sur la table), ce qui rend l'exigence structurelle.
