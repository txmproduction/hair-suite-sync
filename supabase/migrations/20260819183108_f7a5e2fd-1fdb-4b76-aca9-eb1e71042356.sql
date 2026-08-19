-- 1. Espace privé, hors schéma exposé par l'API
CREATE SCHEMA IF NOT EXISTS securite;
REVOKE ALL ON SCHEMA securite FROM PUBLIC;
GRANT USAGE ON SCHEMA securite TO authenticated, service_role;

-- 2. Fonctions internes recréées hors de l'API publique
CREATE OR REPLACE FUNCTION securite.current_salon_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT salon_id FROM public.employes WHERE user_id = auth.uid() AND actif LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION securite.is_gerant()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employes
    WHERE user_id = auth.uid() AND actif AND role = 'gerant'
  );
$$;

CREATE OR REPLACE FUNCTION securite.mon_employe_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.employes WHERE user_id = auth.uid() AND actif LIMIT 1;
$$;

REVOKE ALL ON FUNCTION securite.current_salon_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION securite.is_gerant() FROM PUBLIC;
REVOKE ALL ON FUNCTION securite.mon_employe_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION securite.current_salon_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION securite.is_gerant() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION securite.mon_employe_id() TO authenticated, service_role;

-- 3. Réécriture de toutes les règles d'accès vers les fonctions privées
DO $$
DECLARE p record; v_qual text; v_check text; v_sql text;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname, qual, with_check
      FROM pg_policies
     WHERE schemaname = 'public'
       AND (coalesce(qual,'') || ' ' || coalesce(with_check,'')) ~ '(current_salon_id|is_gerant|mon_employe_id)\('
  LOOP
    v_qual := p.qual;
    v_check := p.with_check;

    FOREACH v_sql IN ARRAY ARRAY['current_salon_id','is_gerant','mon_employe_id'] LOOP
      IF v_qual IS NOT NULL THEN
        v_qual := replace(v_qual, 'securite.' || v_sql || '(', v_sql || '(');
        v_qual := replace(v_qual, v_sql || '(', 'securite.' || v_sql || '(');
      END IF;
      IF v_check IS NOT NULL THEN
        v_check := replace(v_check, 'securite.' || v_sql || '(', v_sql || '(');
        v_check := replace(v_check, v_sql || '(', 'securite.' || v_sql || '(');
      END IF;
    END LOOP;

    v_sql := format('ALTER POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
    IF v_qual IS NOT NULL THEN
      v_sql := v_sql || format(' USING (%s)', v_qual);
    END IF;
    IF v_check IS NOT NULL THEN
      v_sql := v_sql || format(' WITH CHECK (%s)', v_check);
    END IF;
    EXECUTE v_sql;
  END LOOP;
END $$;

-- 4. Suppression des versions publiques appelables par les comptes connectés
DROP FUNCTION IF EXISTS public.current_salon_id();
DROP FUNCTION IF EXISTS public.is_gerant();
DROP FUNCTION IF EXISTS public.mon_employe_id();