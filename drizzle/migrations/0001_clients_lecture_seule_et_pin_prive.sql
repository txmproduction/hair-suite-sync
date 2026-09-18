-- Les clients ne sont modifiables que par le gérant : les employés autorisés y accèdent en lecture seule.
DROP POLICY IF EXISTS "clients update" ON public.clients;
CREATE POLICY "clients update gerant" ON public.clients
  FOR UPDATE TO authenticated
  USING (salon_id = securite.current_salon_id() AND securite.is_gerant())
  WITH CHECK (salon_id = securite.current_salon_id() AND securite.is_gerant());

-- L'empreinte du code PIN ne doit jamais être lisible via l'API de données.
REVOKE SELECT ON public.employes FROM authenticated;
GRANT SELECT (
  id, salon_id, user_id, nom, email, telephone, photo_url, role, actif,
  voit_ca_global, voit_clients, couleur, ordre, created_at, pin_maj_le, pin_bloque_jusqu_a
) ON public.employes TO authenticated;
