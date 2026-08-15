ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
UPDATE public.salons SET updated_at = created_at WHERE updated_at IS NULL OR updated_at > now();

CREATE OR REPLACE FUNCTION public.touch_salon_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS salons_touch_updated_at ON public.salons;
CREATE TRIGGER salons_touch_updated_at BEFORE UPDATE ON public.salons
FOR EACH ROW EXECUTE FUNCTION public.touch_salon_updated_at();

CREATE TABLE IF NOT EXISTS public.redirections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chemin_source text NOT NULL UNIQUE,
  chemin_cible text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.redirections TO service_role;
GRANT SELECT ON public.redirections TO authenticated;
ALTER TABLE public.redirections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "redirections lisibles par les comptes connectes" ON public.redirections;
CREATE POLICY "redirections lisibles par les comptes connectes"
ON public.redirections FOR SELECT TO authenticated USING (true);