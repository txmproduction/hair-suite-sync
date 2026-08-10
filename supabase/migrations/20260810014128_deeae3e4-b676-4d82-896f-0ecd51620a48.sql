-- Salons : slug + activation réservation en ligne
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS reservation_en_ligne boolean NOT NULL DEFAULT true;

CREATE OR REPLACE FUNCTION public.unaccent_immutable(p_texte text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT translate(p_texte,
    'àáâãäåçèéêëìíîïñòóôõöùúûüýÿÀÁÂÃÄÅÇÈÉÊËÌÍÎÏÑÒÓÔÕÖÙÚÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY');
$$;

CREATE OR REPLACE FUNCTION public.slugifier(p_texte text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT trim(both '-' from regexp_replace(lower(public.unaccent_immutable(p_texte)), '[^a-z0-9]+', '-', 'g'));
$$;

UPDATE public.salons
   SET slug = public.slugifier(nom)
 WHERE slug IS NULL OR slug = '';

-- unicité + doublons éventuels
UPDATE public.salons s
   SET slug = s.slug || '-' || left(replace(s.id::text, '-', ''), 6)
 WHERE EXISTS (
   SELECT 1 FROM public.salons a WHERE a.slug = s.slug AND a.id <> s.id
 );

CREATE UNIQUE INDEX IF NOT EXISTS salons_slug_unique ON public.salons (slug);

-- Rendez-vous : origine, expiration, annulation, paiement
ALTER TABLE public.rdv
  ADD COLUMN IF NOT EXISTS origine text NOT NULL DEFAULT 'salon',
  ADD COLUMN IF NOT EXISTS expire_at timestamptz,
  ADD COLUMN IF NOT EXISTS annulation_token uuid NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS paiement_ref text;

ALTER TABLE public.rdv ADD COLUMN IF NOT EXISTS fin timestamptz;

CREATE INDEX IF NOT EXISTS rdv_annulation_token_idx ON public.rdv (annulation_token);

CREATE OR REPLACE FUNCTION public.rdv_calcule_fin()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.fin := NEW.debut + make_interval(mins => NEW.duree_min);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS rdv_fin_trigger ON public.rdv;
CREATE TRIGGER rdv_fin_trigger BEFORE INSERT OR UPDATE ON public.rdv
  FOR EACH ROW EXECUTE FUNCTION public.rdv_calcule_fin();

UPDATE public.rdv SET fin = debut + make_interval(mins => duree_min) WHERE fin IS NULL;

-- Anti double-booking
CREATE EXTENSION IF NOT EXISTS btree_gist;

DELETE FROM public.rdv a
 USING public.rdv b
 WHERE a.id > b.id
   AND a.employe_id = b.employe_id
   AND a.statut NOT IN ('annule', 'no_show')
   AND b.statut NOT IN ('annule', 'no_show')
   AND tstzrange(a.debut, a.debut + make_interval(mins => a.duree_min)) &&
       tstzrange(b.debut, b.debut + make_interval(mins => b.duree_min));

ALTER TABLE public.rdv DROP CONSTRAINT IF EXISTS rdv_pas_de_chevauchement;
ALTER TABLE public.rdv ADD CONSTRAINT rdv_pas_de_chevauchement
  EXCLUDE USING gist (
    employe_id WITH =,
    tstzrange(debut, fin) WITH &&
  ) WHERE (statut NOT IN ('annule', 'no_show'));

-- Créneaux disponibles (aucun rdv ni client exposé)
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
      JOIN public.horaires_employe he
        ON he.employe_id = e.id AND he.jour = v_jour AND he.travaille
     WHERE e.salon_id = p_salon AND e.actif
       AND (p_employe IS NULL OR e.id = p_employe)
  ),
  fenetres AS (
    SELECT emps.id,
           ((p_date + GREATEST(emps.h_debut, salon.ouverture)) AT TIME ZONE v_tz) AS ouvre,
           ((p_date + LEAST(emps.h_fin, salon.fermeture)) AT TIME ZONE v_tz) AS ferme
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