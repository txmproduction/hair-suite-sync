export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          nom: string
          ordre: number
          salon_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom: string
          ordre?: number
          salon_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom?: string
          ordre?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          nom: string
          notes: string | null
          salon_id: string
          telephone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          salon_id: string
          telephone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          salon_id?: string
          telephone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      employes: {
        Row: {
          actif: boolean
          couleur: string
          created_at: string
          email: string | null
          id: string
          nom: string
          ordre: number
          photo_url: string | null
          role: Database["public"]["Enums"]["role_employe"]
          salon_id: string
          telephone: string | null
          user_id: string | null
          voit_ca_global: boolean
        }
        Insert: {
          actif?: boolean
          couleur?: string
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          ordre?: number
          photo_url?: string | null
          role?: Database["public"]["Enums"]["role_employe"]
          salon_id: string
          telephone?: string | null
          user_id?: string | null
          voit_ca_global?: boolean
        }
        Update: {
          actif?: boolean
          couleur?: string
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          ordre?: number
          photo_url?: string | null
          role?: Database["public"]["Enums"]["role_employe"]
          salon_id?: string
          telephone?: string | null
          user_id?: string | null
          voit_ca_global?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "employes_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      encaissements: {
        Row: {
          client_id: string | null
          created_at: string
          employe_id: string | null
          id: string
          lignes: Json
          montant: number
          moyen: Database["public"]["Enums"]["moyen_paiement"]
          rdv_id: string | null
          salon_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          employe_id?: string | null
          id?: string
          lignes?: Json
          montant: number
          moyen: Database["public"]["Enums"]["moyen_paiement"]
          rdv_id?: string | null
          salon_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          employe_id?: string | null
          id?: string
          lignes?: Json
          montant?: number
          moyen?: Database["public"]["Enums"]["moyen_paiement"]
          rdv_id?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "encaissements_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_rdv_id_fkey"
            columns: ["rdv_id"]
            isOneToOne: false
            referencedRelation: "rdv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "encaissements_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      horaires_employe: {
        Row: {
          debut: string
          employe_id: string
          fin: string
          id: string
          jour: number
          salon_id: string
          travaille: boolean
        }
        Insert: {
          debut?: string
          employe_id: string
          fin?: string
          id?: string
          jour: number
          salon_id: string
          travaille?: boolean
        }
        Update: {
          debut?: string
          employe_id?: string
          fin?: string
          id?: string
          jour?: number
          salon_id?: string
          travaille?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "horaires_employe_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horaires_employe_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      horaires_salon: {
        Row: {
          ferme: boolean
          fermeture: string
          id: string
          jour: number
          ouverture: string
          salon_id: string
        }
        Insert: {
          ferme?: boolean
          fermeture?: string
          id?: string
          jour: number
          ouverture?: string
          salon_id: string
        }
        Update: {
          ferme?: boolean
          fermeture?: string
          id?: string
          jour?: number
          ouverture?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horaires_salon_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      parametres_salon: {
        Row: {
          acompte_type: Database["public"]["Enums"]["type_acompte"]
          acompte_valeur: number
          delai_annulation_h: number
          salon_id: string
        }
        Insert: {
          acompte_type?: Database["public"]["Enums"]["type_acompte"]
          acompte_valeur?: number
          delai_annulation_h?: number
          salon_id: string
        }
        Update: {
          acompte_type?: Database["public"]["Enums"]["type_acompte"]
          acompte_valeur?: number
          delai_annulation_h?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parametres_salon_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      prestations: {
        Row: {
          actif: boolean
          categorie_id: string | null
          couleur: string
          created_at: string
          duree_min: number
          id: string
          nom: string
          ordre: number
          prix: number
          salon_id: string
        }
        Insert: {
          actif?: boolean
          categorie_id?: string | null
          couleur?: string
          created_at?: string
          duree_min?: number
          id?: string
          nom: string
          ordre?: number
          prix?: number
          salon_id: string
        }
        Update: {
          actif?: boolean
          categorie_id?: string | null
          couleur?: string
          created_at?: string
          duree_min?: number
          id?: string
          nom?: string
          ordre?: number
          prix?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestations_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prestations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      rdv: {
        Row: {
          acompte: number
          client_id: string | null
          created_at: string
          debut: string
          duree_min: number
          employe_id: string
          id: string
          notes: string | null
          prestation_id: string | null
          salon_id: string
          statut: Database["public"]["Enums"]["statut_rdv"]
        }
        Insert: {
          acompte?: number
          client_id?: string | null
          created_at?: string
          debut: string
          duree_min?: number
          employe_id: string
          id?: string
          notes?: string | null
          prestation_id?: string | null
          salon_id: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
        }
        Update: {
          acompte?: number
          client_id?: string | null
          created_at?: string
          debut?: string
          duree_min?: number
          employe_id?: string
          id?: string
          notes?: string | null
          prestation_id?: string | null
          salon_id?: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
        }
        Relationships: [
          {
            foreignKeyName: "rdv_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdv_employe_id_fkey"
            columns: ["employe_id"]
            isOneToOne: false
            referencedRelation: "employes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdv_prestation_id_fkey"
            columns: ["prestation_id"]
            isOneToOne: false
            referencedRelation: "prestations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rdv_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          adresse: string | null
          created_at: string
          gerant_user_id: string
          id: string
          nom: string
          telephone: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          gerant_user_id: string
          id?: string
          nom: string
          telephone?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string
          gerant_user_id?: string
          id?: string
          nom?: string
          telephone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_salon_id: { Args: never; Returns: string }
      is_gerant: { Args: never; Returns: boolean }
      mon_employe_id: { Args: never; Returns: string }
      reclamer_invitation: { Args: never; Returns: string }
    }
    Enums: {
      moyen_paiement: "cb" | "especes" | "cheque" | "autre"
      role_employe: "gerant" | "employe"
      statut_rdv:
        | "a_venir"
        | "venu"
        | "no_show"
        | "annule"
        | "en_attente_paiement"
      type_acompte: "montant" | "pourcentage"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      moyen_paiement: ["cb", "especes", "cheque", "autre"],
      role_employe: ["gerant", "employe"],
      statut_rdv: [
        "a_venir",
        "venu",
        "no_show",
        "annule",
        "en_attente_paiement",
      ],
      type_acompte: ["montant", "pourcentage"],
    },
  },
} as const
