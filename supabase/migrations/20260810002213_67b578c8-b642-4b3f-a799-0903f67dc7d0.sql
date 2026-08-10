
CREATE OR REPLACE FUNCTION public.reclamer_invitation()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_salon uuid;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();
  IF v_email IS NULL THEN RETURN NULL; END IF;

  UPDATE public.employes
     SET user_id = auth.uid()
   WHERE user_id IS NULL
     AND lower(email) = lower(v_email)
     AND actif
   RETURNING salon_id INTO v_salon;

  RETURN v_salon;
END;
$$;

REVOKE ALL ON FUNCTION public.reclamer_invitation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reclamer_invitation() TO authenticated;
