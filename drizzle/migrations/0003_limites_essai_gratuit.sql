-- Accès complet = abonnement actif et compte non suspendu.
CREATE OR REPLACE FUNCTION securite.acces_complet(p_salon uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, securite
AS $$
  SELECT COALESCE(
    (SELECT s.abonnement_actif AND NOT s.compte_suspendu FROM public.salons s WHERE s.id = p_salon),
    false
  )
$$;

REVOKE ALL ON FUNCTION securite.acces_complet(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION securite.acces_complet(uuid) TO authenticated, anon, service_role;

-- Limite de collaborateurs actifs pendant l'essai gratuit.
CREATE OR REPLACE FUNCTION securite.limite_employes_essai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, securite
AS $$
DECLARE
  v_actifs integer;
BEGIN
  IF NOT NEW.actif THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.actif THEN
    RETURN NEW;
  END IF;
  IF securite.acces_complet(NEW.salon_id) THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO v_actifs
  FROM public.employes e
  WHERE e.salon_id = NEW.salon_id AND e.actif AND e.id <> NEW.id;
  IF v_actifs >= 2 THEN
    RAISE EXCEPTION 'HT_LIMITE_EMPLOYES';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_limite_employes_essai ON public.employes;
CREATE TRIGGER trg_limite_employes_essai
  BEFORE INSERT OR UPDATE OF actif ON public.employes
  FOR EACH ROW EXECUTE FUNCTION securite.limite_employes_essai();

-- Quota mensuel de rendez-vous pendant l'essai gratuit.
CREATE OR REPLACE FUNCTION securite.limite_rdv_essai()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, securite
AS $$
DECLARE
  v_nb integer;
BEGIN
  IF securite.acces_complet(NEW.salon_id) THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO v_nb
  FROM public.rdv r
  WHERE r.salon_id = NEW.salon_id
    AND r.statut <> 'annule'
    AND r.debut >= date_trunc('month', now())
    AND r.debut < date_trunc('month', now()) + interval '1 month';
  IF v_nb >= 60 THEN
    RAISE EXCEPTION 'HT_LIMITE_RDV';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_limite_rdv_essai ON public.rdv;
CREATE TRIGGER trg_limite_rdv_essai
  BEFORE INSERT ON public.rdv
  FOR EACH ROW EXECUTE FUNCTION securite.limite_rdv_essai();

-- Acompte en ligne réservé à l'abonnement complet.
CREATE OR REPLACE FUNCTION securite.acompte_abonnement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, securite
AS $$
BEGIN
  IF NEW.acompte_actif AND NOT securite.acces_complet(NEW.salon_id) THEN
    RAISE EXCEPTION 'HT_ACOMPTE_ABONNEMENT';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_acompte_abonnement ON public.parametres_salon;
CREATE TRIGGER trg_acompte_abonnement
  BEFORE INSERT OR UPDATE ON public.parametres_salon
  FOR EACH ROW EXECUTE FUNCTION securite.acompte_abonnement();