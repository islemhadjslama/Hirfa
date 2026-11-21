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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          contact_email: string | null
          id: number
          shipping_fee: number
          site_name: string
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          id?: number
          shipping_fee?: number
          site_name?: string
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          id?: number
          shipping_fee?: number
          site_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      artisan_profiles: {
        Row: {
          address: string | null
          approved_at: string | null
          banner_url: string | null
          bio: string | null
          city: string | null
          created_at: string
          facebook_url: string | null
          governorate: string | null
          id: string
          instagram_url: string | null
          logo_url: string | null
          rejection_reason: string | null
          shop_name: string
          slug: string
          specialty_category_id: number | null
          status: Database["public"]["Enums"]["artisan_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          banner_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          facebook_url?: string | null
          governorate?: string | null
          id: string
          instagram_url?: string | null
          logo_url?: string | null
          rejection_reason?: string | null
          shop_name: string
          slug: string
          specialty_category_id?: number | null
          status?: Database["public"]["Enums"]["artisan_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          banner_url?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          facebook_url?: string | null
          governorate?: string | null
          id?: string
          instagram_url?: string | null
          logo_url?: string | null
          rejection_reason?: string | null
          shop_name?: string
          slug?: string
          specialty_category_id?: number | null
          status?: Database["public"]["Enums"]["artisan_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artisan_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "artisan_profiles_specialty_category_id_fkey"
            columns: ["specialty_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: number
          image_url: string | null
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: never
          image_url?: string | null
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          client_id: string
          created_at: string
          product_id: number
        }
        Insert: {
          client_id: string
          created_at?: string
          product_id: number
        }
        Update: {
          client_id?: string
          created_at?: string
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: number
          line_total: number
          product_id: number | null
          product_name: string
          quantity: number
          sub_order_id: number
          unit_price: number
        }
        Insert: {
          id?: never
          line_total: number
          product_id?: number | null
          product_name: string
          quantity: number
          sub_order_id: number
          unit_price: number
        }
        Update: {
          id?: never
          line_total?: number
          product_id?: number | null
          product_name?: string
          quantity?: number
          sub_order_id?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          client_id: string
          created_at: string
          id: number
          notes: string | null
          order_number: string
          shipping_address: string
          shipping_city: string
          shipping_full_name: string
          shipping_governorate: string
          shipping_phone: string
          shipping_total: number
          subtotal: number
          total: number
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: never
          notes?: string | null
          order_number?: string
          shipping_address: string
          shipping_city: string
          shipping_full_name: string
          shipping_governorate: string
          shipping_phone: string
          shipping_total?: number
          subtotal?: number
          total?: number
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: never
          notes?: string | null
          order_number?: string
          shipping_address?: string
          shipping_city?: string
          shipping_full_name?: string
          shipping_governorate?: string
          shipping_phone?: string
          shipping_total?: number
          subtotal?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          created_at: string
          id: number
          path: string
          position: number
          product_id: number
        }
        Insert: {
          created_at?: string
          id?: never
          path: string
          position?: number
          product_id: number
        }
        Update: {
          created_at?: string
          id?: never
          path?: string
          position?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          admin_hidden: boolean
          artisan_id: string
          category_id: number
          created_at: string
          description: string
          id: number
          is_featured: boolean
          name: string
          price: number
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock: number
          updated_at: string
          views_count: number
        }
        Insert: {
          admin_hidden?: boolean
          artisan_id: string
          category_id: number
          created_at?: string
          description?: string
          id?: never
          is_featured?: boolean
          name: string
          price: number
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
          views_count?: number
        }
        Update: {
          admin_hidden?: boolean
          artisan_id?: string
          category_id?: number
          created_at?: string
          description?: string
          id?: never
          is_featured?: boolean
          name?: string
          price?: number
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock?: number
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisan_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          governorate: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          governorate?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          governorate?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: number
          is_hidden: boolean
          product_id: number
          rating: number
          updated_at: string
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: never
          is_hidden?: boolean
          product_id: number
          rating: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: never
          is_hidden?: boolean
          product_id?: number
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: number
          note: string | null
          status: Database["public"]["Enums"]["sub_order_status"]
          sub_order_id: number
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: never
          note?: string | null
          status: Database["public"]["Enums"]["sub_order_status"]
          sub_order_id: number
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: never
          note?: string | null
          status?: Database["public"]["Enums"]["sub_order_status"]
          sub_order_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sub_order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_order_status_history_sub_order_id_fkey"
            columns: ["sub_order_id"]
            isOneToOne: false
            referencedRelation: "sub_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_orders: {
        Row: {
          artisan_id: string
          cancel_reason: string | null
          created_at: string
          id: number
          order_id: number
          shipping_fee: number
          status: Database["public"]["Enums"]["sub_order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          artisan_id: string
          cancel_reason?: string | null
          created_at?: string
          id?: never
          order_id: number
          shipping_fee?: number
          status?: Database["public"]["Enums"]["sub_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          artisan_id?: string
          cancel_reason?: string | null
          created_at?: string
          id?: never
          order_id?: number
          shipping_fee?: number
          status?: Database["public"]["Enums"]["sub_order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_orders_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisan_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      catalog_products: {
        Row: {
          artisan_city: string | null
          artisan_governorate: string | null
          artisan_id: string | null
          artisan_name: string | null
          artisan_slug: string | null
          avg_rating: number | null
          category_id: number | null
          category_name: string | null
          category_slug: string | null
          created_at: string | null
          description: string | null
          id: number | null
          image_path: string | null
          is_featured: boolean | null
          name: string | null
          price: number | null
          reviews_count: number | null
          search_text: string | null
          slug: string | null
          stock: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_artisan_id_fkey"
            columns: ["artisan_id"]
            isOneToOne: false
            referencedRelation: "artisan_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ratings: {
        Row: {
          avg_rating: number | null
          product_id: number | null
          reviews_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_dashboard_stats: { Args: never; Returns: Json }
      artisan_dashboard_stats: { Args: never; Returns: Json }
      can_bypass_protection: { Args: never; Returns: boolean }
      can_read_sub_order: { Args: { p_sub_order_id: number }; Returns: boolean }
      can_review_product: { Args: { p_product_id: number }; Returns: boolean }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      generate_order_number: { Args: never; Returns: string }
      has_sub_order_with_artisan: {
        Args: { p_artisan_id: string }
        Returns: boolean
      }
      increment_product_view: {
        Args: { p_product_id: number }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_approved_artisan: { Args: never; Returns: boolean }
      is_order_artisan: { Args: { p_order_id: number }; Returns: boolean }
      is_order_client: { Args: { p_order_id: number }; Returns: boolean }
      is_public_artisan: { Args: { p_artisan_id: string }; Returns: boolean }
      place_order: {
        Args: { p_items: Json; p_shipping: Json }
        Returns: number
      }
      product_reviews: {
        Args: { p_product_id: number }
        Returns: {
          author_name: string
          comment: string
          created_at: string
          id: number
          rating: number
          updated_at: string
        }[]
      }
      slugify: { Args: { p_value: string }; Returns: string }
      unique_artisan_slug: {
        Args: { p_exclude_id?: string; p_shop_name: string }
        Returns: string
      }
      update_sub_order_status: {
        Args: {
          p_note?: string
          p_status: Database["public"]["Enums"]["sub_order_status"]
          p_sub_order_id: number
        }
        Returns: undefined
      }
    }
    Enums: {
      artisan_status: "pending" | "approved" | "rejected" | "suspended"
      product_status: "draft" | "published"
      sub_order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipped"
        | "delivered"
        | "cancelled"
      user_role: "client" | "artisan" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      artisan_status: ["pending", "approved", "rejected", "suspended"],
      product_status: ["draft", "published"],
      sub_order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipped",
        "delivered",
        "cancelled",
      ],
      user_role: ["client", "artisan", "admin"],
    },
  },
} as const
