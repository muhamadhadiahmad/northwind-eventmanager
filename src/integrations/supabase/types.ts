export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      attendees: {
        Row: {
          check_in_time: string | null
          checked_in: boolean
          created_at: string
          email: string | null
          event_id: string
          id: string
          identification_number: string | null
          name: string
          phone: string | null
          qr_code: string | null
          staff_id: string | null
          table_assignment: string | null
        }
        Insert: {
          check_in_time?: string | null
          checked_in?: boolean
          created_at?: string
          email?: string | null
          event_id: string
          id?: string
          identification_number?: string | null
          name: string
          phone?: string | null
          qr_code?: string | null
          staff_id?: string | null
          table_assignment?: string | null
        }
        Update: {
          check_in_time?: string | null
          checked_in?: boolean
          created_at?: string
          email?: string | null
          event_id?: string
          id?: string
          identification_number?: string | null
          name?: string
          phone?: string | null
          qr_code?: string | null
          staff_id?: string | null
          table_assignment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendees_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendees_table_assignment_fkey"
            columns: ["table_assignment"]
            isOneToOne: false
            referencedRelation: "event_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_tables: {
        Row: {
          capacity: number
          created_at: string
          event_id: string
          id: string
          position_x: number | null
          position_y: number | null
          table_number: number
          table_type: Database["public"]["Enums"]["table_type"]
        }
        Insert: {
          capacity?: number
          created_at?: string
          event_id: string
          id?: string
          position_x?: number | null
          position_y?: number | null
          table_number: number
          table_type?: Database["public"]["Enums"]["table_type"]
        }
        Update: {
          capacity?: number
          created_at?: string
          event_id?: string
          id?: string
          position_x?: number | null
          position_y?: number | null
          table_number?: number
          table_type?: Database["public"]["Enums"]["table_type"]
        }
        Relationships: [
          {
            foreignKeyName: "event_tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          description: string | null
          event_date: string
          id: string
          is_active: boolean
          location: string | null
          max_attendees: number | null
          name: string
          registration_qr: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date: string
          id?: string
          is_active?: boolean
          location?: string | null
          max_attendees?: number | null
          name: string
          registration_qr?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_date?: string
          id?: string
          is_active?: boolean
          location?: string | null
          max_attendees?: number | null
          name?: string
          registration_qr?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photos: {
        Row: {
          attendee_name: string | null
          created_at: string
          event_id: string
          id: string
          is_approved: boolean
          photo_url: string
        }
        Insert: {
          attendee_name?: string | null
          created_at?: string
          event_id: string
          id?: string
          is_approved?: boolean
          photo_url: string
        }
        Update: {
          attendee_name?: string | null
          created_at?: string
          event_id?: string
          id?: string
          is_approved?: boolean
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_draw_winners: {
        Row: {
          attendee_id: string
          drawn_at: string
          event_id: string
          id: string
          prize_name: string | null
          round_number: number
        }
        Insert: {
          attendee_id: string
          drawn_at?: string
          event_id: string
          id?: string
          prize_name?: string | null
          round_number: number
        }
        Update: {
          attendee_id?: string
          drawn_at?: string
          event_id?: string
          id?: string
          prize_name?: string | null
          round_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "lucky_draw_winners_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lucky_draw_winners_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          attendee_id: string
          created_at: string
          id: string
          voting_photo_id: string
        }
        Insert: {
          attendee_id: string
          created_at?: string
          id?: string
          voting_photo_id: string
        }
        Update: {
          attendee_id?: string
          created_at?: string
          id?: string
          voting_photo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_attendee_id_fkey"
            columns: ["attendee_id"]
            isOneToOne: false
            referencedRelation: "attendees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voting_photo_id_fkey"
            columns: ["voting_photo_id"]
            isOneToOne: false
            referencedRelation: "voting_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_photos: {
        Row: {
          created_at: string
          id: string
          photo_url: string
          title: string
          vote_count: number
          voting_session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_url: string
          title: string
          vote_count?: number
          voting_session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_url?: string
          title?: string
          vote_count?: number
          voting_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voting_photos_voting_session_id_fkey"
            columns: ["voting_session_id"]
            isOneToOne: false
            referencedRelation: "voting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      voting_sessions: {
        Row: {
          created_at: string
          description: string | null
          event_id: string
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_id: string
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_id?: string
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "voting_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_company_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      table_type: "VVIP" | "VIP" | "Regular" | "Staff"
      user_role: "admin" | "manager" | "staff" | "superadmin"
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
      table_type: ["VVIP", "VIP", "Regular", "Staff"],
      user_role: ["admin", "manager", "staff", "superadmin"],
    },
  },
} as const
