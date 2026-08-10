DO $$
DECLARE
  v_nom_salon text := 'Txm barber';

  v_salon uuid;
  v_emp1 uuid; v_emp2 uuid; v_emp3 uuid;
  v_cat_coiffure uuid; v_cat_barbe uuid; v_cat_ongles uuid;
  v_p_coupe_f uuid; v_p_couleur uuid; v_p_brushing uuid; v_p_balayage uuid;
  v_p_coupe_h uuid; v_p_coupe_barbe uuid; v_p_barbe uuid; v_p_degrade uuid;
  v_p_manucure uuid; v_p_semi uuid; v_p_gel uuid;
  v_c1 uuid; v_c2 uuid; v_c3 uuid; v_c4 uuid; v_c5 uuid; v_c6 uuid; v_c7 uuid;
  v_c8 uuid; v_c9 uuid; v_c10 uuid; v_c11 uuid; v_c12 uuid; v_c13 uuid; v_c14 uuid;
  v_rdv uuid;
  v_j date := current_date;

  v_clients uuid[];
  v_presta_sarah uuid[];
  v_presta_karim uuid[];
  v_presta_lea uuid[];
  v_d int;
  v_date date;
  v_p uuid;
  v_prix numeric(10,2);
  v_duree int;
  v_cli uuid;
  v_moyen public.moyen_paiement;
  v_emp uuid;
  v_slot int;
  v_f int;
  v_acompte numeric(10,2);

  v_photo_sarah text := 'https://res.cloudinary.com/dgfdye7cl/image/upload/v1786376860/pexels-cottonbro-3993310_itid15.jpg';
  v_photo_karim text := 'https://res.cloudinary.com/dgfdye7cl/image/upload/v1786376682/pexels-th2city-2076930_g81w8t.jpg';
  v_photo_lea   text := 'https://res.cloudinary.com/dgfdye7cl/image/upload/v1786376759/pexels-kampus-8834018_byyj9e.jpg';
