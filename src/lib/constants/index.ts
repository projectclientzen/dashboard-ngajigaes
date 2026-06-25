// ============================================================
// NGAJIGAES DASHBOARD — Constants
// Sumber tunggal untuk semua enum, status, kategori, label
// ============================================================

import type {
  RoleName,
  TaskStatus,
  TaskPriority,
  ContentFormat,
  ContentObjective,
  ContentStatus,
  ValidationStatus,
  KpiPeriod,
  KpiCalculationMethod,
  SalesSource,
  ScoreStatus,
  ProductType,
} from '@/types'

// ─── ROLES ───────────────────────────────────────────────────

export const ROLE_NAMES: Record<RoleName, string> = {
  leader: 'Leader',
  feed_socmed: 'Feed Socmed',
  reels_ads: 'Reels & Ads',
  curator: 'Curator',
}

export const ROLES: RoleName[] = ['leader', 'feed_socmed', 'reels_ads', 'curator']

// ─── TASK STATUS ─────────────────────────────────────────────

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'Todo',
  in_progress: 'In Progress',
  need_review: 'Need Review',
  revision: 'Revision',
  done: 'Done',
  blocked: 'Blocked',
  cancelled: 'Cancelled',
}

// Urutan kolom kanban
export const KANBAN_COLUMNS: TaskStatus[] = [
  'backlog',
  'todo',
  'in_progress',
  'need_review',
  'revision',
  'done',
  'blocked',
  'cancelled',
]

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: 'bg-slate-100 text-slate-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  need_review: 'bg-purple-100 text-purple-700',
  revision: 'bg-orange-100 text-orange-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

// ─── TASK PRIORITY ───────────────────────────────────────────

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}

export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export const TASK_CATEGORIES = [
  'Pembuatan Konten',
  'Riset',
  'Copywriting',
  'Desain',
  'Editing Video',
  'Iklan / Ads',
  'Admin',
  'Strategi',
  'Evaluasi',
  'Lainnya',
] as const

// ─── CONTENT FORMAT ──────────────────────────────────────────

export const CONTENT_FORMAT_LABELS: Record<ContentFormat, string> = {
  feed_single: 'Feed Single',
  carousel: 'Carousel',
  reels: 'Reels',
  story: 'Story',
  ads_creative: 'Ads Creative',
  live: 'Live',
  other: 'Lainnya',
}

export const CONTENT_FORMATS: ContentFormat[] = [
  'feed_single',
  'carousel',
  'reels',
  'story',
  'ads_creative',
  'live',
  'other',
]

// ─── CONTENT OBJECTIVE ───────────────────────────────────────

export const CONTENT_OBJECTIVE_LABELS: Record<ContentObjective, string> = {
  awareness: 'Awareness',
  engagement: 'Engagement',
  education: 'Edukasi',
  trust_building: 'Trust Building',
  lead_generation: 'Lead Generation',
  sales: 'Sales',
  community_building: 'Community Building',
}

export const CONTENT_OBJECTIVES: ContentObjective[] = [
  'awareness',
  'engagement',
  'education',
  'trust_building',
  'lead_generation',
  'sales',
  'community_building',
]

// ─── CONTENT STATUS ──────────────────────────────────────────

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  idea: 'Ide',
  research: 'Riset',
  draft: 'Draft',
  design: 'Desain',
  editing: 'Editing',
  need_review: 'Need Review',
  need_validation: 'Perlu Validasi',
  scheduled: 'Terjadwal',
  published: 'Published',
  evaluated: 'Evaluated',
  cancelled: 'Cancelled',
}

export const CONTENT_STATUSES: ContentStatus[] = [
  'idea',
  'research',
  'draft',
  'design',
  'editing',
  'need_review',
  'need_validation',
  'scheduled',
  'published',
  'evaluated',
  'cancelled',
]

