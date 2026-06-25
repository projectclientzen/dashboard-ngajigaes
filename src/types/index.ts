// ============================================================
// NGAJIGAES DASHBOARD — Type Contracts
// Sesuai BE Spec v2 (02_BE_Spec_Ngajigaes_Dashboard.md)
// ============================================================

// ─── AUTH & USERS ────────────────────────────────────────────

export type RoleName = 'leader' | 'feed_socmed' | 'reels_ads' | 'curator'

export interface Role {
  id: string
  name: RoleName
  description: string | null
  permissions: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  name: string
  email: string
  role_id: string
  avatar_url: string | null
  status: 'active' | 'inactive'
  joined_at: string | null
  created_at: string
  updated_at: string
  // join
  role?: Role
}

// ─── TASKS ───────────────────────────────────────────────────

export type TaskStatus =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'need_review'
  | 'revision'
  | 'done'
  | 'blocked'
  | 'cancelled'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string | null
  category: string
  assignee_id: string
  created_by: string
  status: TaskStatus
  priority: TaskPriority
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
  // join
  assignee?: User
  creator?: User
  comments?: TaskComment[]
}

export interface TaskView extends Task {
  is_overdue: boolean
}

export interface TaskComment {
  id: string
  task_id: string
  user_id: string
  comment: string
  created_at: string
  updated_at: string
  // join
  user?: User
}

// ─── DAILY REPORTS ───────────────────────────────────────────

export interface DailyReport {
  id: string
  user_id: string
  report_date: string // date
  plan_today: string | null
  completed_work: string | null
  unfinished_work: string | null
  blockers: string | null
  ideas_insights: string | null
  notes: string | null
  work_link: string | null
  created_at: string
  updated_at: string
  // join
  user?: User
}

// ─── KPI ─────────────────────────────────────────────────────

export type KpiPeriod = 'daily' | 'weekly' | 'monthly' | 'custom'
export type KpiCalculationMethod = 'manual' | 'task' | 'content' | 'sales' | 'instagram'

export interface KpiDataSourceConfig {
  // task / content
  filters?: {
    category?: string[]
    status?: string[]
    format?: string[]
    source?: string[]
  }
  // sales
  metric?: string
  // instagram
  aggregate?: 'sum' | 'avg' | 'last'
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
  weight: number
  period: KpiPeriod
  calculation_method: KpiCalculationMethod
  data_source_config: KpiDataSourceConfig | null
  max_score_cap: number
  is_active: boolean
  created_at: string
  updated_at: string
  // join
  role?: Role
  user?: User
}

export interface KpiResult {
  id: string
  kpi_id: string
  user_id: string
  period_start: string // date
  period_end: string   // date
  target_value: number
  actual_value: number
  achievement_percentage: number
  weighted_score: number
  input_type: 'manual' | 'automatic'
  notes: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  // join
  kpi?: Kpi
}

// Live KPI saat ini (dari RPC compute_kpi_actual)
export interface KpiLive {
  kpi: Kpi
  actual_value: number
  achievement_percentage: number
  weighted_score: number
}

// ─── PRODUCTIVITY SCORES ─────────────────────────────────────

export type ScoreStatus =
  | 'excellent'
  | 'good'
  | 'need_improvement'
  | 'warning'
  | 'critical'

export interface ProductivityScore {
  id: string
  user_id: string
  period_start: string // date
  period_end: string   // date
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
  // join
  user?: User
}

export interface ScoreSettings {
  id: string
  task_weight: number
  deadline_weight: number
  kpi_weight: number
  quality_weight: number
  initiative_weight: number
  updated_by: string | null
  updated_at: string
}

// ─── CONTENTS ────────────────────────────────────────────────

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

export interface Content {
  id: string
  title: string
  format: ContentFormat
  theme: string | null
  objective: ContentObjective
  status: ContentStatus
  pic_id: string
  publish_date: string | null
  asset_link: string | null
  post_link: string | null
  caption: string | null
  hook: string | null
  cta: string | null
  curator_notes: string | null
  validation_status: ValidationStatus
  task_id: string | null
  created_at: string
  updated_at: string
  // join
  pic?: User
  task?: Task
}

