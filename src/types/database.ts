// Generated from SQL migrations by npm run db:types. Do not edit manually.
export type Database = {
  public: {
    Tables: {
      admin_grants: {
        Row: {
          user_id: string;
          granted_by: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          granted_by?: string | null;
          reason: string;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          granted_by?: string | null;
          reason?: string;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "admin_grants_granted_by_fkey"; columns: ["granted_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
          { foreignKeyName: "admin_grants_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      dealer_profiles: {
        Row: {
          user_id: string;
          business_name: string;
          verification_status: string;
          verified_by: string | null;
          verified_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          business_name: string;
          verification_status?: string;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          business_name?: string;
          verification_status?: string;
          verified_by?: string | null;
          verified_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "dealer_profiles_user_id_fkey"; columns: ["user_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "dealer_profiles_verified_by_fkey"; columns: ["verified_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
        ];
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          preferred_locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "profiles_id_fkey"; columns: ["id"]; isOneToOne: true; referencedRelation: "users"; referencedColumns: ["id"] },
        ];
      };
      seller_listing_photos: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          slot: string;
          position: number;
          is_cover: boolean;
          uploaded_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          listing_id: string;
          storage_path: string;
          slot: string;
          position: number;
          is_cover?: boolean;
          uploaded_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          slot?: string;
          position?: number;
          is_cover?: boolean;
          uploaded_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "seller_listing_photos_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "seller_listings"; referencedColumns: ["id"] },
        ];
      };
      seller_listings: {
        Row: {
          id: string;
          owner_id: string;
          status: string;
          details: Json;
          expected_price_minor: number | null;
          minimum_price_minor: number | null;
          buy_now_price_minor: number | null;
          revision: number;
          last_step: number;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
          phone_verified: boolean;
          submission_terms_version: string | null;
        };
        Insert: {
          id: string;
          owner_id: string;
          status?: string;
          details?: Json;
          expected_price_minor?: number | null;
          minimum_price_minor?: number | null;
          buy_now_price_minor?: number | null;
          revision?: number;
          last_step?: number;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          phone_verified?: boolean;
          submission_terms_version?: string | null;
        };
        Update: {
          id?: string;
          owner_id?: string;
          status?: string;
          details?: Json;
          expected_price_minor?: number | null;
          minimum_price_minor?: number | null;
          buy_now_price_minor?: number | null;
          revision?: number;
          last_step?: number;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
          phone_verified?: boolean;
          submission_terms_version?: string | null;
        };
        Relationships: [
          { foreignKeyName: "seller_listings_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      seller_upload_limits: {
        Row: {
          owner_id: string;
          window_started_at: string;
          attempts: number;
        };
        Insert: {
          owner_id: string;
          window_started_at?: string;
          attempts?: number;
        };
        Update: {
          owner_id?: string;
          window_started_at?: string;
          attempts?: number;
        };
        Relationships: [
          { foreignKeyName: "seller_upload_limits_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: true; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ];
      };
      vehicle_listings: {
        Row: {
          id: string;
          slug: string;
          category: string;
          make: string;
          model: string;
          manufacture_year: number;
          registration_year: number | null;
          district: string;
          mileage_km: number | null;
          currency: string;
          price_minor: number;
          price_kind: string;
          fuel_type: string | null;
          transmission: string | null;
          engine_capacity_cc: number | null;
          body_type: string | null;
          condition_description: string | null;
          known_defects: string | null;
          accident_history: boolean | null;
          flood_history: boolean | null;
          status: string;
          approved_at: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          search_text: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          category?: string;
          make: string;
          model: string;
          manufacture_year: number;
          registration_year?: number | null;
          district: string;
          mileage_km?: number | null;
          currency?: string;
          price_minor: number;
          price_kind?: string;
          fuel_type?: string | null;
          transmission?: string | null;
          engine_capacity_cc?: number | null;
          body_type?: string | null;
          condition_description?: string | null;
          known_defects?: string | null;
          accident_history?: boolean | null;
          flood_history?: boolean | null;
          status?: string;
          approved_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          search_text?: never;
        };
        Update: {
          id?: string;
          slug?: string;
          category?: string;
          make?: string;
          model?: string;
          manufacture_year?: number;
          registration_year?: number | null;
          district?: string;
          mileage_km?: number | null;
          currency?: string;
          price_minor?: number;
          price_kind?: string;
          fuel_type?: string | null;
          transmission?: string | null;
          engine_capacity_cc?: number | null;
          body_type?: string | null;
          condition_description?: string | null;
          known_defects?: string | null;
          accident_history?: boolean | null;
          flood_history?: boolean | null;
          status?: string;
          approved_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          search_text?: never;
        };
        Relationships: [
        ];
      };
      vehicle_media: {
        Row: {
          id: string;
          listing_id: string;
          storage_path: string;
          alt_text: string | null;
          position: number;
          approved_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          storage_path: string;
          alt_text?: string | null;
          position: number;
          approved_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          storage_path?: string;
          alt_text?: string | null;
          position?: number;
          approved_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "vehicle_media_listing_id_fkey"; columns: ["listing_id"]; isOneToOne: false; referencedRelation: "vehicle_listings"; referencedColumns: ["id"] },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      marketplace_facets: { Args: Record<string, never>; Returns: Json };
      seller_create_draft: { Args: { p_input: Json }; Returns: Json };
      seller_manage_photo: { Args: { p_input: Json }; Returns: Json };
      seller_save_draft: { Args: { p_input: Json }; Returns: Json };
      seller_submit_listing: { Args: { p_input: Json }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
