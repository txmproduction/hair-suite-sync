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
      avis: {
        Row: {
          client_nom: string | null
          commentaire: string | null
          created_at: string
          id: string
          note: number
          rdv_id: string | null
          salon_id: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          client_nom?: string | null
          commentaire?: string | null
          created_at?: string
          id?: string
          note: number
          rdv_id?: string | null
          salon_id: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          client_nom?: string | null
          commentaire?: string | null
          created_at?: string
          id?: string
          note?: number
          rdv_id?: string | null
          salon_id?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "avis_rdv_id_fkey"
            columns: ["rdv_id"]
            isOneToOne: true
            referencedRelation: "rdv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avis_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      candidatures_distribution: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string | null
          nom: string
          telephone: string
          ville: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message?: string | null
          nom: string
          telephone: string
          ville: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          nom?: string
          telephone?: string
          ville?: string
        }
        Relationships: []
      }
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
      clics_reservation_manquee: {
        Row: {
          created_at: string
          id: string
          salon_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          salon_id: string
        }
        Update: {
          created_at?: string
          id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clics_reservation_manquee_salon_id_fkey"
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
          moderation_avis: boolean
          salon_id: string
        }
        Insert: {
          acompte_type?: Database["public"]["Enums"]["type_acompte"]
          acompte_valeur?: number
          delai_annulation_h?: number
          moderation_avis?: boolean
          salon_id: string
        }
        Update: {
          acompte_type?: Database["public"]["Enums"]["type_acompte"]
          acompte_valeur?: number
          delai_annulation_h?: number
          moderation_avis?: boolean
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
      photos_salon: {
        Row: {
          created_at: string
          id: string
          ordre: number
          salon_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordre?: number
          salon_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          ordre?: number
          salon_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_salon_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      rdv: {
        Row: {
          acompte: number
          annulation_token: string
          avis_token: string
          client_id: string | null
          created_at: string
          debut: string
          duree_min: number
          employe_id: string
          expire_at: string | null
          fin: string | null
          id: string
          notes: string | null
          origine: string
          paiement_ref: string | null
          prestation_id: string | null
          salon_id: string
          statut: Database["public"]["Enums"]["statut_rdv"]
        }
        Insert: {
          acompte?: number
          annulation_token?: string
          avis_token?: string
          client_id?: string | null
          created_at?: string
          debut: string
          duree_min?: number
          employe_id: string
          expire_at?: string | null
          fin?: string | null
          id?: string
          notes?: string | null
          origine?: string
          paiement_ref?: string | null
          prestation_id?: string | null
          salon_id: string
          statut?: Database["public"]["Enums"]["statut_rdv"]
        }
        Update: {
          acompte?: number
          annulation_token?: string
          avis_token?: string
          client_id?: string | null
          created_at?: string
          debut?: string
          duree_min?: number
          employe_id?: string
          expire_at?: string | null
          fin?: string | null
          id?: string
          notes?: string | null
          origine?: string
          paiement_ref?: string | null
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
          abonnement_actif: boolean
          adresse: string | null
          categorie: Database["public"]["Enums"]["categorie_salon"]
          code_postal: string | null
          compte_suspendu: boolean
          created_at: string
          description: string | null
          gerant_user_id: string | null
          id: string
          latitude: number | null
          lien_externe: string | null
          longitude: number | null
          nb_avis: number
          nb_avis_google: number | null
          nom: string
          note_google: number | null
          note_moyenne: number | null
          photo_couverture_url: string | null
          reservation_en_ligne: boolean
          slug: string | null
          source: string | null
          statut: Database["public"]["Enums"]["statut_salon"]
          telephone: string | null
          trial_ends_at: string
          trial_started_at: string
          ville: string | null
        }
        Insert: {
          abonnement_actif?: boolean
          adresse?: string | null
          categorie?: Database["public"]["Enums"]["categorie_salon"]
          code_postal?: string | null
          compte_suspendu?: boolean
          created_at?: string
          description?: string | null
          gerant_user_id?: string | null
          id?: string
          latitude?: number | null
          lien_externe?: string | null
          longitude?: number | null
          nb_avis?: number
          nb_avis_google?: number | null
          nom: string
          note_google?: number | null
          note_moyenne?: number | null
          photo_couverture_url?: string | null
          reservation_en_ligne?: boolean
          slug?: string | null
          source?: string | null
          statut?: Database["public"]["Enums"]["statut_salon"]
          telephone?: string | null
          trial_ends_at?: string
          trial_started_at?: string
          ville?: string | null
        }
        Update: {
          abonnement_actif?: boolean
          adresse?: string | null
          categorie?: Database["public"]["Enums"]["categorie_salon"]
          code_postal?: string | null
          compte_suspendu?: boolean
          created_at?: string
          description?: string | null
          gerant_user_id?: string | null
          id?: string
          latitude?: number | null
          lien_externe?: string | null
          longitude?: number | null
          nb_avis?: number
          nb_avis_google?: number | null
          nom?: string
          note_google?: number | null
          note_moyenne?: number | null
          photo_couverture_url?: string | null
          reservation_en_ligne?: boolean
          slug?: string | null
          source?: string | null
          statut?: Database["public"]["Enums"]["statut_salon"]
          telephone?: string | null
          trial_ends_at?: string
          trial_started_at?: string
          ville?: string | null
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      creneaux_disponibles: {
        Args: {
          p_date: string
          p_employe: string
          p_prestation: string
          p_salon: string
        }
        Returns: {
          debut: string
          employe_id: string
        }[]
      }
      current_salon_id: { Args: never; Returns: string }
      is_gerant: { Args: never; Returns: boolean }
      mon_employe_id: { Args: never; Returns: string }
      reclamer_invitation: { Args: never; Returns: string }
      slugifier: { Args: { p_texte: string }; Returns: string }
      unaccent_immutable: { Args: { p_texte: string }; Returns: string }
    }
    Enums: {
      categorie_salon:
        | "coiffeur"
        | "barbier"
        | "manucure"
        | "institut_beaute"
        | "bien_etre"
        | "massage"
        | "sophrologue"
        | "reflexologue"
        | "hypnotherapeute"
        | "naturopathe"
        | "coach_de_vie"
      moyen_paiement: "cb" | "especes" | "cheque" | "autre"
      role_employe: "gerant" | "employe"
      statut_rdv:
        | "a_venir"
        | "venu"
        | "no_show"
        | "annule"
        | "en_attente_paiement"
      statut_salon: "reclame" | "non_reclame"
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
      categorie_salon: [
        "coiffeur",
        "barbier",
        "manucure",
        "institut_beaute",
        "bien_etre",
        "massage",
        "sophrologue",
        "reflexologue",
        "hypnotherapeute",
        "naturopathe",
        "coach_de_vie",
      ],
      moyen_paiement: ["cb", "especes", "cheque", "autre"],
      role_employe: ["gerant", "employe"],
      statut_rdv: [
        "a_venir",
        "venu",
        "no_show",
        "annule",
        "en_attente_paiement",
      ],
      statut_salon: ["reclame", "non_reclame"],
      type_acompte: ["montant", "pourcentage"],
    },
  },
} as const
