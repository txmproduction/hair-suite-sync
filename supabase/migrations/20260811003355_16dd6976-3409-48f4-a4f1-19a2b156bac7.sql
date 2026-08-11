CREATE OR REPLACE FUNCTION public.proteger_compte_gerant()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_est_proprietaire boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.salons s
       WHERE s.id = OLD.salon_id
         AND s.gerant_user_id IS NOT NULL
         AND s.gerant_user_id = OLD.user_id
    ) INTO v_est_proprietaire;

    IF v_est_proprietaire AND auth.uid() IS NOT NULL THEN
      RAISE EXCEPTION 'Le compte gérant propriétaire du salon ne peut pas être supprimé.';
    END IF;
    RETURN OLD;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.salons s
     WHERE s.id = OLD.salon_id
       AND s.gerant_user_id IS NOT NULL
       AND s.gerant_user_id = OLD.user_id
  ) INTO v_est_proprietaire;

  IF v_est_proprietaire AND auth.uid() IS NOT NULL THEN
    -- On force le maintien du compte gérant actif, en rôle gérant et rattaché à son utilisateur
    NEW.actif := true;
    NEW.role := 'gerant'::role_employe;
    NEW.user_id := OLD.user_id;
    NEW.salon_id := OLD.salon_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS employes_proteger_gerant_upd ON public.employes;
CREATE TRIGGER employes_proteger_gerant_upd
BEFORE UPDATE ON public.employes
FOR EACH ROW EXECUTE FUNCTION public.proteger_compte_gerant();

DROP TRIGGER IF EXISTS employes_proteger_gerant_del ON public.employes;
CREATE TRIGGER employes_proteger_gerant_del
BEFORE DELETE ON public.employes
FOR EACH ROW EXECUTE FUNCTION public.proteger_compte_gerant();

REVOKE ALL ON FUNCTION public.proteger_compte_gerant() FROM PUBLIC;