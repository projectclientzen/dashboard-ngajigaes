// ============================================================
// NGAJIGAES DASHBOARD — Type Contracts
//
// Dua lapisan:
// 1. FE Contract (Section 11 FE Spec) — apa yang BE return, apa
//    yang FE terima. INI YANG MENGIKAT KEDUA SISI.
// 2. DB Types — raw row dari Supabase, hanya untuk internal BE.
//
// FE hanya import dari lapisan 1.
// ============================================================

// ─── SHARED PRIMITIVES ───────────────────────────────────────

export type Role = 'leader' | 'feed_socmed' | 'reels_ads' | 'curator'

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'need_review'
  | 'revision'
  | 'done'
  | 'blocked'
  | 'cancelled'

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type ContentFormat =
  | 'feed_single'
  | 'carousel'
  | 'reels'
  | 'story'
  | 'ads_creative'
  | 'live'
  | 'other'

export type ContentObjective =
  | 'awareness'
  | 'engagement'
  | 'education'
  | 'trust_building'
  | 'lead_generation'
  | 'sales'
  | 'community_building'

export type ContentStatus =
  | 'idea'
  | 'research'
  | 'draft'
  | 'design'
  | 'editing'
  | 'need_review'
  | 'need_validation'
  | 'scheduled'
  | 'published'
  | 'evaluated'
  | 'cancelled'

export type ValidationStatus =
  | 'not_needed'
  | 'waiting_validation'
  | 'revision'
  | 'approved'

export type ScoreStatus =
  | 'excellent'
  | 'good'
  | 'need_improvement'
  | 'warning'
  | 'critical'

export type KpiPeriod = 'daily' | 'weekly' | 'monthly' | 'custom'

export type KpiCalculationMethod =
  | 'manual'
  | 'task'
  | 'content'
  | 'sales'
  | 'instagram'

export type SalesSource =
  | 'instagram_organic'
  | 'meta_ads'
  | 'whatsapp'
  | 'telegram'
  | 'affiliate'
  | 'broadcast'
  | 'unknown'
  | 'other'

export type ProductType = 'ebook' | 'bundle' | 'ecourse' | 'audiobook' | 'other'

export type PerformanceStatus = 'winner' | 'average' | 'low'

// ─── FE CONTRACT TYPES (Section 11) ──────────────────────────
// Persis seperti yang BE harus return dan FE terima.
// Semua tanggal: ISO 8601 UTC string. Uang: number Rupiah.

export interface User {
  id: string
  name: string
  email: string
  role: Role                    // flattened — bukan role_id
  avatar_url: string | null
  status: 'active' | 'inactive'
  joined_at: string | null
}

export interface Task {
  id: string
  title: string
  description: string | null
  category: string
  assignee_id: string
  assignee_name: string         // denormalized
  created_by: string
  status: TaskStatus
  priority: Priority
  deadline: string | null
  completed_at: string | null
  is_overdue: boolean           // dihitung backend, WIB
  result_link: string | null
  revision_notes: string | null
  created_at: string
  updated_at: string
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  user_name: string             // denormalized
  comment: string
  created_at: string
}

export interface DailyReport {
  id: string
  user_id: string
  user_name: string             // denormalized
  report_date: string           // date WIB
  plan_today: string | null
  completed_work: string | null
  unfinished_work: string | null
  blockers: string | null
  ideas_insights: string | null
  notes: string | null
  work_link: string | null
}

export interface Kpi {
  id: string
  name: string
  description: string | null
  category: string
  role_id: string | null
  user_id: string | null
  target_value: number
  unit: string
  weight: number                // 0-100
  period: KpiPeriod
  calculation_method: KpiCalculationMethod
  is_active: boolean
}

export interface KpiResult {
  kpi_id: string
  kpi_name: string              // denormalized
  user_id: string
  period_start: string
  period_end: string
  target_value: number
  actual_value: number
  achievement_percentage: number  // bisa > 100
  weighted_score: number          // achievement di-cap 100, lalu x bobot
}

export interface ProductivityScore {
  user_id: string
  user_name: string             // denormalized
  period_start: string
  period_end: string
  task_completion_score: number
  deadline_accuracy_score: number
  kpi_score: number
  quality_score: number | null  // manual input
  initiative_score: number | null // manual input
  final_score: number
  status: ScoreStatus
}

export interface Content {
  id: string
  title: string
  format: ContentFormat
  theme: string | null
  objective: ContentObjective
  status: ContentStatus
  pic_id: string
  pic_name: string              // denormalized
  publish_date: string | null
  asset_link: string | null
  post_link: string | null
  caption: string | null
  hook: string | null
  cta: string | null
  curator_notes: string | null
  validation_status: ValidationStatus
  task_id: string | null
}

