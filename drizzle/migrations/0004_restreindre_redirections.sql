DROP POLICY IF EXISTS "redirections lisibles par les comptes connectes" ON public.redirections;
REVOKE SELECT ON public.redirections FROM authenticated;