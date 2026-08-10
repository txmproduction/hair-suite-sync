CREATE OR REPLACE FUNCTION public.creneaux_disponibles(
  p_salon uuid,
  p_prestation uuid,
  p_employe uuid,
  p_date date
)
RETURNS TABLE (debut timestamptz, employe_id uuid)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_duree int;
  v_jour int := (EXTRACT(isodow FROM p_date)::int - 1);
  v_tz text := 'Europe/Paris';
BEGIN
  SELECT p.duree_min INTO v_duree
    FROM public.prestations p
   WHERE p.id = p_prestation AND p.salon_id = p_salon AND p.actif;
  IF v_duree IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH salon AS (
    SELECT hs.ouverture, hs.fermeture
      FROM public.horaires_salon hs
     WHERE hs.salon_id = p_salon AND hs.jour = v_jour AND NOT hs.ferme
  ),
  emps AS (
    SELECT e.id, he.debut AS h_debut, he.fin AS h_fin
      FROM public.employes e
      LEFT JOIN public.horaires_employe he
        ON he.employe_id = e.id AND he.jour = v_jour
     WHERE e.salon_id = p_salon AND e.actif
       AND (p_employe IS NULL OR e.id = p_employe)
       AND (he.id IS NULL OR he.travaille)
  ),
  fenetres AS (
    SELECT emps.id,
           ((p_date + GREATEST(COALESCE(emps.h_debut, salon.ouverture), salon.ouverture)) AT TIME ZONE v_tz) AS ouvre,
           ((p_date + LEAST(COALESCE(emps.h_fin, salon.fermeture), salon.fermeture)) AT TIME ZONE v_tz) AS ferme
      FROM emps CROSS JOIN salon
  ),
  slots AS (
    SELECT f.id, gs.t
      FROM fenetres f
      CROSS JOIN LATERAL generate_series(
        f.ouvre, f.ferme - make_interval(mins => v_duree), interval '15 minutes'
      ) AS gs(t)
     WHERE f.ferme > f.ouvre
  )
  SELECT s.t, s.id
    FROM slots s
   WHERE s.t > now()
     AND NOT EXISTS (
       SELECT 1 FROM public.rdv r
        WHERE r.employe_id = s.id
          AND r.statut NOT IN ('annule', 'no_show')
          AND (r.statut <> 'en_attente_paiement' OR r.expire_at IS NULL OR r.expire_at > now())
          AND tstzrange(r.debut, r.debut + make_interval(mins => r.duree_min))
              && tstzrange(s.t, s.t + make_interval(mins => v_duree))
     )
   ORDER BY s.t, s.id;
END;
$$;

REVOKE ALL ON FUNCTION public.creneaux_disponibles(uuid, uuid, uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.creneaux_disponibles(uuid, uuid, uuid, date) TO service_role;