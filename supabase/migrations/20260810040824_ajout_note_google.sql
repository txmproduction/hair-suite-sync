-- Notes Google (issues de l'enrichissement Sirenly) pour les fiches non réclamées
ALTER TABLE public.salons
  ADD COLUMN IF NOT EXISTS note_google numeric(2,1),
  ADD COLUMN IF NOT EXISTS nb_avis_google integer;
