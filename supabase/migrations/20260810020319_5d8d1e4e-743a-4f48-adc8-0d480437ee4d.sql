-- Retirer l'exécution ouverte (PUBLIC) sur les fonctions SECURITY DEFINER
REVOKE ALL ON FUNCTION public.creneaux_disponibles(uuid, uuid, uuid, date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.creneaux_disponibles(uuid, uuid, uuid, date) TO service_role;

REVOKE ALL ON FUNCTION public.reclamer_invitation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamer_invitation() TO authenticated, service_role;

-- Helpers utilisés par les policies RLS : seuls les rôles applicatifs, pas PUBLIC
REVOKE ALL ON FUNCTION public.current_salon_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_salon_id() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_gerant() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_gerant() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.mon_employe_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mon_employe_id() TO authenticated, service_role;

-- Durcir reclamer_invitation : ne rattache que si l'email est confirmé
CREATE OR REPLACE FUNCTION public.reclamer_invitation()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email text;
  v_salon uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.email INTO v_email
    FROM auth.users u
   WHERE u.id = auth.uid()
     AND u.email_confirmed_at IS NOT NULL;

  IF v_email IS NULL THEN RETURN NULL; END IF;

  UPDATE public.employes
     SET user_id = auth.uid()
   WHERE user_id IS NULL
     AND lower(email) = lower(v_email)
     AND actif
   RETURNING salon_id INTO v_salon;

  RETURN v_salon;
END;
$function$;

REVOKE ALL ON FUNCTION public.reclamer_invitation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamer_invitation() TO authenticated, service_role;