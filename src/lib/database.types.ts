export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      blessings: {
        Row: {
          id: string;
          message: string;
          name: string;
          published: boolean;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          message: string;
          name: string;
          published?: boolean;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          message?: string;
          name?: string;
          published?: boolean;
          submitted_at?: string;
        };
        Relationships: [];
      };
      couple_members: {
        Row: {
          created_at: string;
          description: string;
          display_order: number;
          id: string;
          image_path: string | null;
          image_url: string | null;
          name: string;
          side: string;
          social_links: Json;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          name?: string;
          side: string;
          social_links?: Json;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          display_order?: number;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          name?: string;
          side?: string;
          social_links?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          address: string | null;
          created_at: string;
          description: string | null;
          directions_url: string | null;
          display_order: number;
          end_time: string | null;
          event_date: string;
          icon: string | null;
          id: string;
          image_path: string | null;
          image_url: string | null;
          map_url: string | null;
          name: string;
          published: boolean;
          start_time: string;
          updated_at: string;
          venue: string;
        };
        Insert: {
          address?: string | null;
          created_at?: string;
          description?: string | null;
          directions_url?: string | null;
          display_order?: number;
          end_time?: string | null;
          event_date?: string;
          icon?: string | null;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          map_url?: string | null;
          name?: string;
          published?: boolean;
          start_time?: string;
          updated_at?: string;
          venue?: string;
        };
        Update: {
          address?: string | null;
          created_at?: string;
          description?: string | null;
          directions_url?: string | null;
          display_order?: number;
          end_time?: string | null;
          event_date?: string;
          icon?: string | null;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          map_url?: string | null;
          name?: string;
          published?: boolean;
          start_time?: string;
          updated_at?: string;
          venue?: string;
        };
        Relationships: [];
      };
      family_groups: {
        Row: {
          id: string;
          side: string;
          title: string;
        };
        Insert: {
          id?: string;
          side: string;
          title?: string;
        };
        Update: {
          id?: string;
          side?: string;
          title?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          created_at: string;
          description: string | null;
          display_order: number;
          family_group_id: string;
          id: string;
          image_path: string | null;
          image_url: string | null;
          name: string;
          relationship: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          family_group_id: string;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          name?: string;
          relationship?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          display_order?: number;
          family_group_id?: string;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          name?: string;
          relationship?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "family_members_family_group_id_fkey";
            columns: ["family_group_id"];
            isOneToOne: false;
            referencedRelation: "family_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_categories: {
        Row: {
          created_at: string;
          display_order: number;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      gallery_images: {
        Row: {
          alt_text: string;
          category_id: string | null;
          created_at: string;
          display_order: number;
          id: string;
          image_path: string | null;
          image_url: string;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          alt_text?: string;
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_path?: string | null;
          image_url: string;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Update: {
          alt_text?: string;
          category_id?: string | null;
          created_at?: string;
          display_order?: number;
          id?: string;
          image_path?: string | null;
          image_url?: string;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "gallery_images_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "gallery_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      gift_settings: {
        Row: {
          account_name: string;
          bank_details: string;
          bank_name: string;
          enabled: boolean;
          id: boolean;
          qr_image_path: string | null;
          qr_image_url: string | null;
          updated_at: string;
          upi_id: string;
        };
        Insert: {
          account_name?: string;
          bank_details?: string;
          bank_name?: string;
          enabled?: boolean;
          id?: boolean;
          qr_image_path?: string | null;
          qr_image_url?: string | null;
          updated_at?: string;
          upi_id?: string;
        };
        Update: {
          account_name?: string;
          bank_details?: string;
          bank_name?: string;
          enabled?: boolean;
          id?: boolean;
          qr_image_path?: string | null;
          qr_image_url?: string | null;
          updated_at?: string;
          upi_id?: string;
        };
        Relationships: [];
      };
      hero: {
        Row: {
          id: boolean;
          image_path: string | null;
          image_url: string | null;
          subtitle: string;
          title: string;
          updated_at: string;
          visible: boolean;
        };
        Insert: {
          id?: boolean;
          image_path?: string | null;
          image_url?: string | null;
          subtitle?: string;
          title?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Update: {
          id?: boolean;
          image_path?: string | null;
          image_url?: string | null;
          subtitle?: string;
          title?: string;
          updated_at?: string;
          visible?: boolean;
        };
        Relationships: [];
      };
      music_settings: {
        Row: {
          autoplay: boolean;
          default_track_id: string | null;
          enabled: boolean;
          id: boolean;
          updated_at: string;
        };
        Insert: {
          autoplay?: boolean;
          default_track_id?: string | null;
          enabled?: boolean;
          id?: boolean;
          updated_at?: string;
        };
        Update: {
          autoplay?: boolean;
          default_track_id?: string | null;
          enabled?: boolean;
          id?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "music_settings_default_track_fk";
            columns: ["default_track_id"];
            isOneToOne: false;
            referencedRelation: "music_tracks";
            referencedColumns: ["id"];
          },
        ];
      };
      music_tracks: {
        Row: {
          created_at: string;
          display_order: number;
          enabled: boolean;
          file_path: string | null;
          file_url: string;
          id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          enabled?: boolean;
          file_path?: string | null;
          file_url: string;
          id?: string;
          title?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          enabled?: boolean;
          file_path?: string | null;
          file_url?: string;
          id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      rsvps: {
        Row: {
          attending: string;
          guests: string | null;
          id: string;
          message: string | null;
          name: string;
          phone: string | null;
          submitted_at: string;
        };
        Insert: {
          attending?: string;
          guests?: string | null;
          id?: string;
          message?: string | null;
          name: string;
          phone?: string | null;
          submitted_at?: string;
        };
        Update: {
          attending?: string;
          guests?: string | null;
          id?: string;
          message?: string | null;
          name?: string;
          phone?: string | null;
          submitted_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          bride_name: string;
          favicon_path: string | null;
          favicon_url: string | null;
          footer_text: string;
          groom_name: string;
          hashtag: string;
          id: boolean;
          rsvp_deadline: string;
          tagline: string;
          updated_at: string;
          wedding_date: string | null;
          wedding_date_label: string;
          wedding_title: string;
          welcome_message: string;
        };
        Insert: {
          bride_name?: string;
          favicon_path?: string | null;
          favicon_url?: string | null;
          footer_text?: string;
          groom_name?: string;
          hashtag?: string;
          id?: boolean;
          rsvp_deadline?: string;
          tagline?: string;
          updated_at?: string;
          wedding_date?: string | null;
          wedding_date_label?: string;
          wedding_title?: string;
          welcome_message?: string;
        };
        Update: {
          bride_name?: string;
          favicon_path?: string | null;
          favicon_url?: string | null;
          footer_text?: string;
          groom_name?: string;
          hashtag?: string;
          id?: boolean;
          rsvp_deadline?: string;
          tagline?: string;
          updated_at?: string;
          wedding_date?: string | null;
          wedding_date_label?: string;
          wedding_title?: string;
          welcome_message?: string;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          created_at: string;
          display_order: number;
          enabled: boolean;
          id: string;
          platform: string;
          updated_at: string;
          url: string;
        };
        Insert: {
          created_at?: string;
          display_order?: number;
          enabled?: boolean;
          id?: string;
          platform?: string;
          updated_at?: string;
          url?: string;
        };
        Update: {
          created_at?: string;
          display_order?: number;
          enabled?: boolean;
          id?: string;
          platform?: string;
          updated_at?: string;
          url?: string;
        };
        Relationships: [];
      };
      timeline_items: {
        Row: {
          created_at: string;
          date_label: string;
          description: string;
          display_order: number;
          icon: string | null;
          id: string;
          image_path: string | null;
          image_url: string | null;
          published: boolean;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          date_label?: string;
          description?: string;
          display_order?: number;
          icon?: string | null;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          date_label?: string;
          description?: string;
          display_order?: number;
          icon?: string | null;
          id?: string;
          image_path?: string | null;
          image_url?: string | null;
          published?: boolean;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      venue: {
        Row: {
          address: string;
          description: string;
          directions_url: string | null;
          id: boolean;
          image_path: string | null;
          image_url: string | null;
          map_embed_url: string | null;
          map_url: string | null;
          name: string;
          updated_at: string;
        };
        Insert: {
          address?: string;
          description?: string;
          directions_url?: string | null;
          id?: boolean;
          image_path?: string | null;
          image_url?: string | null;
          map_embed_url?: string | null;
          map_url?: string | null;
          name?: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          description?: string;
          directions_url?: string | null;
          id?: boolean;
          image_path?: string | null;
          image_url?: string | null;
          map_embed_url?: string | null;
          map_url?: string | null;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: boolean };
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
