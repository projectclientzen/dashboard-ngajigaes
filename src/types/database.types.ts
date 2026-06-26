// AUTO-GENERATED from Supabase schema — 2026-06-26
// Re-generate: supabase gen types typescript --project-id xnfnbfqtskgiutvhhjjo

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
      action_plans: {
        Row: {
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
      }
      contents: {
        Row: {
          asset_link: string | null
          caption: string | null
          created_at: string
          cta: string | null
          curator_notes: string | null
          format: string
          hook: string | null
          id: string
          objective: string
          pic_id: string
          post_link: string | null
          publish_date: string | null
          status: string
          task_id: string | null
          theme: string | null
          title: string
          updated_at: string
          validation_status: string
        }
        Insert: {
          asset_link?: string | null
          caption?: string | null
          created_at?: string
          cta?: string | null
          curator_notes?: string | null
          format: string
          hook?: string | null
          id?: string
          objective: string
          pic_id: string
          post_link?: string | null
          publish_date?: string | null
          status?: string
          task_id?: string | null
          theme?: string | null
          title: string
          updated_at?: string
          validation_status?: string
        }
        Update: {
          asset_link?: string | null
          caption?: string | null
          created_at?: string
          cta?: string | null
          curator_notes?: string | null
          format?: string
          hook?: string | null
          id?: string
          objective?: string
          pic_id?: string
          post_link?: string | null
          publish_date?: string | null
          status?: string
          task_id?: string | null
          theme?: string | null
          title?: string
          updated_at?: string
          validation_status?: string
        }
      }
      daily_reports: {
        Row: {
          blockers: string | null
          completed_work: string | null
          created_at: string
          id: string
          ideas_insights: string | null
          notes: string | null
          plan_today: string | null
          report_date: string
          unfinished_work: string | null
          updated_at: string
          user_id: string
          work_link: string | null
        }
        Insert: {
          blockers?: string | null
          completed_work?: string | null
          created_at?: string
          id?: string
          ideas_insights?: string | null
          notes?: string | null
          plan_today?: string | null
          report_date: string
          unfinished_work?: string | null
          updated_at?: string
          user_id: string
          work_link?: string | null
        }
        Update: {
          blockers?: string | null
          completed_work?: string | null
          created_at?: string
          id?: string
          ideas_insights?: string | null
          notes?: string | null
          plan_today?: string | null
          report_date?: string
          unfinished_work?: string | null
          updated_at?: string
          user_id?: string
          work_link?: string | null
        }
      }
      instagram_account_insights: {
        Row: {
          created_at: string
          dm_count: number | null
          followers: number | null
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          dm_count?: number | null
          followers?: number | null
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
          updated_at?: string
        }
        Update: {
          created_at?: string
          dm_count?: number | null
          followers?: number | null
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
          updated_at?: string
        }
      }
      instagram_content_insights: {
        Row: {
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
      }
      kpi_results: {
        Row: {
          achievement_percentage: number
          actual_value: number
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
      }
      kpis: {
        Row: {
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
      }
      productivity_scores: {
        Row: {
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
      }
      products: {
        Row: {
          created_at: string
          id: string
          name: string
          price: number
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          price: number
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          price?: number
          status?: string
          type?: string
          updated_at?: string
        }
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
      }
      sales_records: {
        Row: {
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
          channel?: string | null
          created_at?: string
          discount?: number
          id?: string
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
          channel?: string | null
          created_at?: string
          discount?: number
          id?: string
          notes?: string | null
          order_count?: number
          product_id?: string
          product_price?: number
          quantity?: number
          sales_date?: string
          source?: string
          updated_at?: string
        }
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
      }
      tasks: {
        Row: {
          actual_hours: number | null
          assignee_id: string
          attachment_url: string | null
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
      }
      weekly_reviews: {
        Row: {
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
      }
    }
    Views: {
      account_insight_view: {
        Row: {
          created_at: string | null
          dm_count: number | null
          engagement_rate: number | null
          follower_growth: number | null
          followers: number | null
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
          updated_at: string | null
        }
      }
      content_insight_view: {
        Row: {
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
      }
      tasks_view: {
        Row: {
          actual_hours: number | null
          assignee_id: string | null
          attachment_url: string | null
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
      }
    }
    Functions: {
      close_weekly_review: { Args: { p_review_id: string }; Returns: undefined }
      compute_kpi_actual: {
        Args: { p_end: string; p_kpi_id: string; p_start: string; p_user_id: string }
        Returns: number
      }
      compute_productivity_score: {
        Args: { p_end: string; p_start: string; p_user_id: string }
        Returns: undefined
      }
      current_user_role: { Args: never; Returns: string }
      get_product_sold: {
        Args: { p_end: string; p_start: string }
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
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
