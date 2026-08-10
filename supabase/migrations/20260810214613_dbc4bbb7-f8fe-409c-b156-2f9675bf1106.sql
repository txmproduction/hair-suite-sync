UPDATE public.encaissements e
SET created_at = r.debut + make_interval(mins => r.duree_min)
FROM public.rdv r
WHERE r.id = e.rdv_id
  AND date(e.created_at) <> date(r.debut);