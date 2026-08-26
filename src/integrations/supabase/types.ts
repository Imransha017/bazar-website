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
      addresses: {
        Row: {
          address: string
          code: string | null
          created_at: string
          district: string
          full_name: string
          id: string
          is_default: boolean
          label: string | null
          phone: string
          store_name: string | null
          store_slug: string | null
          thana: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          code?: string | null
          created_at?: string
          district: string
          full_name: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone: string
          store_name?: string | null
          store_slug?: string | null
          thana: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          code?: string | null
          created_at?: string
          district?: string
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string | null
          phone?: string
          store_name?: string | null
          store_slug?: string | null
          thana?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          created_at: string
          entity_id: string
          entity_type: string
          from_value: string | null
          id: string
          metadata: Json | null
          note: string | null
          to_value: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          from_value?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          to_value?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_value?: string | null
          id?: string
          metadata?: Json | null
          note?: string | null
          to_value?: string | null
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          details: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          landing_path: string | null
          product_id: string | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          landing_path?: string | null
          product_id?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          landing_path?: string | null
          product_id?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_commissions: {
        Row: {
          affiliate_id: string
          amount: number
          commission_pct: number
          created_at: string
          id: string
          notes: string | null
          order_id: string | null
          order_total: number
          product_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount: number
          commission_pct: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          order_total: number
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          commission_pct?: number
          created_at?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          order_total?: number
          product_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_commissions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          amount: number
          created_at: string
          details: string | null
          id: string
          method: string | null
          status: string
          txn_ref: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          amount: number
          created_at?: string
          details?: string | null
          id?: string
          method?: string | null
          status?: string
          txn_ref?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          amount?: number
          created_at?: string
          details?: string | null
          id?: string
          method?: string | null
          status?: string
          txn_ref?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          created_at: string
          id: string
          referred_user_id: string | null
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          id?: string
          referred_user_id?: string | null
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          id?: string
          referred_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings: {
        Row: {
          commission_pct: number
          cookie_days: number
          id: number
          is_enabled: boolean
          min_payout: number
          terms: string | null
          updated_at: string
        }
        Insert: {
          commission_pct?: number
          cookie_days?: number
          id?: number
          is_enabled?: boolean
          min_payout?: number
          terms?: string | null
          updated_at?: string
        }
        Update: {
          commission_pct?: number
          cookie_days?: number
          id?: number
          is_enabled?: boolean
          min_payout?: number
          terms?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          code: string
          commission_pct: number | null
          created_at: string
          id: string
          payout_details: string | null
          payout_method: string | null
          rejection_reason: string | null
          status: string
          total_clicks: number
          total_earned: number
          total_orders: number
          total_paid: number
          total_signups: number
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          commission_pct?: number | null
          created_at?: string
          id?: string
          payout_details?: string | null
          payout_method?: string | null
          rejection_reason?: string | null
          status?: string
          total_clicks?: number
          total_earned?: number
          total_orders?: number
          total_paid?: number
          total_signups?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          commission_pct?: number | null
          created_at?: string
          id?: string
          payout_details?: string | null
          payout_method?: string | null
          rejection_reason?: string | null
          status?: string
          total_clicks?: number
          total_earned?: number
          total_orders?: number
          total_paid?: number
          total_signups?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_assistant_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_assistant_configs: {
        Row: {
          content: Json
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: Json
          id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          thread_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          thread_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "ai_chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_threads: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      ai_memory_files: {
        Row: {
          content: string
          created_at: string
          extracted_at: string | null
          extraction_error: string | null
          extraction_status: string
          file_name: string
          id: string
          is_active: boolean
          mime_type: string | null
          size_bytes: number | null
          storage_path: string | null
        }
        Insert: {
          content?: string
          created_at?: string
          extracted_at?: string | null
          extraction_error?: string | null
          extraction_status?: string
          file_name: string
          id?: string
          is_active?: boolean
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          extracted_at?: string | null
          extraction_error?: string | null
          extraction_status?: string
          file_name?: string
          id?: string
          is_active?: boolean
          mime_type?: string | null
          size_bytes?: number | null
          storage_path?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          props: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          props?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          props?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean
          button_label: string | null
          button_link: string | null
          created_at: string
          gradient_from: string
          gradient_to: string
          id: string
          image_url: string
          link_url: string
          placement: string
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          button_label?: string | null
          button_link?: string | null
          created_at?: string
          gradient_from?: string
          gradient_to?: string
          id?: string
          image_url?: string
          link_url?: string
          placement?: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          button_label?: string | null
          button_link?: string | null
          created_at?: string
          gradient_from?: string
          gradient_to?: string
          id?: string
          image_url?: string
          link_url?: string
          placement?: string
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          is_dropshipper_exclusive: boolean
          max_discount: number | null
          min_order: number
          product_ids: string[] | null
          updated_at: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_dropshipper_exclusive?: boolean
          max_discount?: number | null
          min_order?: number
          product_ids?: string[] | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          is_dropshipper_exclusive?: boolean
          max_discount?: number | null
          min_order?: number
          product_ids?: string[] | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      dropshipper_clicks: {
        Row: {
          created_at: string
          dropshipper_id: string
          id: string
          landing_path: string | null
          product_id: string | null
          referer: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          dropshipper_id: string
          id?: string
          landing_path?: string | null
          product_id?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          dropshipper_id?: string
          id?: string
          landing_path?: string | null
          product_id?: string | null
          referer?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_clicks_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_clicks_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_clicks_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshipper_earnings: {
        Row: {
          activity_log: Json | null
          base_price: number
          created_at: string
          dropshipper_id: string
          id: string
          metadata: Json | null
          order_id: string
          product_id: string | null
          profit: number
          qty: number
          retail_price: number
          status: string
          updated_at: string
        }
        Insert: {
          activity_log?: Json | null
          base_price?: number
          created_at?: string
          dropshipper_id: string
          id?: string
          metadata?: Json | null
          order_id: string
          product_id?: string | null
          profit?: number
          qty?: number
          retail_price?: number
          status?: string
          updated_at?: string
        }
        Update: {
          activity_log?: Json | null
          base_price?: number
          created_at?: string
          dropshipper_id?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          product_id?: string | null
          profit?: number
          qty?: number
          retail_price?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_earnings_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_earnings_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_earnings_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_earnings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshipper_feed_logs: {
        Row: {
          created_at: string
          dropshipper_id: string
          error_message: string | null
          id: string
          item_count: number
          status: string
        }
        Insert: {
          created_at?: string
          dropshipper_id: string
          error_message?: string | null
          id?: string
          item_count?: number
          status?: string
        }
        Update: {
          created_at?: string
          dropshipper_id?: string
          error_message?: string | null
          id?: string
          item_count?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_feed_logs_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_feed_logs_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_feed_logs_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshipper_payouts: {
        Row: {
          account: string
          admin_note: string | null
          amount: number
          created_at: string
          dropshipper_id: string
          id: string
          method: string
          paid_at: string | null
          status: string
          txn_reference: string | null
          updated_at: string
        }
        Insert: {
          account: string
          admin_note?: string | null
          amount: number
          created_at?: string
          dropshipper_id: string
          id?: string
          method: string
          paid_at?: string | null
          status?: string
          txn_reference?: string | null
          updated_at?: string
        }
        Update: {
          account?: string
          admin_note?: string | null
          amount?: number
          created_at?: string
          dropshipper_id?: string
          id?: string
          method?: string
          paid_at?: string | null
          status?: string
          txn_reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_payouts_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_payouts_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_payouts_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshipper_products: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_title: string | null
          dropshipper_id: string
          id: string
          is_active: boolean
          product_id: string
          retail_price: number
          updated_at: string
          visibility_mode: string | null
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          dropshipper_id: string
          id?: string
          is_active?: boolean
          product_id: string
          retail_price: number
          updated_at?: string
          visibility_mode?: string | null
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_title?: string | null
          dropshipper_id?: string
          id?: string
          is_active?: boolean
          product_id?: string
          retail_price?: number
          updated_at?: string
          visibility_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_products_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_products_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_products_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshipper_short_links: {
        Row: {
          alias: string
          cart_adds_count: number
          conversions_count: number
          created_at: string
          dropshipper_id: string
          id: string
          product_id: string | null
          views_count: number
        }
        Insert: {
          alias: string
          cart_adds_count?: number
          conversions_count?: number
          created_at?: string
          dropshipper_id: string
          id?: string
          product_id?: string | null
          views_count?: number
        }
        Update: {
          alias?: string
          cart_adds_count?: number
          conversions_count?: number
          created_at?: string
          dropshipper_id?: string
          id?: string
          product_id?: string | null
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_short_links_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_short_links_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_short_links_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_short_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshippers: {
        Row: {
          banner_url: string | null
          bio: string | null
          code: string
          created_at: string
          custom_domain: string | null
          domain_status: string | null
          domain_verified_at: string | null
          facebook_pixel_id: string | null
          facebook_shop_config: Json | null
          ga_id: string | null
          google_analytics_id: string | null
          id: string
          last_pixel_test_at: string | null
          logo_url: string | null
          notify_email: boolean | null
          notify_sms: boolean
          parent_dropshipper_id: string | null
          payout_method: string
          payout_number: string
          phone: string
          pixel_id: string | null
          pixel_test_status: string | null
          profile_image_url: string | null
          real_time_popups_enabled: boolean | null
          rejection_reason: string | null
          status: string
          store_name: string
          store_slug: string
          sub_affiliate_commission_rate: number | null
          theme_color_background: string | null
          theme_color_primary: string | null
          theme_layout_style: string | null
          total_earned: number
          total_orders: number
          total_paid: number
          updated_at: string
          user_id: string
          visibility_mode: string | null
          whatsapp: string | null
          whatsapp_order_enabled: boolean | null
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          code: string
          created_at?: string
          custom_domain?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          facebook_pixel_id?: string | null
          facebook_shop_config?: Json | null
          ga_id?: string | null
          google_analytics_id?: string | null
          id?: string
          last_pixel_test_at?: string | null
          logo_url?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean
          parent_dropshipper_id?: string | null
          payout_method?: string
          payout_number: string
          phone: string
          pixel_id?: string | null
          pixel_test_status?: string | null
          profile_image_url?: string | null
          real_time_popups_enabled?: boolean | null
          rejection_reason?: string | null
          status?: string
          store_name: string
          store_slug: string
          sub_affiliate_commission_rate?: number | null
          theme_color_background?: string | null
          theme_color_primary?: string | null
          theme_layout_style?: string | null
          total_earned?: number
          total_orders?: number
          total_paid?: number
          updated_at?: string
          user_id: string
          visibility_mode?: string | null
          whatsapp?: string | null
          whatsapp_order_enabled?: boolean | null
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          code?: string
          created_at?: string
          custom_domain?: string | null
          domain_status?: string | null
          domain_verified_at?: string | null
          facebook_pixel_id?: string | null
          facebook_shop_config?: Json | null
          ga_id?: string | null
          google_analytics_id?: string | null
          id?: string
          last_pixel_test_at?: string | null
          logo_url?: string | null
          notify_email?: boolean | null
          notify_sms?: boolean
          parent_dropshipper_id?: string | null
          payout_method?: string
          payout_number?: string
          phone?: string
          pixel_id?: string | null
          pixel_test_status?: string | null
          profile_image_url?: string | null
          real_time_popups_enabled?: boolean | null
          rejection_reason?: string | null
          status?: string
          store_name?: string
          store_slug?: string
          sub_affiliate_commission_rate?: number | null
          theme_color_background?: string | null
          theme_color_primary?: string | null
          theme_layout_style?: string | null
          total_earned?: number
          total_orders?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
          visibility_mode?: string | null
          whatsapp?: string | null
          whatsapp_order_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "dropshippers_parent_dropshipper_id_fkey"
            columns: ["parent_dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshippers_parent_dropshipper_id_fkey"
            columns: ["parent_dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshippers_parent_dropshipper_id_fkey"
            columns: ["parent_dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshipping_announcements: {
        Row: {
          body_md: string | null
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          starts_at: string | null
          title: string
          tone: string
          updated_at: string
        }
        Insert: {
          body_md?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          title: string
          tone?: string
          updated_at?: string
        }
        Update: {
          body_md?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          starts_at?: string | null
          title?: string
          tone?: string
          updated_at?: string
        }
        Relationships: []
      }
      dropshipping_settings: {
        Row: {
          allowed_payout_methods: string[]
          auto_approve_apps: boolean
          auto_approve_earnings: boolean
          cookie_days: number
          default_commission_pct: number
          hero_subtitle: string | null
          hero_title: string | null
          id: number
          is_enabled: boolean
          min_payout: number
          terms_md: string | null
          updated_at: string
        }
        Insert: {
          allowed_payout_methods?: string[]
          auto_approve_apps?: boolean
          auto_approve_earnings?: boolean
          cookie_days?: number
          default_commission_pct?: number
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          is_enabled?: boolean
          min_payout?: number
          terms_md?: string | null
          updated_at?: string
        }
        Update: {
          allowed_payout_methods?: string[]
          auto_approve_apps?: boolean
          auto_approve_earnings?: boolean
          cookie_days?: number
          default_commission_pct?: number
          hero_subtitle?: string | null
          hero_title?: string | null
          id?: number
          is_enabled?: boolean
          min_payout?: number
          terms_md?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          error_type: string | null
          id: string
          message: string | null
          source: string
          stack: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          error_type?: string | null
          id?: string
          message?: string | null
          source: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          error_type?: string | null
          id?: string
          message?: string | null
          source?: string
          stack?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          order_id: string | null
          order_number: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          order_id?: string | null
          order_number?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          order_id?: string | null
          order_number?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_activities: {
        Row: {
          action: string
          created_at: string
          description: string | null
          dropshipper_id: string | null
          id: string
          metadata: Json | null
          order_id: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          dropshipper_id?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          dropshipper_id?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_activities_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "order_activities_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_activities_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_activities_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_audit_logs: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_type: string
          id: string
          message: string
          metadata: Json | null
          order_id: string | null
          severity: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          message: string
          metadata?: Json | null
          order_id?: string | null
          severity?: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          message?: string
          metadata?: Json | null
          order_id?: string | null
          severity?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_audit_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          order_id: string
          order_number: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          order_id: string
          order_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          order_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image: string | null
          name: string
          order_id: string
          price: number
          product_id: string | null
          qty: number
          size: string | null
          sku: string | null
          variant: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          name: string
          order_id: string
          price?: number
          product_id?: string | null
          qty?: number
          size?: string | null
          sku?: string | null
          variant?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          name?: string
          order_id?: string
          price?: number
          product_id?: string | null
          qty?: number
          size?: string | null
          sku?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          details: string | null
          id: string
          order_id: string | null
          order_number: string
          reason: string | null
          resolved_at: string | null
          status: string
          type: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          details?: string | null
          id?: string
          order_id?: string | null
          order_number: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          details?: string | null
          id?: string
          order_id?: string | null
          order_number?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string
          affiliate_code: string | null
          affiliate_id: string | null
          ai_thread_id: string | null
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          discount: number
          discount_amount: number | null
          district: string | null
          dropshipper_code: string | null
          dropshipper_id: string | null
          id: string
          items: Json
          items_json: Json | null
          notes: string | null
          order_number: string
          paid_amount: number | null
          payment_method: string
          payment_status: string
          payment_type: string | null
          sender_phone: string | null
          shipping_cost: number | null
          source: string
          status: string
          subtotal: number
          thana: string | null
          total: number
          tracking_number: string | null
          tracking_url: string | null
          txn_id: string | null
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }
        Insert: {
          address: string
          affiliate_code?: string | null
          affiliate_id?: string | null
          ai_thread_id?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone: string
          delivery_fee?: number
          discount?: number
          discount_amount?: number | null
          district?: string | null
          dropshipper_code?: string | null
          dropshipper_id?: string | null
          id?: string
          items?: Json
          items_json?: Json | null
          notes?: string | null
          order_number?: string
          paid_amount?: number | null
          payment_method?: string
          payment_status?: string
          payment_type?: string | null
          sender_phone?: string | null
          shipping_cost?: number | null
          source?: string
          status?: string
          subtotal?: number
          thana?: string | null
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          txn_id?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Update: {
          address?: string
          affiliate_code?: string | null
          affiliate_id?: string | null
          ai_thread_id?: string | null
          coupon_code?: string | null
          courier_name?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_fee?: number
          discount?: number
          discount_amount?: number | null
          district?: string | null
          dropshipper_code?: string | null
          dropshipper_id?: string | null
          id?: string
          items?: Json
          items_json?: Json | null
          notes?: string | null
          order_number?: string
          paid_amount?: number | null
          payment_method?: string
          payment_status?: string
          payment_type?: string | null
          sender_phone?: string | null
          shipping_cost?: number | null
          source?: string
          status?: string
          subtotal?: number
          thana?: string | null
          total?: number
          tracking_number?: string | null
          tracking_url?: string | null
          txn_id?: string | null
          updated_at?: string
          user_id?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_affiliate_fk"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "orders_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          identifier: string
          method: string
          new_password_hash: string
          requester_ip: string | null
          requester_ua: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          identifier: string
          method: string
          new_password_hash: string
          requester_ip?: string | null
          requester_ua?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          identifier?: string
          method?: string
          new_password_hash?: string
          requester_ip?: string | null
          requester_ua?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      product_marketing_assets: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          platform: string
          product_id: string
          template_data: Json | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          platform: string
          product_id: string
          template_data?: Json | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          platform?: string
          product_id?: string
          template_data?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_marketing_assets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_video_reviews: {
        Row: {
          created_at: string
          dropshipper_id: string
          id: string
          platform: string
          product_id: string
          status: string
          video_url: string
        }
        Insert: {
          created_at?: string
          dropshipper_id: string
          id?: string
          platform: string
          product_id: string
          status?: string
          video_url: string
        }
        Update: {
          created_at?: string
          dropshipper_id?: string
          id?: string
          platform?: string
          product_id?: string
          status?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_video_reviews_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "product_video_reviews_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_video_reviews_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_video_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          brand: string | null
          category_name: string | null
          category_slug: string | null
          cod_available: boolean | null
          colors: Json | null
          created_at: string
          description: string | null
          discount_percent: number | null
          dropshipper_price: number | null
          dropshipping_enabled: boolean
          free_shipping: boolean | null
          gallery: Json
          id: string
          image: string
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          offer_ends_at: string | null
          offer_starts_at: string | null
          option_name: string | null
          option_slug: string | null
          original_price: number | null
          price: number
          rating: number
          return_days: number | null
          short_description: string | null
          sizes: Json | null
          sku: string | null
          slug: string
          sold_count: number
          specifications: Json | null
          stock: number
          stock_quantity: number | null
          subcategory_name: string | null
          subcategory_slug: string | null
          tags: string[] | null
          updated_at: string
          variants: Json | null
          vendor_id: string | null
          video_url: string | null
          warranty: string | null
          weight: number | null
        }
        Insert: {
          badge?: string | null
          brand?: string | null
          category_name?: string | null
          category_slug?: string | null
          cod_available?: boolean | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          dropshipper_price?: number | null
          dropshipping_enabled?: boolean
          free_shipping?: boolean | null
          gallery?: Json
          id?: string
          image?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          offer_ends_at?: string | null
          offer_starts_at?: string | null
          option_name?: string | null
          option_slug?: string | null
          original_price?: number | null
          price: number
          rating?: number
          return_days?: number | null
          short_description?: string | null
          sizes?: Json | null
          sku?: string | null
          slug: string
          sold_count?: number
          specifications?: Json | null
          stock?: number
          stock_quantity?: number | null
          subcategory_name?: string | null
          subcategory_slug?: string | null
          tags?: string[] | null
          updated_at?: string
          variants?: Json | null
          vendor_id?: string | null
          video_url?: string | null
          warranty?: string | null
          weight?: number | null
        }
        Update: {
          badge?: string | null
          brand?: string | null
          category_name?: string | null
          category_slug?: string | null
          cod_available?: boolean | null
          colors?: Json | null
          created_at?: string
          description?: string | null
          discount_percent?: number | null
          dropshipper_price?: number | null
          dropshipping_enabled?: boolean
          free_shipping?: boolean | null
          gallery?: Json
          id?: string
          image?: string
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          offer_ends_at?: string | null
          offer_starts_at?: string | null
          option_name?: string | null
          option_slug?: string | null
          original_price?: number | null
          price?: number
          rating?: number
          return_days?: number | null
          short_description?: string | null
          sizes?: Json | null
          sku?: string | null
          slug?: string
          sold_count?: number
          specifications?: Json | null
          stock?: number
          stock_quantity?: number | null
          subcategory_name?: string | null
          subcategory_slug?: string | null
          tags?: string[] | null
          updated_at?: string
          variants?: Json | null
          vendor_id?: string | null
          video_url?: string | null
          warranty?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_locked: boolean
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_locked?: boolean
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_locked?: boolean
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      promotions: {
        Row: {
          active: boolean
          bg_color: string
          button_label: string | null
          created_at: string
          ends_at: string | null
          id: string
          link_url: string | null
          message: string
          placement: string
          sort_order: number
          starts_at: string | null
          text_color: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bg_color?: string
          button_label?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          link_url?: string | null
          message?: string
          placement?: string
          sort_order?: number
          starts_at?: string | null
          text_color?: string
          title?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bg_color?: string
          button_label?: string | null
          created_at?: string
          ends_at?: string | null
          id?: string
          link_url?: string | null
          message?: string
          placement?: string
          sort_order?: number
          starts_at?: string | null
          text_color?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      recent_views: {
        Row: {
          id: string
          product_id: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recent_views_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      short_link_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          short_link_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          short_link_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          short_link_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "short_link_events_short_link_id_fkey"
            columns: ["short_link_id"]
            isOneToOne: false
            referencedRelation: "dropshipper_short_links"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: number
          settings: Json
          updated_at: string
        }
        Insert: {
          id?: number
          settings?: Json
          updated_at?: string
        }
        Update: {
          id?: number
          settings?: Json
          updated_at?: string
        }
        Relationships: []
      }
      stock_logs: {
        Row: {
          change_amount: number
          created_at: string | null
          id: string
          new_stock: number
          order_id: string | null
          previous_stock: number
          product_id: string
          reason: string
        }
        Insert: {
          change_amount: number
          created_at?: string | null
          id?: string
          new_stock: number
          order_id?: string | null
          previous_stock: number
          product_id: string
          reason: string
        }
        Update: {
          change_amount?: number
          created_at?: string | null
          id?: string
          new_stock?: number
          order_id?: string | null
          previous_stock?: number
          product_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reconciliation_reports: {
        Row: {
          created_by: string | null
          details: Json | null
          id: string
          mismatches_found: number | null
          report_date: string | null
          total_products: number
        }
        Insert: {
          created_by?: string | null
          details?: Json | null
          id?: string
          mismatches_found?: number | null
          report_date?: string | null
          total_products: number
        }
        Update: {
          created_by?: string | null
          details?: Json | null
          id?: string
          mismatches_found?: number | null
          report_date?: string | null
          total_products?: number
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string
          id: string
          is_admin_reply: boolean | null
          message: string
          sender_id: string
          sender_name: string | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean | null
          message: string
          sender_id: string
          sender_name?: string | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_reply?: boolean | null
          message?: string
          sender_id?: string
          sender_name?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string
          created_at: string | null
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_user_profile_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          period_end: string | null
          period_start: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          agreed_terms: boolean
          alt_phone: string | null
          badge: string | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          bank_routing: string | null
          banner_url: string | null
          business_type: string | null
          city: string | null
          commission_pct: number
          country: string | null
          created_at: string
          date_of_birth: string | null
          description: string | null
          district: string | null
          email: string | null
          expected_products: number | null
          facebook: string | null
          footer: Json
          full_name: string | null
          id: string
          instagram: string | null
          logo_url: string | null
          main_category: string | null
          mobile_banking_number: string | null
          mobile_banking_type: string | null
          nid_back_url: string | null
          nid_front_url: string | null
          nid_number: string | null
          notification_preferences: Json | null
          phone: string | null
          postal_code: string | null
          rating: number | null
          rejection_reason: string | null
          slug: string
          status: string
          store_name: string
          store_slug: string | null
          thana: string | null
          tin_number: string | null
          total_orders: number
          total_sales: number
          trade_license: string | null
          updated_at: string
          user_id: string
          vat_number: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          agreed_terms?: boolean
          alt_phone?: string | null
          badge?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_routing?: string | null
          banner_url?: string | null
          business_type?: string | null
          city?: string | null
          commission_pct?: number
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          description?: string | null
          district?: string | null
          email?: string | null
          expected_products?: number | null
          facebook?: string | null
          footer?: Json
          full_name?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          main_category?: string | null
          mobile_banking_number?: string | null
          mobile_banking_type?: string | null
          nid_back_url?: string | null
          nid_front_url?: string | null
          nid_number?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          rejection_reason?: string | null
          slug?: string
          status?: string
          store_name: string
          store_slug?: string | null
          thana?: string | null
          tin_number?: string | null
          total_orders?: number
          total_sales?: number
          trade_license?: string | null
          updated_at?: string
          user_id: string
          vat_number?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          agreed_terms?: boolean
          alt_phone?: string | null
          badge?: string | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          bank_routing?: string | null
          banner_url?: string | null
          business_type?: string | null
          city?: string | null
          commission_pct?: number
          country?: string | null
          created_at?: string
          date_of_birth?: string | null
          description?: string | null
          district?: string | null
          email?: string | null
          expected_products?: number | null
          facebook?: string | null
          footer?: Json
          full_name?: string | null
          id?: string
          instagram?: string | null
          logo_url?: string | null
          main_category?: string | null
          mobile_banking_number?: string | null
          mobile_banking_type?: string | null
          nid_back_url?: string | null
          nid_front_url?: string | null
          nid_number?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          postal_code?: string | null
          rating?: number | null
          rejection_reason?: string | null
          slug?: string
          status?: string
          store_name?: string
          store_slug?: string | null
          thana?: string | null
          tin_number?: string | null
          total_orders?: number
          total_sales?: number
          trade_license?: string | null
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          is_active: boolean
          message: string
          status: string
          updated_at: string
        }
        Insert: {
          is_active?: boolean
          message: string
          status: string
          updated_at?: string
        }
        Update: {
          is_active?: boolean
          message?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      affiliate_performance: {
        Row: {
          dropshipper_id: string | null
          parent_dropshipper_id: string | null
          sub_affiliate_count: number | null
          total_clicks: number | null
          total_profit: number | null
          total_sales: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dropshippers_parent_dropshipper_id_fkey"
            columns: ["parent_dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshippers_parent_dropshipper_id_fkey"
            columns: ["parent_dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshippers_parent_dropshipper_id_fkey"
            columns: ["parent_dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_settings_public: {
        Row: {
          commission_pct: number | null
          cookie_days: number | null
          id: number | null
          is_enabled: boolean | null
        }
        Insert: {
          commission_pct?: number | null
          cookie_days?: number | null
          id?: number | null
          is_enabled?: boolean | null
        }
        Update: {
          commission_pct?: number | null
          cookie_days?: number | null
          id?: number | null
          is_enabled?: boolean | null
        }
        Relationships: []
      }
      dropshipper_products_view: {
        Row: {
          base_price: number | null
          category_slug: string | null
          created_at: string | null
          custom_description: string | null
          custom_title: string | null
          dropshipper_id: string | null
          id: string | null
          is_active: boolean | null
          product_active: boolean | null
          product_id: string | null
          product_image: string | null
          product_name: string | null
          retail_price: number | null
          subcategory_slug: string | null
          visibility_mode: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dropshipper_products_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "affiliate_performance"
            referencedColumns: ["dropshipper_id"]
          },
          {
            foreignKeyName: "dropshipper_products_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_products_dropshipper_id_fkey"
            columns: ["dropshipper_id"]
            isOneToOne: false
            referencedRelation: "dropshippers_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dropshipper_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      dropshippers_public: {
        Row: {
          banner_url: string | null
          bio: string | null
          code: string | null
          id: string | null
          logo_url: string | null
          profile_image_url: string | null
          real_time_popups_enabled: boolean | null
          status: string | null
          store_name: string | null
          store_slug: string | null
          theme_color_background: string | null
          theme_color_primary: string | null
          theme_layout_style: string | null
          visibility_mode: string | null
          whatsapp: string | null
          whatsapp_order_enabled: boolean | null
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          code?: string | null
          id?: string | null
          logo_url?: string | null
          profile_image_url?: string | null
          real_time_popups_enabled?: boolean | null
          status?: string | null
          store_name?: string | null
          store_slug?: string | null
          theme_color_background?: string | null
          theme_color_primary?: string | null
          theme_layout_style?: string | null
          visibility_mode?: string | null
          whatsapp?: string | null
          whatsapp_order_enabled?: boolean | null
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          code?: string | null
          id?: string | null
          logo_url?: string | null
          profile_image_url?: string | null
          real_time_popups_enabled?: boolean | null
          status?: string | null
          store_name?: string | null
          store_slug?: string | null
          theme_color_background?: string | null
          theme_color_primary?: string | null
          theme_layout_style?: string | null
          visibility_mode?: string | null
          whatsapp?: string | null
          whatsapp_order_enabled?: boolean | null
        }
        Relationships: []
      }
      site_settings_public: {
        Row: {
          id: number | null
          settings: Json | null
        }
        Insert: {
          id?: number | null
          settings?: Json | null
        }
        Update: {
          id?: number | null
          settings?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_adjust_dropshipper_earning: {
        Args: { _id: string; _status: string }
        Returns: undefined
      }
      admin_get_user_email: { Args: { _user_id: string }; Returns: string }
      assign_vendor_badges: { Args: never; Returns: undefined }
      attribute_order_to_affiliate:
        | { Args: { _code: string; _order_id: string }; Returns: undefined }
        | {
            Args: { _code: string; _order_id: string; _product_id?: string }
            Returns: undefined
          }
        | {
            Args: { _code: string; _order_id: string; _product_id?: string }
            Returns: undefined
          }
      attribute_order_to_dropshipper: {
        Args: { _code: string; _lines?: Json; _order_id: string }
        Returns: undefined
      }
      get_affiliate_by_code: {
        Args: { _code: string }
        Returns: {
          code: string
          id: string
          status: string
        }[]
      }
      get_my_vendor_id: { Args: never; Returns: string }
      get_public_vendor: {
        Args: { _slug: string }
        Returns: {
          banner_url: string
          city: string
          created_at: string
          description: string
          footer: Json
          id: string
          logo_url: string
          slug: string
          status: string
          store_name: string
          store_slug: string
        }[]
      }
      get_public_vendor_by_id: {
        Args: { _id: string }
        Returns: {
          banner_url: string
          city: string
          created_at: string
          description: string
          footer: Json
          id: string
          logo_url: string
          slug: string
          status: string
          store_name: string
          store_slug: string
        }[]
      }
      get_review_authors: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
        }[]
      }
      has_role:
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
      increment_short_link_metric: {
        Args: { link_id: string; metric: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      list_order_requests: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          admin_note: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          details: string | null
          id: string
          order_id: string | null
          order_number: string
          reason: string | null
          resolved_at: string | null
          status: string
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "order_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      log_order_event: {
        Args: {
          _description?: string
          _event_type: string
          _metadata?: Json
          _order_id: string
          _order_number?: string
        }
        Returns: undefined
      }
      lookup_order: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          address: string
          affiliate_code: string | null
          affiliate_id: string | null
          ai_thread_id: string | null
          coupon_code: string | null
          courier_name: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_fee: number
          discount: number
          discount_amount: number | null
          district: string | null
          dropshipper_code: string | null
          dropshipper_id: string | null
          id: string
          items: Json
          items_json: Json | null
          notes: string | null
          order_number: string
          paid_amount: number | null
          payment_method: string
          payment_status: string
          payment_type: string | null
          sender_phone: string | null
          shipping_cost: number | null
          source: string
          status: string
          subtotal: number
          thana: string | null
          total: number
          tracking_number: string | null
          tracking_url: string | null
          txn_id: string | null
          updated_at: string
          user_id: string | null
          vendor_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_dropshipper_payout_paid: {
        Args: { _id: string; _txn_reference: string }
        Returns: undefined
      }
      my_dropshipper_ids: { Args: never; Returns: string[] }
      my_vendor_ids: { Args: never; Returns: string[] }
      place_order: { Args: { _payload: Json }; Returns: Json }
      request_dropshipper_payout: {
        Args: { _account: string; _amount: number; _method: string }
        Returns: string
      }
      submit_order_request: {
        Args: {
          _details?: string
          _order_number: string
          _phone: string
          _reason?: string
          _type: string
        }
        Returns: Json
      }
      track_affiliate_click:
        | {
            Args: { _code: string; _path?: string; _ref?: string; _ua?: string }
            Returns: string
          }
        | {
            Args: {
              _code: string
              _path?: string
              _product_id?: string
              _ref?: string
              _ua?: string
            }
            Returns: string
          }
        | {
            Args: {
              _code: string
              _path?: string
              _product_id?: string
              _ref?: string
              _ua?: string
            }
            Returns: undefined
          }
      track_dropshipper_click:
        | {
            Args: {
              _code: string
              _path?: string
              _product_id?: string
              _ref?: string
              _ua?: string
            }
            Returns: string
          }
        | {
            Args: {
              _code: string
              _path?: string
              _product_id?: string
              _ref?: string
              _ua?: string
              _utm_campaign?: string
              _utm_medium?: string
              _utm_source?: string
            }
            Returns: undefined
          }
      validate_coupon:
        | { Args: { _code: string; _subtotal: number }; Returns: Json }
        | {
            Args: { _code: string; _items?: Json; _subtotal: number }
            Returns: Json
          }
    }
    Enums: {
      app_role: "admin" | "user" | "vendor" | "dropshipper" | "moderator"
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
      app_role: ["admin", "user", "vendor", "dropshipper", "moderator"],
    },
  },
} as const
