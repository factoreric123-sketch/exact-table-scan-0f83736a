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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
          order_index: number
          restaurant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          order_index: number
          restaurant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "hot_menu_data"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      course_invitations: {
        Row: {
          course_id: string
          created_at: string
          email: string
          expires_at: string
          id: string
          instructor_id: string
          status: string
          token: string
          used_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          instructor_id: string
          status?: string
          token: string
          used_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          instructor_id?: string
          status?: string
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_invitations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          difficulty_level: string | null
          estimated_duration_hours: number | null
          id: string
          instructor_id: string
          price: number | null
          status: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          instructor_id: string
          price?: number | null
          status?: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          difficulty_level?: string | null
          estimated_duration_hours?: number | null
          id?: string
          instructor_id?: string
          price?: number | null
          status?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      dish_modifiers: {
        Row: {
          created_at: string | null
          dish_id: string
          id: string
          name: string
          order_index: number
          price: string
        }
        Insert: {
          created_at?: string | null
          dish_id: string
          id?: string
          name: string
          order_index?: number
          price: string
        }
        Update: {
          created_at?: string | null
          dish_id?: string
          id?: string
          name?: string
          order_index?: number
          price?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_modifiers_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dish_options: {
        Row: {
          created_at: string | null
          dish_id: string
          id: string
          name: string
          order_index: number
          price: string
        }
        Insert: {
          created_at?: string | null
          dish_id: string
          id?: string
          name: string
          order_index?: number
          price: string
        }
        Update: {
          created_at?: string | null
          dish_id?: string
          id?: string
          name?: string
          order_index?: number
          price?: string
        }
        Relationships: [
          {
            foreignKeyName: "dish_options_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          allergens: string[] | null
          calories: number | null
          created_at: string | null
          description: string | null
          has_options: boolean | null
          id: string
          image_url: string | null
          is_chef_recommendation: boolean | null
          is_new: boolean | null
          is_popular: boolean | null
          is_special: boolean | null
          is_spicy: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          order_index: number
          price: string
          subcategory_id: string
        }
        Insert: {
          allergens?: string[] | null
          calories?: number | null
          created_at?: string | null
          description?: string | null
          has_options?: boolean | null
          id?: string
          image_url?: string | null
          is_chef_recommendation?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_special?: boolean | null
          is_spicy?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          order_index: number
          price: string
          subcategory_id: string
        }
        Update: {
          allergens?: string[] | null
          calories?: number | null
          created_at?: string | null
          description?: string | null
          has_options?: boolean | null
          id?: string
          image_url?: string | null
          is_chef_recommendation?: boolean | null
          is_new?: boolean | null
          is_popular?: boolean | null
          is_special?: boolean | null
          is_spicy?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          order_index?: number
          price?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress_percentage: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress_percentage?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          content_type: string | null
          content_url: string | null
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          order_index: number
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string | null
          content_url?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          order_index?: number
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_links: {
        Row: {
          active: boolean
          created_at: string
          id: string
          menu_id: string
          restaurant_hash: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          menu_id: string
          restaurant_hash: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          menu_id?: string
          restaurant_hash?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_links_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "hot_menu_data"
            referencedColumns: ["restaurant_id"]
          },
          {
            foreignKeyName: "menu_links_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: true
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          allergen_filter_order: Json | null
          badge_colors: Json | null
          badge_display_order: Json | null
          created_at: string | null
          dietary_filter_order: Json | null
          editor_view_mode: string | null
          force_two_decimals: boolean | null
          grid_columns: number | null
          hero_image_url: string | null
          id: string
          image_size: string | null
          layout_density: string | null
          layout_style: string | null
          menu_font_size: string | null
          name: string
          owner_id: string
          published: boolean | null
          show_allergen_filter: boolean | null
          show_currency_symbol: boolean | null
          show_images: boolean | null
          show_prices: boolean | null
          slug: string
          tagline: string | null
          theme: Json | null
          updated_at: string | null
        }
        Insert: {
          allergen_filter_order?: Json | null
          badge_colors?: Json | null
          badge_display_order?: Json | null
          created_at?: string | null
          dietary_filter_order?: Json | null
          editor_view_mode?: string | null
          force_two_decimals?: boolean | null
          grid_columns?: number | null
          hero_image_url?: string | null
          id?: string
          image_size?: string | null
          layout_density?: string | null
          layout_style?: string | null
          menu_font_size?: string | null
          name: string
          owner_id: string
          published?: boolean | null
          show_allergen_filter?: boolean | null
          show_currency_symbol?: boolean | null
          show_images?: boolean | null
          show_prices?: boolean | null
          slug: string
          tagline?: string | null
          theme?: Json | null
          updated_at?: string | null
        }
        Update: {
          allergen_filter_order?: Json | null
          badge_colors?: Json | null
          badge_display_order?: Json | null
          created_at?: string | null
          dietary_filter_order?: Json | null
          editor_view_mode?: string | null
          force_two_decimals?: boolean | null
          grid_columns?: number | null
          hero_image_url?: string | null
          id?: string
          image_size?: string | null
          layout_density?: string | null
          layout_style?: string | null
          menu_font_size?: string | null
          name?: string
          owner_id?: string
          published?: boolean | null
          show_allergen_filter?: boolean | null
          show_currency_symbol?: boolean | null
          show_images?: boolean | null
          show_prices?: boolean | null
          slug?: string
          tagline?: string | null
          theme?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_pages: {
        Row: {
          course_id: string
          created_at: string
          custom_css: string | null
          description: string | null
          faq: Json | null
          hero_headline: string | null
          hero_subheadline: string | null
          id: string
          instructor_id: string
          is_published: boolean | null
          pricing_strategy: string | null
          show_curriculum: boolean | null
          show_instructor_bio: boolean | null
          slug: string
          subtitle: string | null
          testimonials: Json | null
          theme_colors: Json | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          custom_css?: string | null
          description?: string | null
          faq?: Json | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          instructor_id: string
          is_published?: boolean | null
          pricing_strategy?: string | null
          show_curriculum?: boolean | null
          show_instructor_bio?: boolean | null
          slug: string
          subtitle?: string | null
          testimonials?: Json | null
          theme_colors?: Json | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          custom_css?: string | null
          description?: string | null
          faq?: Json | null
          hero_headline?: string | null
          hero_subheadline?: string | null
          id?: string
          instructor_id?: string
          is_published?: boolean | null
          pricing_strategy?: string | null
          show_curriculum?: boolean | null
          show_instructor_bio?: boolean | null
          slug?: string
          subtitle?: string | null
          testimonials?: Json | null
          theme_colors?: Json | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_pages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          name: string
          order_index: number
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          name: string
          order_index: number
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_themes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          theme_data: Json
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          theme_data: Json
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          theme_data?: Json
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      hot_menu_data: {
        Row: {
          categories: Json | null
          hero_image_url: string | null
          restaurant_id: string | null
          restaurant_name: string | null
          slug: string | null
          theme: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      batch_update_order_indexes: {
        Args: { table_name: string; updates: Json }
        Returns: undefined
      }
      batch_update_order_indexes_optimized: {
        Args: { table_name: string; updates: Json }
        Returns: undefined
      }
      ensure_menu_link_for_restaurant: {
        Args: { p_restaurant_id: string }
        Returns: {
          is_accessible: boolean
          menu_id: string
          restaurant_hash: string
          url: string
        }[]
      }
      get_restaurant_full_menu: {
        Args: { p_restaurant_id: string }
        Returns: Json
      }
      get_restaurant_menu_optimized: { Args: { p_slug: string }; Returns: Json }
      get_subscription_status: {
        Args: never
        Returns: {
          cancel_at_period_end: boolean
          current_period_end: string
          has_premium: boolean
          plan_type: string
          status: string
        }[]
      }
      has_premium_subscription: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_hot_menu_data: { Args: never; Returns: undefined }
      verify_menu_link_accessible: {
        Args: { p_menu_id: string; p_restaurant_hash: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin"
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
      app_role: ["owner", "admin"],
    },
  },
} as const
