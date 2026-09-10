ALTER TABLE public.parametres_salon
  ADD COLUMN IF NOT EXISTS acompte_actif boolean NOT NULL DEFAULT false;

UPDATE public.parametres_salon SET acompte_actif = true WHERE acompte_valeur > 0;

CREATE TABLE public.coordonnees_bancaires (
  salon_id uuid PRIMARY KEY REFERENCES public.salons(id) ON DELETE CASCADE,
  iban text NOT NULL,
  bic text NOT NULL,
  titulaire_compte text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coordonnees_bancaires TO authenticated;
GRANT ALL ON public.coordonnees_bancaires TO service_role;

ALTER TABLE public.coordonnees_bancaires ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coordonnees lecture gerant ou super admin"
  ON public.coordonnees_bancaires FOR SELECT TO authenticated
  USING (
    salon_id IN (SELECT s.id FROM public.salons s WHERE s.gerant_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE POLICY "coordonnees ecriture gerant ou super admin"
  ON public.coordonnees_bancaires FOR ALL TO authenticated
  USING (
    salon_id IN (SELECT s.id FROM public.salons s WHERE s.gerant_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  )
  WITH CHECK (
    salon_id IN (SELECT s.id FROM public.salons s WHERE s.gerant_user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid())
  );

CREATE TRIGGER coordonnees_bancaires_updated_at
  BEFORE UPDATE ON public.coordonnees_bancaires
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reversements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  semaine_debut date NOT NULL,
  montant numeric NOT NULL DEFAULT 0,
  statut text NOT NULL DEFAULT 'a_faire',
  date_virement timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (salon_id, semaine_debut)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reversements TO authenticated;
GRANT ALL ON public.reversements TO service_role;

ALTER TABLE public.reversements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reversements super admin"
  ON public.reversements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.super_admins sa WHERE sa.user_id = auth.uid()));

CREATE TRIGGER reversements_updated_at
  BEFORE UPDATE ON public.reversements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
