
-- ENUMS
CREATE TYPE public.role_employe AS ENUM ('gerant','employe');
CREATE TYPE public.statut_rdv AS ENUM ('a_venir','venu','no_show','annule');
CREATE TYPE public.moyen_paiement AS ENUM ('cb','especes','cheque','autre');
CREATE TYPE public.type_acompte AS ENUM ('montant','pourcentage');

-- SALONS
CREATE TABLE public.salons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  adresse text,
  telephone text,
  gerant_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.employes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id uuid,
  nom text NOT NULL,
  email text,
  telephone text,
  photo_url text,
  role public.role_employe NOT NULL DEFAULT 'employe',
  actif boolean NOT NULL DEFAULT true,
  voit_ca_global boolean NOT NULL DEFAULT false,
  couleur text NOT NULL DEFAULT '#C9A227',
  ordre int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX employes_user_id_idx ON public.employes(user_id);

CREATE TABLE public.horaires_salon (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  jour int NOT NULL CHECK (jour BETWEEN 0 AND 6),
  ferme boolean NOT NULL DEFAULT false,
  ouverture time NOT NULL DEFAULT '09:00',
  fermeture time NOT NULL DEFAULT '19:00',
  UNIQUE (salon_id, jour)
);

CREATE TABLE public.horaires_employe (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  employe_id uuid NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  jour int NOT NULL CHECK (jour BETWEEN 0 AND 6),
  travaille boolean NOT NULL DEFAULT true,
  debut time NOT NULL DEFAULT '09:00',
  fin time NOT NULL DEFAULT '19:00',
  UNIQUE (employe_id, jour)
);

CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  nom text NOT NULL,
  ordre int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.prestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  categorie_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  nom text NOT NULL,
  duree_min int NOT NULL DEFAULT 30 CHECK (duree_min > 0 AND duree_min % 5 = 0),
  prix numeric(10,2) NOT NULL DEFAULT 0,
  couleur text NOT NULL DEFAULT '#C9A227',
  ordre int NOT NULL DEFAULT 0,
  actif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  nom text NOT NULL,
  telephone text,
  email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX clients_salon_idx ON public.clients(salon_id);

CREATE TABLE public.rdv (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  employe_id uuid NOT NULL REFERENCES public.employes(id) ON DELETE CASCADE,
  prestation_id uuid REFERENCES public.prestations(id) ON DELETE SET NULL,
  debut timestamptz NOT NULL,
  duree_min int NOT NULL DEFAULT 30,
  statut public.statut_rdv NOT NULL DEFAULT 'a_venir',
  acompte numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rdv_salon_debut_idx ON public.rdv(salon_id, debut);

CREATE TABLE public.encaissements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id uuid NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
  employe_id uuid REFERENCES public.employes(id) ON DELETE SET NULL,
  rdv_id uuid REFERENCES public.rdv(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  montant numeric(10,2) NOT NULL,
  moyen public.moyen_paiement NOT NULL,
  lignes jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX encaissements_salon_date_idx ON public.encaissements(salon_id, created_at);

CREATE TABLE public.parametres_salon (
  salon_id uuid PRIMARY KEY REFERENCES public.salons(id) ON DELETE CASCADE,
  acompte_type public.type_acompte NOT NULL DEFAULT 'pourcentage',
  acompte_valeur numeric(10,2) NOT NULL DEFAULT 0,
  delai_annulation_h int NOT NULL DEFAULT 24
);

-- HELPERS
CREATE OR REPLACE FUNCTION public.current_salon_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT salon_id FROM public.employes WHERE user_id = auth.uid() AND actif LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_gerant()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employes
    WHERE user_id = auth.uid() AND actif AND role = 'gerant'
  );
$$;

CREATE OR REPLACE FUNCTION public.mon_employe_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.employes WHERE user_id = auth.uid() AND actif LIMIT 1;
$$;

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salons, public.employes, public.horaires_salon,
  public.horaires_employe, public.categories, public.prestations, public.clients, public.rdv,
  public.encaissements, public.parametres_salon TO authenticated;
GRANT ALL ON public.salons, public.employes, public.horaires_salon, public.horaires_employe,
  public.categories, public.prestations, public.clients, public.rdv, public.encaissements,
  public.parametres_salon TO service_role;

-- RLS
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horaires_salon ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.horaires_employe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prestations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdv ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encaissements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parametres_salon ENABLE ROW LEVEL SECURITY;

-- salons
CREATE POLICY "salon lisible par ses membres" ON public.salons FOR SELECT TO authenticated
  USING (id = public.current_salon_id() OR gerant_user_id = auth.uid());
CREATE POLICY "creation salon par soi" ON public.salons FOR INSERT TO authenticated
  WITH CHECK (gerant_user_id = auth.uid());
CREATE POLICY "maj salon par gerant" ON public.salons FOR UPDATE TO authenticated
  USING (gerant_user_id = auth.uid()) WITH CHECK (gerant_user_id = auth.uid());
CREATE POLICY "suppression salon par gerant" ON public.salons FOR DELETE TO authenticated
  USING (gerant_user_id = auth.uid());

-- employes
CREATE POLICY "employes du salon lisibles" ON public.employes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR salon_id = public.current_salon_id()
    OR salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
CREATE POLICY "ajout employe par gerant" ON public.employes FOR INSERT TO authenticated
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
CREATE POLICY "maj employe par gerant" ON public.employes FOR UPDATE TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()))
  WITH CHECK (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
CREATE POLICY "suppression employe par gerant" ON public.employes FOR DELETE TO authenticated
  USING (salon_id IN (SELECT id FROM public.salons WHERE gerant_user_id = auth.uid()));
