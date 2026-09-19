CREATE TABLE public.proches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  prenom text NOT NULL,
  nom text NOT NULL,
  date_naissance date,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX proches_client_id_idx ON public.proches (client_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.proches TO authenticated;
GRANT ALL ON public.proches TO service_role;

ALTER TABLE public.proches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proches lecture" ON public.proches
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = proches.client_id
      AND c.salon_id = securite.current_salon_id()
      AND (
        securite.is_gerant()
        OR securite.voit_clients()
        OR EXISTS (
          SELECT 1 FROM public.rdv r
          WHERE r.client_id = c.id AND r.employe_id = securite.mon_employe_id()
        )
      )
  )
);

CREATE POLICY "proches ecriture gerant" ON public.proches
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = proches.client_id
      AND c.salon_id = securite.current_salon_id()
      AND securite.is_gerant()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = proches.client_id
      AND c.salon_id = securite.current_salon_id()
      AND securite.is_gerant()
  )
);

ALTER TABLE public.rdv ADD COLUMN beneficiaire_id uuid REFERENCES public.proches(id) ON DELETE SET NULL;

CREATE INDEX rdv_beneficiaire_id_idx ON public.rdv (beneficiaire_id);