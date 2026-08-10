REVOKE ALL ON FUNCTION public.reclamer_invitation() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reclamer_invitation() TO service_role;