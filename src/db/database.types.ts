export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      care_entries: {
        Row: {
          category: Database["public"]["Enums"]["care_category_type"]
          created_at: string
          deleted_at: string | null
          entry_date: string
          id: string
          is_deleted: boolean
          note: string | null
          pet_id: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["care_category_type"]
          created_at?: string
          deleted_at?: string | null
          entry_date: string
          id?: string
          is_deleted?: boolean
          note?: string | null
          pet_id: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["care_category_type"]
          created_at?: string
          deleted_at?: string | null
          entry_date?: string
          id?: string
          is_deleted?: boolean
          note?: string | null
          pet_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_entries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_entries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "v_pets_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      pet_owners: {
        Row: {
          created_at: string
          id: string
          pet_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pet_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pet_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pet_owners_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_owners_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "v_pets_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pet_owners_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pets: {
        Row: {
          animal_code: string
          created_at: string
          deleted_at: string | null
          id: string
          is_deleted: boolean
          name: string
          species: Database["public"]["Enums"]["species_type"]
          updated_at: string
        }
        Insert: {
          animal_code: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name: string
          species: Database["public"]["Enums"]["species_type"]
          updated_at?: string
        }
        Update: {
          animal_code?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_deleted?: boolean
          name?: string
          species?: Database["public"]["Enums"]["species_type"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      v_care_history: {
        Row: {
          category: Database["public"]["Enums"]["care_category_type"] | null
          category_display: string | null
          category_emoji: string | null
          created_at: string | null
          entry_date: string | null
          entry_date_formatted: string | null
          has_more: boolean | null
          id: string | null
          note: string | null
          note_preview: string | null
          pet_id: string | null
          updated_at: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["care_category_type"] | null
          category_display?: never
          category_emoji?: never
          created_at?: string | null
          entry_date?: string | null
          entry_date_formatted?: never
          has_more?: never
          id?: string | null
          note?: string | null
          note_preview?: never
          pet_id?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["care_category_type"] | null
          category_display?: never
          category_emoji?: never
          created_at?: string | null
          entry_date?: string | null
          entry_date_formatted?: never
          has_more?: never
          id?: string | null
          note?: string | null
          note_preview?: never
          pet_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "care_entries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "pets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "care_entries_pet_id_fkey"
            columns: ["pet_id"]
            isOneToOne: false
            referencedRelation: "v_pets_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      v_pets_summary: {
        Row: {
          animal_code: string | null
          created_at: string | null
          entries_count: number | null
          id: string | null
          name: string | null
          species: Database["public"]["Enums"]["species_type"] | null
          species_display: string | null
          species_emoji: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      generate_animal_code: { Args: never; Returns: string }
    }
    Enums: {
      care_category_type:
        | "vet_visit"
        | "medication"
        | "grooming"
        | "food"
        | "health_event"
        | "note"
      species_type: "dog" | "cat" | "other"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      care_category_type: [
        "vet_visit",
        "medication",
        "grooming",
        "food",
        "health_event",
        "note",
      ],
      species_type: ["dog", "cat", "other"],
    },
  },
} as const

