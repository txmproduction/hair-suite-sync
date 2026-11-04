# Chantier : droits par employé + PIN tablette partagée — terminé

- [x] Migration : `employes.voit_clients`, colonnes PIN, table `appareils_partages`, fonctions + RLS
- [x] RLS clients selon `voit_clients` ; encaissements INSERT limité à son propre `employe_id`
- [x] RLS encaissements en lecture : gérant / `voit_ca_global` / ses propres encaissements seulement
- [x] Fonctions serveur PIN (liste personnel appareil, déverrouillage, définir PIN, enrôler appareil)
- [x] Écran neutre « Qui êtes-vous ? » + pavé PIN sur route publique (+ lien connexion e-mail gérant)
- [x] Verrou d'inactivité (2 min) + retour à l'écran neutre après encaissement, par rechargement complet
- [x] Admin : interrupteur clients, gestion des PIN, appareils partagés
- [x] Clients en lecture seule et page bloquée sans `voit_clients`
- [x] Vérifications (base + parcours navigateur) : PIN, restrictions, blocage 5 essais, tentatives d'API directes

Abandonné sur demande : réglage « voit_prestations » (prestations actives toujours visibles).

# Réduction Run — photos privées et super-admin

- [ ] Passer l'actualisation des abonnés à 60 secondes.
- [ ] Remplacer le transfert des photos par des liens signés réutilisés, sans changer la base ni rendre le stockage public.
- [ ] Vérifier les photos, les restrictions de chemin et les tests de cache ; rapporter les limites des économies estimées.