// ─── INSTAGRAM INSIGHTS ──────────────────────────────────────

export interface InstagramAccountInsight {
  id: string
  insight_date: string // date
  followers: number | null
  reach: number | null
  impressions: number | null
  profile_visits: number | null
  link_clicks: number | null
  dm_count: number | null
  total_likes: number | null
  total_comments: number | null
  total_saves: number | null
  total_shares: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

// View: account_insight_view (computed fields)
export interface AccountInsightView extends InstagramAccountInsight {
  follower_growth: number | null
  engagement_rate: number
}

export interface InstagramContentInsight {
  id: string
  content_id: string
  insight_date: string // date
  reach: number | null
  impressions: number | null
  likes: number | null
  comments: number | null
  saves: number | null
  shares: number | null
  profile_visits: number | null
  link_clicks: number | null
  dm_generated: number | null
  performance_status: 'winner' | 'average' | 'low' | null
  evaluation_notes: string | null
  created_at: string
  updated_at: string
}

// View: content_insight_view (computed)
export interface ContentInsightView extends InstagramContentInsight {
  engagement_rate: number
}

// ─── PRODUCTS & SALES ────────────────────────────────────────

export type ProductType = 'ebook' | 'bundle' | 'ecourse' | 'audiobook' | 'other'

export interface Product {
  id: string
  name: string
  type: ProductType
  price: number
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
}

export type SalesSource =
  | 'instagram_organic'
  | 'meta_ads'
  | 'whatsapp'
  | 'telegram'
  | 'affiliate'
  | 'broadcast'
  | 'unknown'
  | 'other'

// Full record — hanya Leader via RLS
export interface SalesRecord {
  id: string
  sales_date: string // date
  product_id: string
  order_count: number
  quantity: number
  product_price: number
  discount: number
  gross_revenue: number // GENERATED
  net_revenue: number   // GENERATED
  source: SalesSource
  channel: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // join
  product?: Product
}

// RPC return — untuk tim (tanpa kolom uang)
export interface ProductSoldRecord {
  sales_date: string
  product_id: string
  product_name: string
  order_count: number
  quantity: number
  channel: string | null
}

// ─── WEEKLY REVIEW & ACTION PLANS ────────────────────────────

export interface WeeklyReview {
  id: string
  period_start: string // date
  period_end: string   // date
  revenue_summary: Record<string, unknown> | null
  task_summary: Record<string, unknown> | null
  kpi_summary: Record<string, unknown> | null
  instagram_summary: Record<string, unknown> | null
  main_problem: string | null
  leader_notes: string | null
  decision: string | null
  created_by: string
  created_at: string
  updated_at: string
  // join
  creator?: User
  action_plans?: ActionPlan[]
}

export interface ActionPlan {
  id: string
  weekly_review_id: string | null
  title: string
  description: string | null
  pic_id: string
  deadline: string | null
  priority: TaskPriority
  status: TaskStatus
  converted_task_id: string | null
  created_at: string
  updated_at: string
  // join
  pic?: User
  converted_task?: Task
}

// ─── RPC PARAMS ──────────────────────────────────────────────

export interface DateRange {
  start: string // date YYYY-MM-DD
  end: string   // date YYYY-MM-DD
}

// ─── DASHBOARD SUMMARY ───────────────────────────────────────

// Leader dashboard summary
export interface LeaderDashboardData {
  period: DateRange
  total_gross_revenue: number
  total_net_revenue: number
  total_orders: number
  total_units_sold: number
  revenue_by_date: Array<{ date: string; gross: number; net: number }>
  revenue_by_source: Array<{ source: SalesSource; total: number }>
  team_ranking: Array<{
    user: User
    score: ProductivityScore
  }>
  tasks_summary: {
    total: number
    done: number
    overdue: number
  }
  content_summary: {
    published: number
    scheduled: number
    need_review: number
  }
}

// Tim dashboard summary
export interface TeamDashboardData {
  period: DateRange
  my_tasks: {
    total: number
    done: number
    in_progress: number
    overdue: number
  }
  my_score: ProductivityScore | null
  products_sold: Array<ProductSoldRecord>
  units_sold_by_product: Array<{ product_name: string; quantity: number }>
}
