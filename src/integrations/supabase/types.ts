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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          bkb_content: string | null
          brand_expert_content: string | null
          business_address: string | null
          business_name: string | null
          business_number: number | null
          business_type: string | null
          city: string | null
          country: string | null
          created_at: string
          creator_links: Json | null
          email: string | null
          email_secondary: string | null
          first_name: string | null
          gmb_link: string | null
          hours: Json | null
          id: string
          last_name: string | null
          onboarding_completed: boolean | null
          persona1_content: string | null
          persona1_title: string | null
          persona2_content: string | null
          persona2_title: string | null
          persona3_content: string | null
          persona3_title: string | null
          phone_number: string | null
          social_links: Json | null
          stage: string | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          bkb_content?: string | null
          brand_expert_content?: string | null
          business_address?: string | null
          business_name?: string | null
          business_number?: number | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          creator_links?: Json | null
          email?: string | null
          email_secondary?: string | null
          first_name?: string | null
          gmb_link?: string | null
          hours?: Json | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          persona1_content?: string | null
          persona1_title?: string | null
          persona2_content?: string | null
          persona2_title?: string | null
          persona3_content?: string | null
          persona3_title?: string | null
          phone_number?: string | null
          social_links?: Json | null
          stage?: string | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          bkb_content?: string | null
          brand_expert_content?: string | null
          business_address?: string | null
          business_name?: string | null
          business_number?: number | null
          business_type?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          creator_links?: Json | null
          email?: string | null
          email_secondary?: string | null
          first_name?: string | null
          gmb_link?: string | null
          hours?: Json | null
          id?: string
          last_name?: string | null
          onboarding_completed?: boolean | null
          persona1_content?: string | null
          persona1_title?: string | null
          persona2_content?: string | null
          persona2_title?: string | null
          persona3_content?: string | null
          persona3_title?: string | null
          phone_number?: string | null
          social_links?: Json | null
          stage?: string | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          id: string
          package_id: string | null
          paid_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          package_id?: string | null
          paid_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          package_id?: string | null
          paid_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number | null
          billing_cycle: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          design: string | null
          domain: string
          id: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          design?: string | null
          domain: string
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          billing_cycle?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          design?: string | null
          domain?: string
          id?: string
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price: number | null
          type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
          type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          business_address: string | null
          business_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string
          experience: string | null
          hours: Json | null
          id: string
          linkedin_url: string | null
          name: string
          onboarding_completed: boolean | null
          phone: string | null
          phone_secondary: string | null
          portfolio_url: string | null
          skills: string[] | null
          social_links: Json | null
          status: string | null
          twitter_url: string | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          experience?: string | null
          hours?: Json | null
          id: string
          linkedin_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_secondary?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          social_links?: Json | null
          status?: string | null
          twitter_url?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          business_address?: string | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          experience?: string | null
          hours?: Json | null
          id?: string
          linkedin_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          phone_secondary?: string | null
          portfolio_url?: string | null
          skills?: string[] | null
          social_links?: Json | null
          status?: string | null
          twitter_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_work_logs: {
        Row: {
          created_at: string
          file_url: string | null
          id: string
          screenshot_url: string | null
          shared_url: string | null
          status: string | null
          task_id: string
          time_spent: number | null
          user_id: string
          work_description: string | null
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          id?: string
          screenshot_url?: string | null
          shared_url?: string | null
          status?: string | null
          task_id: string
          time_spent?: number | null
          user_id: string
          work_description?: string | null
        }
        Update: {
          created_at?: string
          file_url?: string | null
          id?: string
          screenshot_url?: string | null
          shared_url?: string | null
          status?: string | null
          task_id?: string
          time_spent?: number | null
          user_id?: string
          work_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_work_logs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          deadline: string | null
          description: string | null
          file_url: string | null
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["social_media_platform"] | null
          status: Database["public"]["Enums"]["task_status"] | null
          task_number: number | null
          title: string
          type: Database["public"]["Enums"]["task_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_media_platform"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_number?: number | null
          title: string
          type?: Database["public"]["Enums"]["task_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_media_platform"] | null
          status?: Database["public"]["Enums"]["task_status"] | null
          task_number?: number | null
          title?: string
          type?: Database["public"]["Enums"]["task_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_content: {
        Row: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string
          description: string | null
          id: string
          idea: string | null
          platform: Database["public"]["Enums"]["social_media_platform"] | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          idea?: string | null
          platform?: Database["public"]["Enums"]["social_media_platform"] | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string
          description?: string | null
          id?: string
          idea?: string | null
          platform?: Database["public"]["Enums"]["social_media_platform"] | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gallery: {
        Row: {
          created_at: string
          id: string
          name: string
          size: number | null
          type: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          size?: number | null
          type: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          size?: number | null
          type?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_packages: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          package_id: string
          started_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id: string
          started_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          started_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_packages_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "assist"
      business_stage: "new" | "growing"
      content_type: "blog" | "social_media" | "email_marketing" | "others"
      package_type: "starter" | "growth" | "website" | "monthly" | "pro"
      social_media_platform:
        | "facebook"
        | "instagram"
        | "x"
        | "threads"
        | "linkedin"
      task_status: "pending" | "in_progress" | "completed"
      task_type: "blog" | "social_media" | "email_marketing" | "ads" | "others"
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
      app_role: ["user", "assist"],
      business_stage: ["new", "growing"],
      content_type: ["blog", "social_media", "email_marketing", "others"],
      package_type: ["starter", "growth", "website", "monthly", "pro"],
      social_media_platform: [
        "facebook",
        "instagram",
        "x",
        "threads",
        "linkedin",
      ],
      task_status: ["pending", "in_progress", "completed"],
      task_type: ["blog", "social_media", "email_marketing", "ads", "others"],
    },
  },
} as const
