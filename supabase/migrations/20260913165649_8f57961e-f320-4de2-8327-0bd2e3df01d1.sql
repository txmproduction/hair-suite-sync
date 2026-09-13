do $$
declare
  v_salon uuid := 'ea1248b0-c12f-4e24-a034-9679976785ac';
  emps uuid[];
  clis uuid[];
  pres record;
  e uuid;
  d date;
  cur int;
  st statut_rdv;
  p record;
  v_rdv uuid;
  v_cli uuid;
  v_debut timestamptz;
  v_now timestamptz := now();
begin
  perform setseed(0.42);
  select array_agg(id) into emps from employes where salon_id = v_salon and actif;
  select array_agg(id) into clis from clients where salon_id = v_salon and nom not in ('Test','Gggk','Txm barber');

  for d in select generate_series('2026-08-24'::date, '2026-09-27'::date, '1 day')::date loop
    if extract(isodow from d) = 7 then continue; end if;
    foreach e in array emps loop
      cur := 540 + (floor(random()*3)::int * 15);
      while cur < 19*60 - 30 loop
        if random() < 0.25 then
          cur := cur + 15 + floor(random()*3)::int * 15;
          continue;
        end if;
        select id, duree_min, prix into p from prestations
          where salon_id = v_salon and actif and nom <> 'Test'
          order by random() limit 1;
        if cur + p.duree_min > 19*60 then exit; end if;
        v_debut := (d::timestamp + make_interval(mins => cur)) at time zone 'Europe/Paris';
        v_cli := clis[1 + floor(random()*array_length(clis,1))::int];
        if v_debut < v_now then
          st := case when random() < 0.87 then 'venu'::statut_rdv
                     when random() < 0.5 then 'no_show'::statut_rdv
                     else 'annule'::statut_rdv end;
        else
          st := 'a_venir'::statut_rdv;
        end if;
        insert into rdv (salon_id, client_id, employe_id, prestation_id, debut, duree_min, statut, acompte, origine)
        values (v_salon, v_cli, e, p.id, v_debut, p.duree_min, st, 0,
                case when random() < 0.4 then 'en_ligne' else 'manuel' end)
        returning id into v_rdv;
        if st = 'venu' then
          insert into encaissements (salon_id, employe_id, client_id, rdv_id, montant, moyen, lignes, created_at)
          values (v_salon, e, v_cli, v_rdv, p.prix,
                  (case when random() < 0.7 then 'cb' when random() < 0.8 then 'especes' else 'cheque' end)::moyen_paiement,
                  jsonb_build_array(jsonb_build_object('prestation_id', p.id, 'prix', p.prix)),
                  v_debut + make_interval(mins => p.duree_min));
        end if;
        cur := cur + p.duree_min + floor(random()*3)::int * 15;
      end loop;
    end loop;
  end loop;
end $$;