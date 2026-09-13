ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS google_place_id text,
  ADD COLUMN IF NOT EXISTS photos_synchro_le timestamptz,
  ADD COLUMN IF NOT EXISTS photos_erreur text;

CREATE UNIQUE INDEX IF NOT EXISTS salons_google_place_id_unique
  ON public.salons (google_place_id) WHERE google_place_id IS NOT NULL;

ALTER TABLE public.photos_salon
  ADD COLUMN IF NOT EXISTS attribution text;

CREATE POLICY "Service role gere les photos de salons"
  ON storage.objects FOR ALL TO service_role
  USING (bucket_id = 'photos-salons')
  WITH CHECK (bucket_id = 'photos-salons');