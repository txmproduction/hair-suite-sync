
REVOKE EXECUTE ON FUNCTION public.current_salon_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_gerant() FROM anon;
REVOKE EXECUTE ON FUNCTION public.mon_employe_id() FROM anon;

-- horaires_salon
CREATE POLICY "horaires salon lecture" ON public.horaires_salon FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id() OR salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
CREATE POLICY "horaires salon ecriture gerant" ON public.horaires_salon FOR ALL TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));

-- horaires_employe
CREATE POLICY "horaires employe lecture" ON public.horaires_employe FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id() OR salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
CREATE POLICY "horaires employe ecriture gerant" ON public.horaires_employe FOR ALL TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));

-- categories
CREATE POLICY "categories lecture" ON public.categories FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id());
CREATE POLICY "categories ecriture gerant" ON public.categories FOR ALL TO authenticated
  USING (salon_id = public.current_salon_id() AND public.is_gerant())
  WITH CHECK (salon_id = public.current_salon_id() AND public.is_gerant());

-- prestations
CREATE POLICY "prestations lecture" ON public.prestations FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id());
CREATE POLICY "prestations ecriture gerant" ON public.prestations FOR ALL TO authenticated
  USING (salon_id = public.current_salon_id() AND public.is_gerant())
  WITH CHECK (salon_id = public.current_salon_id() AND public.is_gerant());

-- clients
CREATE POLICY "clients lecture" ON public.clients FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id());
CREATE POLICY "clients insert" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (salon_id = public.current_salon_id());
CREATE POLICY "clients update" ON public.clients FOR UPDATE TO authenticated
  USING (salon_id = public.current_salon_id()) WITH CHECK (salon_id = public.current_salon_id());
CREATE POLICY "clients delete gerant" ON public.clients FOR DELETE TO authenticated
  USING (salon_id = public.current_salon_id() AND public.is_gerant());

-- rdv
CREATE POLICY "rdv lecture" ON public.rdv FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id());
CREATE POLICY "rdv insert" ON public.rdv FOR INSERT TO authenticated
  WITH CHECK (salon_id = public.current_salon_id());
CREATE POLICY "rdv update" ON public.rdv FOR UPDATE TO authenticated
  USING (salon_id = public.current_salon_id()) WITH CHECK (salon_id = public.current_salon_id());
CREATE POLICY "rdv delete gerant" ON public.rdv FOR DELETE TO authenticated
  USING (salon_id = public.current_salon_id() AND public.is_gerant());

-- encaissements
CREATE POLICY "encaissements lecture" ON public.encaissements FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id() AND (public.is_gerant() OR employe_id = public.mon_employe_id()
    OR (SELECT voit_ca_global FROM public.employes WHERE id = public.mon_employe_id())));
CREATE POLICY "encaissements insert" ON public.encaissements FOR INSERT TO authenticated
  WITH CHECK (salon_id = public.current_salon_id());
CREATE POLICY "encaissements update gerant" ON public.encaissements FOR UPDATE TO authenticated
  USING (salon_id = public.current_salon_id() AND public.is_gerant())
  WITH CHECK (salon_id = public.current_salon_id() AND public.is_gerant());
CREATE POLICY "encaissements delete gerant" ON public.encaissements FOR DELETE TO authenticated
  USING (salon_id = public.current_salon_id() AND public.is_gerant());

-- parametres_salon
CREATE POLICY "parametres lecture" ON public.parametres_salon FOR SELECT TO authenticated
  USING (salon_id = public.current_salon_id() OR salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
CREATE POLICY "parametres ecriture gerant" ON public.parametres_salon FOR ALL TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
