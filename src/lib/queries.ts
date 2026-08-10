import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useEmployes(salonId?: string, tous = false) {
  return useQuery({
    queryKey: ["employes", salonId, tous],
    enabled: !!salonId,
    queryFn: async () => {
      let q = supabase.from("employes").select("*").eq("salon_id", salonId!);
      if (!tous) q = q.eq("actif", true);
      const { data, error } = await q.order("ordre").order("nom");
      if (error) throw error;
      return data;
    },
  });
}

export function useCategories(salonId?: string) {
  return useQuery({
    queryKey: ["categories", salonId],
    enabled: !!salonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("salon_id", salonId!)
        .order("ordre");
      if (error) throw error;
      return data;
    },
  });
}

export function usePrestations(salonId?: string, toutes = false) {
  return useQuery({
    queryKey: ["prestations", salonId, toutes],
    enabled: !!salonId,
    queryFn: async () => {
      let q = supabase.from("prestations").select("*").eq("salon_id", salonId!);
      if (!toutes) q = q.eq("actif", true);
      const { data, error } = await q.order("ordre").order("nom");
      if (error) throw error;
      return data;
    },
  });
}

export function useClients(salonId?: string) {
  return useQuery({
    queryKey: ["clients", salonId],
    enabled: !!salonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("salon_id", salonId!)
        .order("nom");
      if (error) throw error;
      return data;
    },
  });
}

export function useHorairesSalon(salonId?: string) {
  return useQuery({
    queryKey: ["horaires_salon", salonId],
    enabled: !!salonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("horaires_salon")
        .select("*")
        .eq("salon_id", salonId!)
        .order("jour");
      if (error) throw error;
      return data;
    },
  });
}

export function useRdv(salonId: string | undefined, debut: Date, fin: Date) {
  return useQuery({
    queryKey: ["rdv", salonId, debut.toISOString(), fin.toISOString()],
    enabled: !!salonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rdv")
        .select("*, clients(nom, telephone), prestations(nom, couleur, prix, duree_min)")
        .eq("salon_id", salonId!)
        .gte("debut", debut.toISOString())
        .lt("debut", fin.toISOString())
        .order("debut");
      if (error) throw error;
      return data;
    },
  });
}

export function useEncaissements(salonId: string | undefined, debut: Date, fin: Date) {
  return useQuery({
    queryKey: ["encaissements", salonId, debut.toISOString(), fin.toISOString()],
    enabled: !!salonId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encaissements")
        .select("*, employes(nom), clients(nom)")
        .eq("salon_id", salonId!)
        .gte("created_at", debut.toISOString())
        .lt("created_at", fin.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
