CREATE TABLE public.articles_blog (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  titre text NOT NULL,
  extrait text NOT NULL DEFAULT '',
  contenu text NOT NULL DEFAULT '',
  categorie_metier public.categorie_salon,
  date_publication timestamptz NOT NULL DEFAULT now(),
  image_couverture_url text,
  statut text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon','publie')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX articles_blog_publies_idx ON public.articles_blog (statut, date_publication DESC);
CREATE INDEX articles_blog_metier_idx ON public.articles_blog (categorie_metier) WHERE statut = 'publie';

GRANT SELECT ON public.articles_blog TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.articles_blog TO authenticated;
GRANT ALL ON public.articles_blog TO service_role;

ALTER TABLE public.articles_blog ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Articles publies lisibles par tous"
ON public.articles_blog FOR SELECT TO anon, authenticated
USING (statut = 'publie');

CREATE POLICY "Super admin lit tous les articles"
ON public.articles_blog FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE POLICY "Super admin cree un article"
ON public.articles_blog FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE POLICY "Super admin modifie un article"
ON public.articles_blog FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE POLICY "Super admin supprime un article"
ON public.articles_blog FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_article_blog_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_articles_blog_updated_at
BEFORE UPDATE ON public.articles_blog
FOR EACH ROW EXECUTE FUNCTION public.touch_article_blog_updated_at();