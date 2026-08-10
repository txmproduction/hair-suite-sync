CREATE TYPE public.statut_salon AS ENUM ('reclame', 'non_reclame');

ALTER TABLE public.salons
  ADD COLUMN statut public.statut_salon NOT NULL DEFAULT 'reclame',
  ADD COLUMN lien_externe text,
  ADD COLUMN source text;

ALTER TABLE public.salons ALTER COLUMN gerant_user_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.salons_forcer_non_reclame()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.statut = 'non_reclame' THEN
    NEW.reservation_en_ligne := false;
    NEW.gerant_user_id := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER salons_non_reclame_trigger
BEFORE INSERT OR UPDATE ON public.salons
FOR EACH ROW EXECUTE FUNCTION public.salons_forcer_non_reclame();

ALTER TABLE public.salons
  ADD CONSTRAINT salons_non_reclame_coherent CHECK (
    (statut = 'non_reclame' AND gerant_user_id IS NULL AND reservation_en_ligne = false)
    OR (statut = 'reclame' AND gerant_user_id IS NOT NULL)
  );

CREATE TABLE public.clics_reservation_manquee (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT ALL ON public.clics_reservation_manquee TO service_role;
ALTER TABLE public.clics_reservation_manquee ENABLE ROW LEVEL SECURITY;

CREATE INDEX clics_reservation_manquee_salon_idx
  ON public.clics_reservation_manquee (salon_id, created_at DESC);

CREATE TABLE public.super_admins (
  user_id uuid NOT NULL PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.super_admins TO authenticated;
GRANT ALL ON public.super_admins TO service_role;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admin voit sa ligne"
ON public.super_admins FOR SELECT TO authenticated
USING (user_id = auth.uid());