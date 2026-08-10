-- Extension du enum categorie_salon avec les nouveaux métiers (alignement sur la couverture Planity)
ALTER TYPE public.categorie_salon ADD VALUE IF NOT EXISTS 'massage';
ALTER TYPE public.categorie_salon ADD VALUE IF NOT EXISTS 'sophrologue';
ALTER TYPE public.categorie_salon ADD VALUE IF NOT EXISTS 'reflexologue';
ALTER TYPE public.categorie_salon ADD VALUE IF NOT EXISTS 'hypnotherapeute';
ALTER TYPE public.categorie_salon ADD VALUE IF NOT EXISTS 'naturopathe';
ALTER TYPE public.categorie_salon ADD VALUE IF NOT EXISTS 'coach_de_vie';