export interface AccountInsight {
  id: string
  insight_date: string
  followers: number | null
  follower_growth: number | null    // dihitung backend
  reach: number | null
  impressions: number | null
  profile_visits: number | null
  link_clicks: number | null
  dm_count: number | null
  total_likes: number | null
  total_comments: number | null
  total_saves: number | null
  total_shares: number | null
  engagement_rate: number | null    // dihitung backend
  notes: string | null
}

export interface ContentInsight {
  id: string
  content_id: string
  content_title: string             // denormalized
  insight_date: string
  reach: number | null
  impressions: number | null
  likes: number | null
  comments: number | null
  saves: number | null
  shares: number | null
  profile_visits: number | null
  link_clicks: number | null
  dm_generated: number | null
  engagement_rate: number | null    // dihitung backend
  performance_status: PerformanceStatus | null
  evaluation_notes: string | null
}

export interface Product {
  id: string
  name: string
  type: ProductType
  price: number
  status: 'active' | 'inactive'
}

// Leader only — query langsung ke sales_records via RLS
export interface SalesRecord {
  id: string
  sales_date: string
  product_id: string
  product_name: string          // denormalized
  order_count: number
  quantity: number
  product_price: number
  gross_revenue: number         // generated di DB
  discount: number
  net_revenue: number           // generated di DB
  source: SalesSource
  channel: string | null
  notes: string | null
}

// Tim — dari RPC get_product_sold, TANPA kolom uang
export interface ProductSold {
  sales_date: string
  product_id: string
  product_name: string
  order_count: number
  quantity: number
  channel: string | null
}

export interface WeeklyReview {
  id: string
  period_start: string
  period_end: string
  revenue_summary: Record<string, number> | null  // Leader only
  task_summary: Record<string, number> | null
  kpi_summary: Record<string, number> | null
  instagram_summary: Record<string, number> | null
  main_problem: string | null
  leader_notes: string | null
  decision: string | null
}

export interface ActionPlan {
  id: string
  weekly_review_id: string
  title: string
  description: string | null
  pic_id: string
  pic_name: string              // denormalized
  deadline: string | null
  priority: Priority
  status: TaskStatus
  converted_task_id: string | null
}

// ─── DASHBOARD SUMMARIES ─────────────────────────────────────

export interface DateRange {
  start: string   // YYYY-MM-DD
  end: string     // YYYY-MM-DD
}

// ScoreSettings — bisa dibaca semua role
export interface ScoreSettings {
  task_weight: number
  deadline_weight: number
  kpi_weight: number
  quality_weight: number
  initiative_weight: number
}

// ─── DB-LEVEL TYPES (internal, tidak untuk FE) ───────────────
// Dipakai hanya di lib/supabase/ dan server actions.
// FE tidak perlu import dari sini.

export namespace DB {
  export interface UsersRow {
    id: string
    name: string
    email: string
    role_id: string
    avatar_url: string | null
    status: string
    joined_at: string | null
    created_at: string
    updated_at: string
  }

  export interface RolesRow {
    id: string
    name: Role
    description: string | null
    permissions: unknown | null
    created_at: string
    updated_at: string
  }

  export interface TasksRow {
    id: string
    title: string
    description: string | null
    category: string
    assignee_id: string
    created_by: string
    status: TaskStatus
    priority: Priority
    deadline: string | null
    completed_at: string | null
    result_link: string | null
    attachment_url: string | null
    revision_notes: string | null
    estimated_hours: number | null
    actual_hours: number | null
    updated_by: string | null
    created_at: string
    updated_at: string
  }

  export interface KpisRow {
    id: string
    name: string
    description: string | null
    category: string
    role_id: string | null
    user_id: string | null
    target_value: number
    unit: string
    weight: number
    period: KpiPeriod
    calculation_method: KpiCalculationMethod
    data_source_config: unknown | null
    max_score_cap: number
    is_active: boolean
    created_at: string
    updated_at: string
  }

  export interface KpiResultsRow {
    id: string
    kpi_id: string
    user_id: string
    period_start: string
    period_end: string
    target_value: number
    actual_value: number
    achievement_percentage: number
    weighted_score: number
    input_type: 'manual' | 'automatic'
    notes: string | null
    updated_by: string | null
    created_at: string
    updated_at: string
  }

  export interface ProductivityScoresRow {
    id: string
    user_id: string
    period_start: string
    period_end: string
    task_completion_score: number
    deadline_accuracy_score: number
    kpi_score: number
    quality_score: number | null
    initiative_score: number | null
    final_score: number
    status: ScoreStatus
    updated_by: string | null
    created_at: string
    updated_at: string
  }

  export interface SalesRecordsRow {
    id: string
    sales_date: string
    product_id: string
    order_count: number
    quantity: number
    product_price: number
    discount: number
    gross_revenue: number
    net_revenue: number
    source: SalesSource
    channel: string | null
    notes: string | null
    created_at: string
    updated_at: string
  }
}
