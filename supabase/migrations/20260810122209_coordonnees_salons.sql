-- Coordonnées GPS des salons, nécessaires à la recherche "autour de moi"
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS latitude numeric(9,6),
  ADD COLUMN IF NOT EXISTS longitude numeric(9,6);

CREATE INDEX IF NOT EXISTS salons_coordonnees_idx
  ON public.salons (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
