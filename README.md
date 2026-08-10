# HairTrack: Salon Management

https://res.cloudinary.com/dgfdye7cl/image/upload/v1786019698/ED430EB9-1E01-4B0A-B089-6441AD777537_-_Modifie%CC%81_nnivhc.png logo et prompt :Crée une application SaaS multi-tenant de gestion pour salons de coiffure et instituts de beauté, nommée HairTrack, avec Supabase (auth + base de données + RLS stricte par salon).

DESIGN

Style inspiré de Planity : fond #F7F7F5, cartes blanches arrondies (radius 12px) avec ombre douce, typographie sans-serif propre, boutons principaux noirs à texte blanc, couleur d'accent or #C9A227 (éléments actifs, badges, icônes, logo). Interface claire et aérée, jamais sombre. Optimisée tablette et mobile en priorité.

STRUCTURE / NAVIGATION (après connexion)

Barre de nav : Agenda | Caisse | Clients | Statistiques | Admin

RÔLES

- Gérant : accès total, configuration du salon

- Employé : voit l'agenda, encaisse, ne voit que son propre CA (visibilité configurable par le gérant)

Chaque salon est isolé : un compte gérant crée son salon, invite ses employés.

ADMIN (gérant uniquement)

- Infos salon : nom, adresse, téléphone, horaires d'ouverture par jour

- Employés : ajout/modif/désactivation, photo, horaires de travail par employé

- Prestations : organisées par catégories, chacune avec nom, durée (configurable librement, par pas de 5 min), prix, couleur, actions dupliquer/modifier/supprimer, réordonner

- Paramètres réservation : montant ou pourcentage d'acompte configurable, délai d'annulation gratuite configurable (en heures)

AGENDA

- Vue jour par défaut : une colonne par employé, créneaux de 15 min, RDV affichés en blocs colorés (couleur de la prestation) avec nom client + prestation

- Vue semaine par employé

- Clic sur un créneau vide → création rapide d'un RDV manuel : client (recherche ou création rapide nom+téléphone), prestation, employé, la durée bloque automatiquement le bon nombre de créneaux

- Clic sur un RDV → détail : modifier, déplacer (drag & drop), annuler, ou "Terminer et encaisser"

- Statuts : à venir / venu / no-show / annulé

CAISSE

- Bouton "Encaissement rapide" toujours accessible : employé → prestation(s) → moyen de paiement (CB, espèces, chèque, autre) → valider. 3 étapes max, gros boutons tactiles.

- Quand on termine un RDV depuis l'agenda : montant pré-rempli depuis la prestation, acompte éventuel déjà déduit, on choisit le moyen de paiement du solde

- Chaque encaissement enregistre : date/heure, employé, prestation(s), montant, moyen de paiement

- Historique du jour visible avec possibilité de corriger/supprimer (gérant uniquement)

CLIENTS

- Liste avec recherche par nom/téléphone

- Fiche client : coordonnées, historique des RDV et prestations avec statut, total dépensé, notes libres

STATISTIQUES (gérant)

- CA du jour en temps réel, semaine, mois, avec comparaison période précédente

- Répartition par employé et par prestation

- Répartition par moyen de paiement (part espèces / CB)

- Export CSV des encaissements sur une période

TECHNIQUE

- Supabase Auth (email/mot de passe), tables : salons, employes, categories, prestations, clients, rdv, encaissements, parametres_salon

- RLS : chaque donnée rattachée à salon_id, aucun accès croisé entre salons

- Tout en français, montants en euros

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://hair-suite-sync.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/75299c74-bd05-4df0-baec-67893561d715).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
