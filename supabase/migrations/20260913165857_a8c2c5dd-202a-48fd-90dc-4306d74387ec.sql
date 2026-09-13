update encaissements e
set lignes = jsonb_build_array(jsonb_build_object('nom', p.nom, 'prix', p.prix))
from rdv r join prestations p on p.id = r.prestation_id
where e.rdv_id = r.id
  and e.salon_id = 'ea1248b0-c12f-4e24-a034-9679976785ac'
  and not (e.lignes @> '[{"nom":""}]'::jsonb)
  and (e.lignes = '[]'::jsonb or not (e.lignes -> 0 ? 'nom'));