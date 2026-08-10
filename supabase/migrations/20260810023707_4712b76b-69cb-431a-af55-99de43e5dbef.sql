-- 1. Enum catégorie de salon
DO $$ BEGIN
  CREATE TYPE public.categorie_salon AS ENUM ('coiffeur','barbier','manucure','institut_beaute','bien_etre');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Champs fiche publique sur salons
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS categorie public.categorie_salon NOT NULL DEFAULT 'coiffeur',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS code_postal text,
  ADD COLUMN IF NOT EXISTS photo_couverture_url text,
  ADD COLUMN IF NOT EXISTS note_moyenne numeric(3,2),
  ADD COLUMN IF NOT EXISTS nb_avis integer NOT NULL DEFAULT 0;

-- 3. Jeton d'avis sur rdv
ALTER TABLE public.rdv
  ADD COLUMN IF NOT EXISTS avis_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS rdv_avis_token_key ON public.rdv(avis_token);

-- 4. Modération des avis
ALTER TABLE public.parametres_salon
  ADD COLUMN IF NOT EXISTS moderation_avis boolean NOT NULL DEFAULT false;

-- 5. Galerie photos
CREATE TABLE IF NOT EXISTS public.photos_salon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  url text NOT NULL,
  ordre integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photos_salon TO authenticated;
GRANT ALL ON public.photos_salon TO service_role;
ALTER TABLE public.photos_salon ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos lecture membres" ON public.photos_salon
  FOR SELECT TO authenticated USING (salon_id = public.current_salon_id());
CREATE POLICY "photos ecriture gerant" ON public.photos_salon
  FOR ALL TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));

-- 6. Avis clients
CREATE TABLE IF NOT EXISTS public.avis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  rdv_id uuid UNIQUE REFERENCES public.rdv(id) ON DELETE SET NULL,
  note integer NOT NULL CHECK (note BETWEEN 1 AND 5),
  commentaire text,
  client_nom text,
  visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.avis TO authenticated;
GRANT ALL ON public.avis TO service_role;
ALTER TABLE public.avis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "avis lecture membres" ON public.avis
  FOR SELECT TO authenticated USING (salon_id = public.current_salon_id());
CREATE POLICY "avis ecriture gerant" ON public.avis
  FOR ALL TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $fn$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $fn$;

CREATE TRIGGER avis_updated_at BEFORE UPDATE ON public.avis
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Recalcul note moyenne / nb avis
CREATE OR REPLACE FUNCTION public.recalculer_note_salon()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_salon uuid;
BEGIN
  v_salon := COALESCE(NEW.salon_id, OLD.salon_id);
  UPDATE public.salons s
     SET note_moyenne = sub.moyenne, nb_avis = sub.total
    FROM (
      SELECT round(avg(note)::numeric, 2) AS moyenne, count(*)::int AS total
        FROM public.avis
       WHERE salon_id = v_salon AND visible
    ) sub
   WHERE s.id = v_salon;
  RETURN NULL;
END;
$$;

CREATE TRIGGER avis_recalcul
AFTER INSERT OR UPDATE OR DELETE ON public.avis
FOR EACH ROW EXECUTE FUNCTION public.recalculer_note_salon();

-- 8. Candidatures distribution (accès serveur uniquement)
CREATE TABLE IF NOT EXISTS public.candidatures_distribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  telephone text NOT NULL,
  email text NOT NULL,
  ville text NOT NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.candidatures_distribution TO service_role;
ALTER TABLE public.candidatures_distribution ENABLE ROW LEVEL SECURITY;

-- 9. Ville renseignée depuis l'adresse si vide
UPDATE public.salons SET ville = NULLIF(trim(split_part(adresse, ',', 2)), '') WHERE ville IS NULL AND adresse IS NOT NULL;