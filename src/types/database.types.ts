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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      action_plans: {
        Row: {
          brand_id: string
          converted_task_id: string | null
          created_at: string
          deadline: string | null
          description: string | null
          id: string
          pic_id: string
          priority: string
          status: string
          title: string
          updated_at: string
          weekly_review_id: string | null
        }
        Insert: {
          brand_id: string
          converted_task_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          pic_id: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          weekly_review_id?: string | null
        }
        Update: {
          brand_id?: string
          converted_task_id?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          id?: string
          pic_id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          weekly_review_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_plans_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_converted_task_id_fkey"
            columns: ["converted_task_id"]
            isOneToOne: false
            referencedRelation: "tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_plans_weekly_review_id_fkey"
            columns: ["weekly_review_id"]
            isOneToOne: false
            referencedRelation: "weekly_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_detail: {
        Row: {
          ad_copy: string | null
          advertiser_name: string | null
          campaign_stage: string | null
          created_at: string | null
          creative_type: string | null
          cta_button: string | null
          date_active: string | null
          destination_url: string | null
          funnel_override: string | null
          funnel_type: string | null
          id: string
          library_id: string
          stage_confidence: number | null
          stage_override: string | null
        }
        Insert: {
          ad_copy?: string | null
          advertiser_name?: string | null
          campaign_stage?: string | null
          created_at?: string | null
          creative_type?: string | null
          cta_button?: string | null
          date_active?: string | null
          destination_url?: string | null
          funnel_override?: string | null
          funnel_type?: string | null
          id?: string
          library_id: string
          stage_confidence?: number | null
          stage_override?: string | null
        }
        Update: {
          ad_copy?: string | null
          advertiser_name?: string | null
          campaign_stage?: string | null
          created_at?: string | null
          creative_type?: string | null
          cta_button?: string | null
          date_active?: string | null
          destination_url?: string | null
          funnel_override?: string | null
          funnel_type?: string | null
          id?: string
          library_id?: string
          stage_confidence?: number | null
          stage_override?: string | null
        }
        Relationships: []
      }
      alert_log: {
        Row: {
          alert_key: string
          brand: string
          brand_id: string | null
          campaign_id: string | null
          created_at: string
          dry_run: boolean
          id: string
          message_text: string
          payload_json: Json
          sent_at: string
          telegram_message_id: string | null
          type: string
        }
        Insert: {
          alert_key: string
          brand: string
          brand_id?: string | null
          campaign_id?: string | null
          created_at?: string
          dry_run?: boolean
          id?: string
          message_text: string
          payload_json?: Json
          sent_at?: string
          telegram_message_id?: string | null
          type: string
        }
        Update: {
          alert_key?: string
          brand?: string
          brand_id?: string | null
          campaign_id?: string | null
          created_at?: string
          dry_run?: boolean
          id?: string
          message_text?: string
          payload_json?: Json
          sent_at?: string
          telegram_message_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_log_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          color: string | null
          created_at: string
          id: string
          ig_user_id: string | null
          logo_url: string | null
          name: string
          repliz_ig_account_id: string | null
          scalev_store_id: string | null
          slug: string
          status: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          ig_user_id?: string | null
          logo_url?: string | null
          name: string
          repliz_ig_account_id?: string | null
          scalev_store_id?: string | null
          slug: string
          status?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          ig_user_id?: string | null
          logo_url?: string | null
          name?: string
          repliz_ig_account_id?: string | null
          scalev_store_id?: string | null
          slug?: string
          status?: string
        }
        Relationships: []
      }
      campaign_kpi_targets: {
        Row: {
          brand: string
          brand_id: string | null
          campaign_id: string
          created_at: string | null
          id: string
          kpi_type: string
          set_by: string | null
          target_value: number
        }
        Insert: {
          brand: string
          brand_id?: string | null
          campaign_id: string
          created_at?: string | null
          id?: string
          kpi_type: string
          set_by?: string | null
          target_value: number
        }
        Update: {
          brand?: string
          brand_id?: string | null
          campaign_id?: string
          created_at?: string | null
          id?: string
          kpi_type?: string
          set_by?: string | null
          target_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_kpi_targets_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_snapshots: {
        Row: {
          ad_id: string
          ad_name: string | null
          adset_id: string
          adset_name: string | null
          brand: string
          brand_id: string | null
          campaign_id: string
          campaign_name: string
          clicks: number | null
          cpl: number | null
          cpm: number | null
          cpp: number | null
          ctr: number | null
          date_start: string
          date_stop: string
          fetched_at: string | null
          frequency: number | null
          id: string
          impressions: number | null
          leads: number | null
          level: string
          purchase_value: number | null
          purchases: number | null
          reach: number | null
          roas: number | null
          spend: number | null
          status: string | null
        }
        Insert: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string
          adset_name?: string | null
          brand: string
          brand_id?: string | null
          campaign_id: string
          campaign_name: string
          clicks?: number | null
          cpl?: number | null
          cpm?: number | null
          cpp?: number | null
          ctr?: number | null
          date_start: string
          date_stop: string
          fetched_at?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          level: string
          purchase_value?: number | null
          purchases?: number | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          status?: string | null
        }
        Update: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string
          adset_name?: string | null
          brand?: string
          brand_id?: string | null
          campaign_id?: string
          campaign_name?: string
          clicks?: number | null
          cpl?: number | null
          cpm?: number | null
          cpp?: number | null
          ctr?: number | null
          date_start?: string
          date_stop?: string
          fetched_at?: string | null
          frequency?: number | null
          id?: string
          impressions?: number | null
          leads?: number | null
          level?: string
          purchase_value?: number | null
          purchases?: number | null
          reach?: number | null
          roas?: number | null
          spend?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_snapshots_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      contents: {
        Row: {
          asset_link: string | null
          brand_id: string
          caption: string | null
          comments: number | null
          created_at: string
          cta: string | null
          curator_notes: string | null
          engagement_synced_at: string | null
          format: string
          hook: string | null
          id: string
          interaction: number | null
          likes: number | null
          objective: string
          pic_id: string
          post_link: string | null
          publish_date: string | null
          reach: number | null
          repliz_schedule_id: string | null
          repliz_status: string | null
          saved: number | null
          shares: number | null
          status: string
          task_id: string | null
          theme: string | null
          title: string
          updated_at: string
          validation_status: string
          views: number | null
        }
        Insert: {
          asset_link?: string | null
          brand_id: string
          caption?: string | null
          comments?: number | null
          created_at?: string
          cta?: string | null
          curator_notes?: string | null
          engagement_synced_at?: string | null
          format: string
          hook?: string | null
          id?: string
          interaction?: number | null
          likes?: number | null
          objective: string
          pic_id: string
          post_link?: string | null
          publish_date?: string | null
          reach?: number | null
          repliz_schedule_id?: string | null
          repliz_status?: string | null
          saved?: number | null
          shares?: number | null
          status?: string
          task_id?: string | null
          theme?: string | null
          title: string
          updated_at?: string
          validation_status?: string
          views?: number | null
        }
        Update: {
          asset_link?: string | null
          brand_id?: string
          caption?: string | null
          comments?: number | null
          created_at?: string
          cta?: string | null
          curator_notes?: string | null
          engagement_synced_at?: string | null
          format?: string
          hook?: string | null
          id?: string
          interaction?: number | null
          likes?: number | null
          objective?: string
          pic_id?: string
          post_link?: string | null
          publish_date?: string | null
          reach?: number | null
          repliz_schedule_id?: string | null
          repliz_status?: string | null
          saved?: number | null
          shares?: number | null
          status?: string
          task_id?: string | null
          theme?: string | null
          title?: string
          updated_at?: string
          validation_status?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contents_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_pic_id_fkey"
            columns: ["pic_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_view"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_reports: {
        Row: {
          blockers: string | null
          brand_id: string
          completed_work: string | null
          created_at: string
          id: string
          ideas_insights: string | null
          kpi_entries: Json | null
          notes: string | null
          plan_today: string | null
          proof_url: string | null
          report_date: string
          unfinished_work: string | null
          updated_at: string
          user_id: string
          work_link: string | null
        }
        Insert: {
          blockers?: string | null
          brand_id: string
          completed_work?: string | null
          created_at?: string
          id?: string
          ideas_insights?: string | null
          kpi_entries?: Json | null
          notes?: string | null
          plan_today?: string | null
          proof_url?: string | null
          report_date: string
          unfinished_work?: string | null
          updated_at?: string
          user_id: string
          work_link?: string | null
        }
        Update: {
          blockers?: string | null
          brand_id?: string
          completed_work?: string | null
          created_at?: string
          id?: string
          ideas_insights?: string | null
          kpi_entries?: Json | null
          notes?: string | null
          plan_today?: string | null
          proof_url?: string | null
          report_date?: string
          unfinished_work?: string | null
          updated_at?: string
          user_id?: string
          work_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_tasks: {
        Row: {
          assignee_id: string
          brand_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          leader_url: string | null
          note: string | null
          reply: string | null
          reply_url: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id: string
          brand_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          leader_url?: string | null
          note?: string | null
          reply?: string | null
          reply_url?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          brand_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          leader_url?: string | null
          note?: string | null
          reply?: string | null
          reply_url?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fetch_status: {
        Row: {
          brand: string
          brand_id: string | null
          error_message: string | null
          last_fetched_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          brand_id?: string | null
          error_message?: string | null
          last_fetched_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          brand_id?: string | null
          error_message?: string | null
          last_fetched_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fetch_status_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_account_insights: {
        Row: {
          brand_id: string
          created_at: string
          dm_count: number | null
          engagement_rate: number | null
          followers: number | null
          follows_count: number | null
          id: string
          impressions: number | null
          insight_date: string
          link_clicks: number | null
          notes: string | null
          profile_visits: number | null
          reach: number | null
          total_comments: number | null
          total_likes: number | null
          total_saves: number | null
          total_shares: number | null
          unfollows_count: number | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          dm_count?: number | null
          engagement_rate?: number | null
          followers?: number | null
          follows_count?: number | null
          id?: string
          impressions?: number | null
          insight_date: string
          link_clicks?: number | null
          notes?: string | null
          profile_visits?: number | null
          reach?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_saves?: number | null
          total_shares?: number | null
          unfollows_count?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          dm_count?: number | null
          engagement_rate?: number | null
          followers?: number | null
          follows_count?: number | null
          id?: string
          impressions?: number | null
          insight_date?: string
          link_clicks?: number | null
          notes?: string | null
          profile_visits?: number | null
          reach?: number | null
          total_comments?: number | null
          total_likes?: number | null
          total_saves?: number | null
          total_shares?: number | null
          unfollows_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_account_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      instagram_content_insights: {
        Row: {
          brand_id: string
          comments: number | null
          content_id: string
          created_at: string
          dm_generated: number | null
          evaluation_notes: string | null
          id: string
          impressions: number | null
          insight_date: string
          likes: number | null
          link_clicks: number | null
          performance_status: string | null
          profile_visits: number | null
          reach: number | null
          saves: number | null
          shares: number | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          comments?: number | null
          content_id: string
          created_at?: string
          dm_generated?: number | null
          evaluation_notes?: string | null
          id?: string
          impressions?: number | null
          insight_date: string
          likes?: number | null
          link_clicks?: number | null
          performance_status?: string | null
          profile_visits?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          comments?: number | null
          content_id?: string
          created_at?: string
          dm_generated?: number | null
          evaluation_notes?: string | null
          id?: string
          impressions?: number | null
          insight_date?: string
          likes?: number | null
          link_clicks?: number | null
          performance_status?: string | null
          profile_visits?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instagram_content_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_content_insights_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_results: {
        Row: {
          achievement_percentage: number
          actual_value: number
          brand_id: string
          created_at: string
          id: string
          input_type: string
          kpi_id: string
          notes: string | null
          period_end: string
          period_start: string
          target_value: number
          updated_at: string
          updated_by: string | null
          user_id: string
          weighted_score: number
        }
        Insert: {
          achievement_percentage: number
          actual_value: number
          brand_id: string
          created_at?: string
          id?: string
          input_type: string
          kpi_id: string
          notes?: string | null
          period_end: string
          period_start: string
          target_value: number
          updated_at?: string
          updated_by?: string | null
          user_id: string
          weighted_score: number
        }
        Update: {
          achievement_percentage?: number
          actual_value?: number
          brand_id?: string
          created_at?: string
          id?: string
          input_type?: string
          kpi_id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          target_value?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
          weighted_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpi_results_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_results_kpi_id_fkey"
            columns: ["kpi_id"]
            isOneToOne: false
            referencedRelation: "kpis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_results_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpi_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          brand_id: string
          calculation_method: string
          category: string
          created_at: string
          data_source_config: Json | null
          description: string | null
          id: string
          is_active: boolean
          max_score_cap: number | null
          name: string
          period: string
          role_id: string | null
          target_value: number
          unit: string
          updated_at: string
          user_id: string | null
          weight: number
        }
        Insert: {
          brand_id: string
          calculation_method: string
          category: string
          created_at?: string
          data_source_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_score_cap?: number | null
          name: string
          period: string
          role_id?: string | null
          target_value: number
          unit: string
          updated_at?: string
          user_id?: string | null
          weight: number
        }
        Update: {
          brand_id?: string
          calculation_method?: string
          category?: string
          created_at?: string
          data_source_config?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_score_cap?: number | null
          name?: string
          period?: string
          role_id?: string | null
          target_value?: number
          unit?: string
          updated_at?: string
          user_id?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "kpis_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_ads_daily_spend: {
        Row: {
          brand_id: string | null
          campaign_count: number | null
          id: string
          leads: number | null
          purchase_value: number | null
          purchases: number | null
          roas: number | null
          spend: number | null
          spend_date: string | null
          synced_at: string | null
        }
        Insert: {
          brand_id?: string | null
          campaign_count?: number | null
          id?: string
          leads?: number | null
          purchase_value?: number | null
          purchases?: number | null
          roas?: number | null
          spend?: number | null
          spend_date?: string | null
          synced_at?: string | null
        }
        Update: {
          brand_id?: string | null
          campaign_count?: number | null
          id?: string
          leads?: number | null
          purchase_value?: number | null
          purchases?: number | null
          roas?: number | null
          spend?: number | null
          spend_date?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meta_ads_daily_spend_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_manual_sales: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string | null
          gross_revenue: number
          id: string
          notes: string | null
          product_name: string
          qty: number
          sales_date: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by?: string | null
          gross_revenue: number
          id?: string
          notes?: string | null
          product_name: string
          qty?: number
          sales_date?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string | null
          gross_revenue?: number
          id?: string
          notes?: string | null
          product_name?: string
          qty?: number
          sales_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_manual_sales_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_manual_sales_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      productivity_scores: {
        Row: {
          brand_id: string
          created_at: string
          deadline_accuracy_score: number
          final_score: number
          id: string
          initiative_score: number | null
          kpi_score: number
          period_end: string
          period_start: string
          quality_score: number | null
          status: string
          task_completion_score: number
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          deadline_accuracy_score?: number
          final_score?: number
          id?: string
          initiative_score?: number | null
          kpi_score?: number
          period_end: string
          period_start: string
          quality_score?: number | null
          status?: string
          task_completion_score?: number
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          deadline_accuracy_score?: number
          final_score?: number
          id?: string
          initiative_score?: number | null
          kpi_score?: number
          period_end?: string
          period_start?: string
          quality_score?: number | null
          status?: string
          task_completion_score?: number
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "productivity_scores_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productivity_scores_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productivity_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          name: string
          price: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          name: string
          price: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          name?: string
          price?: number
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      repliz_chat_meta: {
        Row: {
          assignee_id: string | null
          chat_id: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          chat_id: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          chat_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repliz_chat_meta_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      repliz_comment_meta: {
        Row: {
          assignee_id: string | null
          comment_id: string
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          comment_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          comment_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "repliz_comment_meta_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repliz_comment_meta_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          permissions: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          permissions?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          permissions?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      sales_records: {
        Row: {
          brand_id: string
          channel: string | null
          created_at: string
          discount: number
          gross_revenue: number | null
          id: string
          net_revenue: number | null
          notes: string | null
          order_count: number
          product_id: string
          product_price: number
          quantity: number
          sales_date: string
          source: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          channel?: string | null
          created_at?: string
          discount?: number
          gross_revenue?: number | null
          id?: string
          net_revenue?: number | null
          notes?: string | null
          order_count: number
          product_id: string
          product_price: number
          quantity: number
          sales_date: string
          source: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          channel?: string | null
          created_at?: string
          discount?: number
          gross_revenue?: number | null
          id?: string
          net_revenue?: number | null
          notes?: string | null
          order_count?: number
          product_id?: string
          product_price?: number
          quantity?: number
          sales_date?: string
          source?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_records_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_records_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scalev_orders: {
        Row: {
          brand_id: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          gross_revenue: number | null
          id: string
          is_spam: boolean | null
          net_payment_revenue: number | null
          order_date: string | null
          order_id: string | null
          payment_fee: number | null
          payment_method: string | null
          scalev_fee: number | null
          scalev_id: string | null
          service_fee: number | null
          status: string | null
          synced_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          gross_revenue?: number | null
          id?: string
          is_spam?: boolean | null
          net_payment_revenue?: number | null
          order_date?: string | null
          order_id?: string | null
          payment_fee?: number | null
          payment_method?: string | null
          scalev_fee?: number | null
          scalev_id?: string | null
          service_fee?: number | null
          status?: string | null
          synced_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          gross_revenue?: number | null
          id?: string
          is_spam?: boolean | null
          net_payment_revenue?: number | null
          order_date?: string | null
          order_id?: string | null
          payment_fee?: number | null
          payment_method?: string | null
          scalev_fee?: number | null
          scalev_id?: string | null
          service_fee?: number | null
          status?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scalev_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      scalev_products: {
        Row: {
          brand_id: string | null
          created_at: string | null
          id: string
          name: string | null
          price: number | null
          scalev_id: string | null
          slug: string | null
          status: string | null
          stock: number | null
          synced_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          price?: number | null
          scalev_id?: string | null
          slug?: string | null
          status?: string | null
          stock?: number | null
          synced_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          price?: number | null
          scalev_id?: string | null
          slug?: string | null
          status?: string | null
          stock?: number | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scalev_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      scalev_webhook_events: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          processed_at: string | null
          processed_status: string
          raw_payload: Json
          received_at: string
          scalev_unique_id: string | null
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          processed_at?: string | null
          processed_status?: string
          raw_payload?: Json
          received_at?: string
          scalev_unique_id?: string | null
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          processed_at?: string | null
          processed_status?: string
          raw_payload?: Json
          received_at?: string
          scalev_unique_id?: string | null
        }
        Relationships: []
      }
      score_settings: {
        Row: {
          deadline_weight: number
          id: string
          initiative_weight: number
          kpi_weight: number
          quality_weight: number
          task_weight: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          deadline_weight?: number
          id?: string
          initiative_weight?: number
          kpi_weight?: number
          quality_weight?: number
          task_weight?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          deadline_weight?: number
          id?: string
          initiative_weight?: number
          kpi_weight?: number
          quality_weight?: number
          task_weight?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "score_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string
          attachment_url: string | null
          brand_id: string
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          estimated_hours: number | null
          id: string
          priority: string
          result_link: string | null
          revision_notes: string | null
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id: string
          attachment_url?: string | null
          brand_id: string
          category: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          result_link?: string | null
          revision_notes?: string | null
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string
          attachment_url?: string | null
          brand_id?: string
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: string
          result_link?: string | null
          revision_notes?: string | null
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          joined_at: string | null
          name: string
          role_id: string
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          joined_at?: string | null
          name: string
          role_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          joined_at?: string | null
          name?: string
          role_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reviews: {
        Row: {
          brand_id: string
          created_at: string
          created_by: string
          decision: string | null
          id: string
          instagram_summary: Json | null
          kpi_summary: Json | null
          leader_notes: string | null
          main_problem: string | null
          period_end: string
          period_start: string
          revenue_summary: Json | null
          task_summary: Json | null
          updated_at: string
        }
        Insert: {
          brand_id: string
          created_at?: string
          created_by: string
          decision?: string | null
          id?: string
          instagram_summary?: Json | null
          kpi_summary?: Json | null
          leader_notes?: string | null
          main_problem?: string | null
          period_end: string
          period_start: string
          revenue_summary?: Json | null
          task_summary?: Json | null
          updated_at?: string
        }
        Update: {
          brand_id?: string
          created_at?: string
          created_by?: string
          decision?: string | null
          id?: string
          instagram_summary?: Json | null
          kpi_summary?: Json | null
          leader_notes?: string | null
          main_problem?: string | null
          period_end?: string
          period_start?: string
          revenue_summary?: Json | null
          task_summary?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reviews_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reviews_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      account_insight_view: {
        Row: {
          brand_id: string | null
          created_at: string | null
          dm_count: number | null
          engagement_rate: number | null
          follower_growth: number | null
          followers: number | null
          follows_count: number | null
          id: string | null
          impressions: number | null
          insight_date: string | null
          link_clicks: number | null
          notes: string | null
          profile_visits: number | null
          reach: number | null
          total_comments: number | null
          total_likes: number | null
          total_saves: number | null
          total_shares: number | null
          unfollows_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_account_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      content_insight_view: {
        Row: {
          brand_id: string | null
          comments: number | null
          content_id: string | null
          created_at: string | null
          dm_generated: number | null
          engagement_rate: number | null
          evaluation_notes: string | null
          id: string | null
          impressions: number | null
          insight_date: string | null
          likes: number | null
          link_clicks: number | null
          performance_status: string | null
          profile_visits: number | null
          reach: number | null
          saves: number | null
          shares: number | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          comments?: number | null
          content_id?: string | null
          created_at?: string | null
          dm_generated?: number | null
          engagement_rate?: never
          evaluation_notes?: string | null
          id?: string | null
          impressions?: number | null
          insight_date?: string | null
          likes?: number | null
          link_clicks?: number | null
          performance_status?: string | null
          profile_visits?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          comments?: number | null
          content_id?: string | null
          created_at?: string | null
          dm_generated?: number | null
          engagement_rate?: never
          evaluation_notes?: string | null
          id?: string | null
          impressions?: number | null
          insight_date?: string | null
          likes?: number | null
          link_clicks?: number | null
          performance_status?: string | null
          profile_visits?: number | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "instagram_content_insights_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instagram_content_insights_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "contents"
            referencedColumns: ["id"]
          },
        ]
      }
      extra_tasks_view: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          brand_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string | null
          leader_url: string | null
          note: string | null
          reply: string | null
          reply_url: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "extra_tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extra_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      scalev_orders_safe: {
        Row: {
          brand_id: string | null
          created_at: string | null
          gross_revenue: number | null
          id: string | null
          is_spam: boolean | null
          net_payment_revenue: number | null
          order_date: string | null
          order_id: string | null
          payment_fee: number | null
          payment_method: string | null
          scalev_fee: number | null
          scalev_id: string | null
          service_fee: number | null
          status: string | null
          synced_at: string | null
        }
        Insert: {
          brand_id?: string | null
          created_at?: string | null
          gross_revenue?: number | null
          id?: string | null
          is_spam?: boolean | null
          net_payment_revenue?: number | null
          order_date?: string | null
          order_id?: string | null
          payment_fee?: number | null
          payment_method?: string | null
          scalev_fee?: number | null
          scalev_id?: string | null
          service_fee?: number | null
          status?: string | null
          synced_at?: string | null
        }
        Update: {
          brand_id?: string | null
          created_at?: string | null
          gross_revenue?: number | null
          id?: string | null
          is_spam?: boolean | null
          net_payment_revenue?: number | null
          order_date?: string | null
          order_id?: string | null
          payment_fee?: number | null
          payment_method?: string | null
          scalev_fee?: number | null
          scalev_id?: string | null
          service_fee?: number | null
          status?: string | null
          synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scalev_orders_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks_view: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          attachment_url: string | null
          brand_id: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deadline: string | null
          description: string | null
          estimated_hours: number | null
          id: string | null
          is_overdue: boolean | null
          priority: string | null
          result_link: string | null
          revision_notes: string | null
          status: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          actual_hours?: number | null
          assignee_id?: string | null
          attachment_url?: string | null
          brand_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string | null
          is_overdue?: never
          priority?: string | null
          result_link?: string | null
          revision_notes?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          actual_hours?: number | null
          assignee_id?: string | null
          attachment_url?: string | null
          brand_id?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          estimated_hours?: number | null
          id?: string | null
          is_overdue?: never
          priority?: string | null
          result_link?: string | null
          revision_notes?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      close_weekly_review: { Args: { p_review_id: string }; Returns: undefined }
      compute_kpi_actual: {
        Args: {
          p_brand_id?: string
          p_end: string
          p_kpi_id: string
          p_start: string
          p_user_id: string
        }
        Returns: number
      }
      compute_productivity_score:
        | {
            Args: { p_end: string; p_start: string; p_user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              p_brand_id: string
              p_end: string
              p_start: string
              p_user_id: string
            }
            Returns: undefined
          }
      current_user_role: { Args: never; Returns: string }
      get_product_sold: {
        Args: { p_brand_id?: string; p_end: string; p_start: string }
        Returns: {
          channel: string
          order_count: number
          product_id: string
          product_name: string
          quantity: number
          sales_date: string
        }[]
      }
      jakarta_date: { Args: { ts: string }; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