export const CONTENT_STATUS_COLORS: Record<ContentStatus, string> = {
  idea: 'bg-slate-100 text-slate-600',
  research: 'bg-blue-100 text-blue-700',
  draft: 'bg-indigo-100 text-indigo-700',
  design: 'bg-violet-100 text-violet-700',
  editing: 'bg-yellow-100 text-yellow-700',
  need_review: 'bg-purple-100 text-purple-700',
  need_validation: 'bg-orange-100 text-orange-700',
  scheduled: 'bg-cyan-100 text-cyan-700',
  published: 'bg-green-100 text-green-700',
  evaluated: 'bg-teal-100 text-teal-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

// ─── VALIDATION STATUS ───────────────────────────────────────

export const VALIDATION_STATUS_LABELS: Record<ValidationStatus, string> = {
  not_needed: 'Tidak Perlu',
  waiting_validation: 'Menunggu Validasi',
  revision: 'Revisi',
  approved: 'Disetujui',
}

export const VALIDATION_STATUS_COLORS: Record<ValidationStatus, string> = {
  not_needed: 'bg-gray-100 text-gray-500',
  waiting_validation: 'bg-yellow-100 text-yellow-700',
  revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700',
}

// ─── KPI ─────────────────────────────────────────────────────

export const KPI_PERIOD_LABELS: Record<KpiPeriod, string> = {
  daily: 'Harian',
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  custom: 'Custom',
}

export const KPI_METHOD_LABELS: Record<KpiCalculationMethod, string> = {
  manual: 'Manual',
  task: 'Dari Task',
  content: 'Dari Konten',
  sales: 'Dari Sales',
  instagram: 'Dari Instagram',
}

export const KPI_INSTAGRAM_METRICS = [
  { value: 'reach', label: 'Reach' },
  { value: 'impressions', label: 'Impressions' },
  { value: 'engagement_rate', label: 'Engagement Rate' },
  { value: 'follower_growth', label: 'Pertumbuhan Follower' },
  { value: 'followers', label: 'Total Follower' },
] as const

export const KPI_SALES_METRICS = [
  { value: 'order_count', label: 'Jumlah Order' },
  { value: 'quantity', label: 'Unit Terjual' },
  // gross_revenue tidak ditampilkan ke tim
] as const

// ─── SCORE STATUS ────────────────────────────────────────────

export const SCORE_STATUS_LABELS: Record<ScoreStatus, string> = {
  excellent: 'Excellent',
  good: 'Good',
  need_improvement: 'Perlu Peningkatan',
  warning: 'Warning',
  critical: 'Kritis',
}

export const SCORE_STATUS_COLORS: Record<ScoreStatus, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-teal-100 text-teal-700',
  need_improvement: 'bg-yellow-100 text-yellow-700',
  warning: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
}

export const SCORE_THRESHOLDS = {
  excellent: 90,
  good: 80,
  need_improvement: 70,
  warning: 60,
} as const

// ─── SALES SOURCE ────────────────────────────────────────────

export const SALES_SOURCE_LABELS: Record<SalesSource, string> = {
  instagram_organic: 'Instagram Organik',
  meta_ads: 'Meta Ads',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
  affiliate: 'Affiliate',
  broadcast: 'Broadcast',
  unknown: 'Tidak Diketahui',
  other: 'Lainnya',
}

export const SALES_SOURCES: SalesSource[] = [
  'instagram_organic',
  'meta_ads',
  'whatsapp',
  'telegram',
  'affiliate',
  'broadcast',
  'unknown',
  'other',
]

// ─── PRODUCT TYPE ────────────────────────────────────────────

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  ebook: 'E-Book',
  bundle: 'Bundle',
  ecourse: 'E-Course',
  audiobook: 'Audiobook',
  other: 'Lainnya',
}

// ─── USER STATUS ─────────────────────────────────────────────

export const USER_STATUS_LABELS = {
  active: 'Aktif',
  inactive: 'Non-aktif',
} as const

// ─── INSTAGRAM PERFORMANCE ───────────────────────────────────

export const IG_PERFORMANCE_LABELS = {
  winner: 'Winner',
  average: 'Average',
  low: 'Low',
} as const

export const IG_PERFORMANCE_COLORS = {
  winner: 'bg-green-100 text-green-700',
  average: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
} as const
