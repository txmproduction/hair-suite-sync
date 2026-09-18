-- 1. Droits et PIN par employé
ALTER TABLE public.employes
  ADD COLUMN IF NOT EXISTS voit_clients boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pin_hash text,
  ADD COLUMN IF NOT EXISTS pin_maj_le timestamptz,
  ADD COLUMN IF NOT EXISTS pin_essais_echoues integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pin_bloque_jusqu_a timestamptz;

-- Les gérants existants voient déjà tout : on ouvre les clients aux employés déjà en place
UPDATE public.employes SET voit_clients = true WHERE role = 'gerant';

-- 2. Appareils partagés (tablette de comptoir)
CREATE TABLE IF NOT EXISTS public.appareils_partages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  nom text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  actif boolean NOT NULL DEFAULT true,
  cree_par uuid,
  derniere_utilisation_le timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS appareils_partages_salon_idx ON public.appareils_partages(salon_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appareils_partages TO authenticated;
GRANT ALL ON public.appareils_partages TO service_role;

ALTER TABLE public.appareils_partages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appareils gerant" ON public.appareils_partages;
CREATE POLICY "appareils gerant" ON public.appareils_partages
  FOR ALL TO authenticated
  USING (salon_id = securite.current_salon_id() AND securite.is_gerant())
  WITH CHECK (salon_id = securite.current_salon_id() AND securite.is_gerant());

-- 3. Fonction de droit « voit les clients »
CREATE OR REPLACE FUNCTION securite.voit_clients()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employes
    WHERE user_id = auth.uid() AND actif AND (role = 'gerant' OR voit_clients)
  );
$$;

-- 4. Lecture des clients : gérant, employé autorisé, ou client d'un de ses propres RDV
DROP POLICY IF EXISTS "clients lecture" ON public.clients;
CREATE POLICY "clients lecture" ON public.clients
  FOR SELECT TO authenticated
  USING (
    salon_id = securite.current_salon_id()
    AND (
      securite.voit_clients()
      OR EXISTS (
        SELECT 1 FROM public.rdv r
        WHERE r.client_id = clients.id
          AND r.employe_id = securite.mon_employe_id()
      )
    )
  );

-- 5. Un employé n'encaisse que sous son propre nom
DROP POLICY IF EXISTS "encaissements insert" ON public.encaissements;
CREATE POLICY "encaissements insert" ON public.encaissements
  FOR INSERT TO authenticated
  WITH CHECK (
    salon_id = securite.current_salon_id()
    AND (securite.is_gerant() OR employe_id = securite.mon_employe_id())
  );