BEGIN
  SELECT id INTO v_salon FROM public.salons WHERE nom ILIKE v_nom_salon LIMIT 1;
  IF v_salon IS NULL THEN
    RAISE EXCEPTION 'Salon "%" introuvable. Vérifie le nom exact dans HairTrack.', v_nom_salon;
  END IF;

  DELETE FROM public.encaissements
   WHERE salon_id = v_salon
     AND rdv_id IN (SELECT id FROM public.rdv WHERE salon_id = v_salon AND notes = 'DEMO');
  DELETE FROM public.rdv WHERE salon_id = v_salon AND notes = 'DEMO';
  DELETE FROM public.clients WHERE salon_id = v_salon AND notes = 'DEMO';

  SELECT id INTO v_emp1 FROM public.employes WHERE salon_id = v_salon AND nom ILIKE 'Sarah' LIMIT 1;
  IF v_emp1 IS NULL THEN
    INSERT INTO public.employes (salon_id, nom, role, couleur, ordre, photo_url, actif)
    VALUES (v_salon, 'Sarah', 'employe', '#C9A227', 1, v_photo_sarah, true) RETURNING id INTO v_emp1;
  ELSE
    UPDATE public.employes SET photo_url = v_photo_sarah, couleur = '#C9A227', actif = true WHERE id = v_emp1;
  END IF;

  SELECT id INTO v_emp2 FROM public.employes WHERE salon_id = v_salon AND nom ILIKE 'Karim' LIMIT 1;
  IF v_emp2 IS NULL THEN
    INSERT INTO public.employes (salon_id, nom, role, couleur, ordre, photo_url, actif)
    VALUES (v_salon, 'Karim', 'employe', '#8B6F3A', 2, v_photo_karim, true) RETURNING id INTO v_emp2;
  ELSE
    UPDATE public.employes SET photo_url = v_photo_karim, couleur = '#8B6F3A', actif = true WHERE id = v_emp2;
  END IF;

  SELECT id INTO v_emp3 FROM public.employes WHERE salon_id = v_salon AND nom ILIKE 'Léa' LIMIT 1;
  IF v_emp3 IS NULL THEN
    SELECT id INTO v_emp3 FROM public.employes WHERE salon_id = v_salon AND nom ILIKE 'Lea' LIMIT 1;
  END IF;
  IF v_emp3 IS NULL THEN
    INSERT INTO public.employes (salon_id, nom, role, couleur, ordre, photo_url, actif)
    VALUES (v_salon, 'Léa', 'employe', '#D8B96A', 3, v_photo_lea, true) RETURNING id INTO v_emp3;
  ELSE
    UPDATE public.employes SET photo_url = v_photo_lea, couleur = '#D8B96A', actif = true WHERE id = v_emp3;
  END IF;

  SELECT id INTO v_cat_coiffure FROM public.categories WHERE salon_id = v_salon AND nom ILIKE 'Coiffure' LIMIT 1;
  IF v_cat_coiffure IS NULL THEN
    INSERT INTO public.categories (salon_id, nom, ordre) VALUES (v_salon, 'Coiffure', 1) RETURNING id INTO v_cat_coiffure;
  END IF;
  SELECT id INTO v_cat_barbe FROM public.categories WHERE salon_id = v_salon AND nom ILIKE 'Barbe' LIMIT 1;
  IF v_cat_barbe IS NULL THEN
    INSERT INTO public.categories (salon_id, nom, ordre) VALUES (v_salon, 'Barbe', 2) RETURNING id INTO v_cat_barbe;
  END IF;
  SELECT id INTO v_cat_ongles FROM public.categories WHERE salon_id = v_salon AND nom ILIKE 'Ongles' LIMIT 1;
  IF v_cat_ongles IS NULL THEN
    INSERT INTO public.categories (salon_id, nom, ordre) VALUES (v_salon, 'Ongles', 3) RETURNING id INTO v_cat_ongles;
  END IF;

  SELECT id INTO v_p_coupe_f FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Coupe femme' LIMIT 1;
  IF v_p_coupe_f IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_coiffure, 'Coupe femme', 45, 39.00, 1) RETURNING id INTO v_p_coupe_f; END IF;

  SELECT id INTO v_p_couleur FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Coloration' LIMIT 1;
  IF v_p_couleur IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_coiffure, 'Coloration', 90, 69.00, 2) RETURNING id INTO v_p_couleur; END IF;

  SELECT id INTO v_p_brushing FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Brushing' LIMIT 1;
  IF v_p_brushing IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_coiffure, 'Brushing', 30, 25.00, 3) RETURNING id INTO v_p_brushing; END IF;

  SELECT id INTO v_p_balayage FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Balayage' LIMIT 1;
  IF v_p_balayage IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_coiffure, 'Balayage', 120, 95.00, 4) RETURNING id INTO v_p_balayage; END IF;

  SELECT id INTO v_p_coupe_h FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Coupe homme' LIMIT 1;
  IF v_p_coupe_h IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_barbe, 'Coupe homme', 30, 24.00, 1) RETURNING id INTO v_p_coupe_h; END IF;

  SELECT id INTO v_p_coupe_barbe FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Coupe + barbe' LIMIT 1;
  IF v_p_coupe_barbe IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_barbe, 'Coupe + barbe', 45, 35.00, 2) RETURNING id INTO v_p_coupe_barbe; END IF;

  SELECT id INTO v_p_barbe FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Taille de barbe' LIMIT 1;
  IF v_p_barbe IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_barbe, 'Taille de barbe', 20, 18.00, 3) RETURNING id INTO v_p_barbe; END IF;

  SELECT id INTO v_p_degrade FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Dégradé' LIMIT 1;
  IF v_p_degrade IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_barbe, 'Dégradé', 40, 28.00, 4) RETURNING id INTO v_p_degrade; END IF;

  SELECT id INTO v_p_manucure FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Manucure' LIMIT 1;
  IF v_p_manucure IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_ongles, 'Manucure', 45, 32.00, 1) RETURNING id INTO v_p_manucure; END IF;

  SELECT id INTO v_p_semi FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Vernis semi-permanent' LIMIT 1;
  IF v_p_semi IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_ongles, 'Vernis semi-permanent', 60, 45.00, 2) RETURNING id INTO v_p_semi; END IF;

  SELECT id INTO v_p_gel FROM public.prestations WHERE salon_id = v_salon AND nom ILIKE 'Pose gel' LIMIT 1;
  IF v_p_gel IS NULL THEN INSERT INTO public.prestations (salon_id, categorie_id, nom, duree_min, prix, ordre)
    VALUES (v_salon, v_cat_ongles, 'Pose gel', 90, 65.00, 3) RETURNING id INTO v_p_gel; END IF;

  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Camille Renaud',  '06 12 34 56 78', 'DEMO') RETURNING id INTO v_c1;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Julie Marchand',  '06 23 45 67 89', 'DEMO') RETURNING id INTO v_c2;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Émilie Fontaine', '06 34 56 78 90', 'DEMO') RETURNING id INTO v_c3;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Laura Bertrand',  '06 45 67 89 01', 'DEMO') RETURNING id INTO v_c4;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Thomas Girard',   '06 56 78 90 12', 'DEMO') RETURNING id INTO v_c5;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Maxime Leroy',    '06 67 89 01 23', 'DEMO') RETURNING id INTO v_c6;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Antoine Mercier', '06 78 90 12 34', 'DEMO') RETURNING id INTO v_c7;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Nicolas Dubois',  '06 89 01 23 45', 'DEMO') RETURNING id INTO v_c8;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Sofia Benali',    '06 90 12 34 56', 'DEMO') RETURNING id INTO v_c9;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Chloé Perrin',    '07 01 23 45 67', 'DEMO') RETURNING id INTO v_c10;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Inès Moreau',     '07 12 34 56 78', 'DEMO') RETURNING id INTO v_c11;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Manon Lefèvre',   '07 23 45 67 89', 'DEMO') RETURNING id INTO v_c12;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Hugo Renard',     '07 34 56 78 90', 'DEMO') RETURNING id INTO v_c13;
  INSERT INTO public.clients (salon_id, nom, telephone, notes) VALUES (v_salon, 'Yasmine Attia',   '07 45 67 89 01', 'DEMO') RETURNING id INTO v_c14;

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c1, v_emp1, v_p_coupe_f, (v_j + time '09:00') AT TIME ZONE 'Europe/Paris', 45, 'venu', 0, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp1, v_rdv, v_c1, 39.00, 'cb');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c2, v_emp1, v_p_couleur, (v_j + time '10:00') AT TIME ZONE 'Europe/Paris', 90, 'venu', 15.00, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp1, v_rdv, v_c2, 54.00, 'cb');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c3, v_emp1, v_p_brushing, (v_j + time '11:45') AT TIME ZONE 'Europe/Paris', 30, 'venu', 0, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp1, v_rdv, v_c3, 25.00, 'especes');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c4, v_emp1, v_p_balayage, (v_j + time '14:00') AT TIME ZONE 'Europe/Paris', 120, 'a_venir', 20.00, 'DEMO');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c10, v_emp1, v_p_coupe_f, (v_j + time '16:15') AT TIME ZONE 'Europe/Paris', 45, 'a_venir', 0, 'DEMO');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c5, v_emp2, v_p_coupe_h, (v_j + time '09:15') AT TIME ZONE 'Europe/Paris', 30, 'venu', 0, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp2, v_rdv, v_c5, 24.00, 'cb');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c6, v_emp2, v_p_coupe_barbe, (v_j + time '10:00') AT TIME ZONE 'Europe/Paris', 45, 'venu', 10.00, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp2, v_rdv, v_c6, 25.00, 'cb');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c7, v_emp2, v_p_barbe, (v_j + time '11:00') AT TIME ZONE 'Europe/Paris', 20, 'venu', 0, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp2, v_rdv, v_c7, 18.00, 'especes');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c8, v_emp2, v_p_coupe_h, (v_j + time '14:00') AT TIME ZONE 'Europe/Paris', 30, 'a_venir', 0, 'DEMO');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c13, v_emp2, v_p_degrade, (v_j + time '15:00') AT TIME ZONE 'Europe/Paris', 40, 'a_venir', 8.00, 'DEMO');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c12, v_emp2, v_p_coupe_barbe, (v_j + time '16:30') AT TIME ZONE 'Europe/Paris', 45, 'a_venir', 10.00, 'DEMO');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c9, v_emp3, v_p_manucure, (v_j + time '09:30') AT TIME ZONE 'Europe/Paris', 45, 'venu', 0, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp3, v_rdv, v_c9, 32.00, 'cb');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c10, v_emp3, v_p_semi, (v_j + time '10:30') AT TIME ZONE 'Europe/Paris', 60, 'venu', 12.00, 'DEMO') RETURNING id INTO v_rdv;
  INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen) VALUES (v_salon, v_emp3, v_rdv, v_c10, 33.00, 'cb');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c11, v_emp3, v_p_gel, (v_j + time '14:00') AT TIME ZONE 'Europe/Paris', 90, 'a_venir', 15.00, 'DEMO');

  INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
  VALUES (v_salon, v_c14, v_emp3, v_p_manucure, (v_j + time '16:00') AT TIME ZONE 'Europe/Paris', 45, 'a_venir', 0, 'DEMO');

  v_clients := ARRAY[v_c1, v_c2, v_c3, v_c4, v_c5, v_c6, v_c7, v_c8, v_c9, v_c10, v_c11, v_c12, v_c13, v_c14];
  v_presta_sarah := ARRAY[v_p_coupe_f, v_p_couleur, v_p_brushing, v_p_balayage];
  v_presta_karim := ARRAY[v_p_coupe_h, v_p_coupe_barbe, v_p_barbe, v_p_degrade];
  v_presta_lea   := ARRAY[v_p_manucure, v_p_semi, v_p_gel];

  FOR v_d IN 1..60 LOOP
    v_date := v_j - v_d;
    CONTINUE WHEN extract(dow from v_date) = 0;

    v_moyen := (ARRAY['cb','cb','cb','especes']::public.moyen_paiement[])[1 + (v_d % 4)];

    FOR v_slot IN 1..3 LOOP
      IF v_slot = 1 THEN
        v_emp := v_emp1;
        v_p := v_presta_sarah[1 + ((v_d + v_slot) % 4)];
      ELSIF v_slot = 2 THEN
        v_emp := v_emp2;
        v_p := v_presta_karim[1 + ((v_d + v_slot) % 4)];
      ELSE
        v_emp := v_emp3;
        v_p := v_presta_lea[1 + ((v_d + v_slot) % 3)];
      END IF;

      SELECT prix, duree_min INTO v_prix, v_duree FROM public.prestations WHERE id = v_p;
      v_cli := v_clients[1 + ((v_d * 3 + v_slot) % 14)];

      INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
      VALUES (
        v_salon, v_cli, v_emp, v_p,
        (v_date + (time '10:00' + ((v_slot - 1) * interval '3 hours'))) AT TIME ZONE 'Europe/Paris',
        v_duree, 'venu', 0, 'DEMO'
      )
      RETURNING id INTO v_rdv;

      INSERT INTO public.encaissements (salon_id, employe_id, rdv_id, client_id, montant, moyen)
      VALUES (v_salon, v_emp, v_rdv, v_cli, v_prix, v_moyen);
    END LOOP;
  END LOOP;

  FOR v_f IN 1..13 LOOP
    v_date := v_j + v_f;
    CONTINUE WHEN extract(dow from v_date) = 0;

    FOR v_slot IN 1..3 LOOP
      IF v_slot = 1 THEN
        v_emp := v_emp1;
        v_p := v_presta_sarah[1 + ((v_f + v_slot) % 4)];
      ELSIF v_slot = 2 THEN
        v_emp := v_emp2;
        v_p := v_presta_karim[1 + ((v_f + v_slot) % 4)];
      ELSE
        v_emp := v_emp3;
        v_p := v_presta_lea[1 + ((v_f + v_slot) % 3)];
      END IF;

      SELECT prix, duree_min INTO v_prix, v_duree FROM public.prestations WHERE id = v_p;
      v_cli := v_clients[1 + ((v_f * 5 + v_slot) % 14)];
      v_acompte := CASE WHEN (v_f + v_slot) % 2 = 0 THEN round(v_prix * 0.2, 2) ELSE 0 END;

      INSERT INTO public.rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, notes)
      VALUES (
        v_salon, v_cli, v_emp, v_p,
        (v_date + (time '09:30' + ((v_slot - 1) * interval '3 hours'))) AT TIME ZONE 'Europe/Paris',
        v_duree, 'a_venir', v_acompte, 'DEMO'
      );
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Agenda de démonstration créé pour %', v_nom_salon;
END $$;