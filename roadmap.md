# Chantier : droits par employé + PIN tablette partagée

- [ ] Migration : `employes.voit_clients`, colonnes PIN, table `appareils_partages`, fonctions + RLS
- [ ] RLS clients selon `voit_clients` ; encaissements INSERT limité à son propre `employe_id`
- [ ] Fonctions serveur PIN (liste personnel appareil, déverrouillage, définir PIN, enrôler appareil)
- [ ] Écran neutre « Qui êtes-vous ? » + pavé PIN sur route publique
- [ ] Verrou d'inactivité + retour à l'écran neutre après encaissement
- [ ] Admin : interrupteur clients, gestion des PIN, appareils partagés
- [ ] Clients en lecture seule pour un employé non gérant
- [ ] Vérifications (base + parcours)

Abandonné sur demande : réglage « voit_prestations » (prestations actives toujours visibles).
