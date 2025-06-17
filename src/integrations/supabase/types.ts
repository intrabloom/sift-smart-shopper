export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      product_prices: {
        Row: {
          id: string
          in_stock: boolean | null
          last_updated: string | null
          price: number
          product_id: string
          sale_price: number | null
          store_id: string
        }
        Insert: {
          id?: string
          in_stock?: boolean | null
          last_updated?: string | null
          price: number
          product_id: string
          sale_price?: number | null
          store_id: string
        }
        Update: {
          id?: string
          in_stock?: boolean | null
          last_updated?: string | null
          price?: number
          product_id?: string
          sale_price?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[] | null
          brand: string | null
          category: string | null
          created_at: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          name: string
          nutrition_facts: Json | null
          size: string | null
          upc: string
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          name: string
          nutrition_facts?: Json | null
          size?: string | null
          upc: string
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          brand?: string | null
          category?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          name?: string
          nutrition_facts?: Json | null
          size?: string | null
          upc?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          favorite_products: string[] | null
          favorite_stores: string[] | null
          id: string
          notifications: Json | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          favorite_products?: string[] | null
          favorite_stores?: string[] | null
          id: string
          notifications?: Json | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          favorite_products?: string[] | null
          favorite_stores?: string[] | null
          id?: string
          notifications?: Json | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      store_catalogs: {
        Row: {
          brand: string | null
          id: string
          in_stock: boolean | null
          last_updated: string | null
          price: number | null
          product_name: string
          store_id: string
          upc: string | null
        }
        Insert: {
          brand?: string | null
          id?: string
          in_stock?: boolean | null
          last_updated?: string | null
          price?: number | null
          product_name: string
          store_id: string
          upc?: string | null
        }
        Update: {
          brand?: string | null
          id?: string
          in_stock?: boolean | null
          last_updated?: string | null
          price?: number | null
          product_name?: string
          store_id?: string
          upc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_catalogs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string
          city: string
          created_at: string | null
          hours: Json | null
          id: string
          latitude: number
          longitude: number
          name: string
          phone: string | null
          state: string
          supported_apis: string[] | null
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string | null
          hours?: Json | null
          id?: string
          latitude: number
          longitude: number
          name: string
          phone?: string | null
          state: string
          supported_apis?: string[] | null
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string | null
          hours?: Json | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          phone?: string | null
          state?: string
          supported_apis?: string[] | null
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      user_locations: {
        Row: {
          address: string
          city: string | null
          created_at: string | null
          id: string
          is_primary: boolean | null
          latitude: number
          longitude: number
          name: string
          state: string | null
          updated_at: string | null
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude: number
          longitude: number
          name: string
          state?: string | null
          updated_at?: string | null
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          latitude?: number
          longitude?: number
          name?: string
          state?: string | null
          updated_at?: string | null
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      user_search_history: {
        Row: {
          created_at: string | null
          id: string
          product_upc: string
          search_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_upc: string
          search_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_upc?: string
          search_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_store_roster: {
        Row: {
          created_at: string | null
          id: string
          preference_order: number | null
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_order?: number | null
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_order?: number | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_store_roster_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lon1: number; lat2: number; lon2: number }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
