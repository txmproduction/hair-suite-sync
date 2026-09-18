# Droits par employé + changement rapide par code PIN sur la tablette partagée

## Ce que ça donne pour l'utilisateur

- Chaque employé a ses propres droits, réglés un par un par le gérant : il voit toujours **son** chiffre d'affaires, et le gérant peut en plus lui ouvrir (en lecture seule) la liste des clients et la liste des prestations.
- Un employé peut **créer** un encaissement, jamais en **supprimer** un — même le sien. Seul le gérant supprime.
- Sur la tablette du comptoir : écran neutre « Qui êtes-vous ? » avec la liste du personnel. On tape son nom + son code à 4 chiffres, on encaisse, et la tablette revient toute seule à l'écran neutre (après l'encaissement ou après 2 minutes sans activité).
- Le gérant aussi doit s'identifier sur cette tablette : aucune session privilégiée ne reste ouverte en arrière-plan.

## Point important sur l'architecture actuelle

L'app utilise déjà une vraie authentification par personne, et les règles de sécurité de la base filtrent déjà par salon et par rôle (`current_salon_id`, `is_gerant`, `mon_employe_id`). Le PIN ne sera donc **pas** un cache-misère posé sur une session ouverte : chaque déverrouillage crée une **vraie session de l'employé concerné**, et l'écran neutre correspond à un état réellement déconnecté. Les employés qui n'ont pas encore de compte en obtiendront un, interne, sans mot de passe utilisable.

Hypothèse à confirmer : les prestations **actives** restent lisibles par tout employé, car l'encaissement rapide en a besoin pour composer le ticket. Le réglage « voir les prestations » gouverne l'accès à la page catalogue complète (y compris prestations désactivées). Dites-moi si vous préférez un autre découpage.

## Détails techniques

### Schéma (migration additive)

- `employes` : `voit_clients boolean not null default false`, `voit_prestations boolean not null default false`, `pin_hash text`, `pin_maj_le timestamptz`, `pin_essais_echoues int not null default 0`, `pin_bloque_jusqu_a timestamptz`.
- Nouvelle table `appareils_partages` (id, salon_id, nom, token_hash, cree_par, actif, derniere_utilisation_le) + GRANT + RLS (gérant du salon uniquement).
- Fonctions `securite.voit_clients()` / `securite.voit_prestations()` (SECURITY DEFINER, comme les existantes).
- Politiques RLS mises à jour :
  - `clients` SELECT/UPDATE/INSERT : `is_gerant() OR voit_clients()`.
  - `prestations` SELECT : gérant → tout ; employé → `actif` seulement, et catalogue complet si `voit_prestations()`.
  - `encaissements` : DELETE/UPDATE restent gérant seulement (déjà le cas) ; INSERT restreint pour qu'un employé ne puisse insérer qu'avec `employe_id = mon_employe_id()`.
  - `encaissements` SELECT : inchangé (le sien, ou tout si `voit_ca_global`).

### Authentification PIN

- `src/lib/pin.functions.ts` :
  - `listerPersonnelAppareilFn` — **non authentifiée**, exige un token d'appareil valide, renvoie uniquement prénom/photo/role du personnel actif du salon.
  - `deverrouillerPinFn` — non authentifiée : token d'appareil + `employe_id` + PIN. Vérifie le hash (bcrypt/scrypt, coût élevé), applique un verrou de 5 minutes après 5 échecs, puis, via le client privilégié chargé **dans le handler**, génère un lien à usage unique pour le compte de cet employé et renvoie le `hashed_token` ; le client appelle `verifyOtp` pour obtenir une vraie session Supabase.
  - `definirPinFn` / `enrolerAppareilFn` — authentifiées `requireSupabaseAuth`, réservées au gérant du salon (vérification du rôle via `context.supabase`, jamais via le client privilégié).
- Les PIN ne sont jamais renvoyés au client ; seul le hash est stocké.

### Interface

- `src/routes/caisse-partagee.tsx` (route publique) : enrôlement de l'appareil (token collé/QR fourni par le gérant, gardé en `localStorage`), écran neutre « Qui êtes-vous ? », pavé PIN, puis redirection vers l'espace de la personne identifiée.
- `src/components/VerrouInactivite.tsx` : minuteur d'inactivité + déconnexion propre (annulation des requêtes, vidage du cache, `signOut`, retour à l'écran neutre) ; même séquence après un encaissement validé sur un appareil partagé.
- `src/routes/_authenticated/admin.tsx` : par employé, interrupteurs « voit les clients » / « voit les prestations », définition/réinitialisation du code PIN, et une section « Appareils partagés » pour enrôler/révoquer la tablette.
- `src/routes/_authenticated/caisse.tsx` : bouton de suppression déjà réservé au gérant, à conserver ; masquer les totaux salon pour un employé sans `voit_ca_global`.
- `src/routes/_authenticated/clients.index.tsx` et la vue prestations : rendues en lecture seule quand le droit est accordé sans être gérant.

### Vérifications

- Session employé : lecture des clients refusée droit coupé, autorisée droit ouvert.
- Suppression d'un encaissement par un employé : refusée par la base, pas seulement par l'écran.
- Retour arrière / fermeture de l'écran PIN : aboutit à l'écran neutre, jamais à un tableau de bord.
- Blocage après 5 PIN erronés.
