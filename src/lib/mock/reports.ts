import type { DailyReport, WeeklyReview, ActionPlan } from '@/types'

const today = '2026-06-26'
const yesterday = '2026-06-25'

export const MOCK_DAILY_REPORTS: DailyReport[] = [
  {
    id: 'report-01',
    user_id: 'user-feed-01',
    user_name: 'Rina Kusuma',
    report_date: today,
    plan_today: 'Selesaikan draft slide carousel tips menabung, buat 3 caption post minggu depan',
    completed_work: 'Riset referensi carousel (20 akun), outline 7 slide sudah jadi',
    unfinished_work: null,
    blockers: null,
    ideas_insights: 'Format "before vs after" bisa dicoba untuk konten keuangan',
    notes: null,
    work_link: 'https://notion.so/example',
  },
  {
    id: 'report-02',
    user_id: 'user-reels-01',
    user_name: 'Bagas Pratama',
    report_date: today,
    plan_today: 'Lanjutkan editing reels promo bundling, submit untuk review',
    completed_work: 'Draft pertama reels selesai 80%',
    unfinished_work: 'Musik background belum dipilih karena harus cek copyright dulu',
    blockers: 'Butuh konfirmasi musik dari Zen sebelum bisa finalisasi',
    ideas_insights: null,
    notes: null,
    work_link: 'https://drive.google.com/example',
  },
  {
    id: 'report-03',
    user_id: 'user-feed-01',
    user_name: 'Rina Kusuma',
    report_date: yesterday,
    plan_today: 'Riset referensi carousel, outline konten minggu ini',
    completed_work: 'Selesai riset trend konten keuangan, list 20 referensi sudah di Notion',
    unfinished_work: null,
    blockers: null,
    ideas_insights: null,
    notes: null,
    work_link: 'https://notion.so/example',
  },
]

// User yang belum isi daily report hari ini
export const MOCK_MISSING_REPORTS: { user_id: string; user_name: string }[] = [
  { user_id: 'user-curator-01', user_name: 'Sari Dewi' },
]

export const MOCK_WEEKLY_REVIEWS: WeeklyReview[] = [
  {
    id: 'review-01',
    period_start: '2026-06-22',
    period_end: '2026-06-28',
    revenue_summary: {
      total_gross: 5730000,
      total_net: 5530000,
      total_orders: 70,
    },
    task_summary: {
      total: 8,
      done: 3,
      overdue: 1,
    },
    kpi_summary: {
      avg_achievement: 83.5,
      achieved: 3,
      not_achieved: 2,
    },
    instagram_summary: {
      avg_reach: 4200,
      avg_engagement: 3.8,
      follower_growth: 350,
    },
    main_problem: 'Satu reels terlambat karena masalah copyright musik. Perlu SOP musik yang lebih jelas.',
    leader_notes: 'Performa konten carousel Rina sangat bagus minggu ini. Bagas perlu lebih cepat dalam editing.',
    decision: 'Buat library musik bebas copyright internal. Rina buat 2 carousel/minggu sebagai standar.',
  },
]

export const MOCK_ACTION_PLANS: ActionPlan[] = [
  {
    id: 'ap-01',
    weekly_review_id: 'review-01',
    title: 'Buat library musik bebas copyright',
    description: 'Kumpulkan minimal 20 track dari pixabay, freemusicarchive, dan YouTube Audio Library',
    pic_id: 'user-reels-01',
    pic_name: 'Bagas Pratama',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'high',
    status: 'todo',
    converted_task_id: null,
  },
  {
    id: 'ap-02',
    weekly_review_id: 'review-01',
    title: 'Buat SOP produksi reels (termasuk aturan musik)',
    description: 'Dokumen SOP lengkap: checklist sebelum upload, format yang digunakan, panduan copyright',
    pic_id: 'user-leader-01',
    pic_name: 'Zen Ardiansyah',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    status: 'in_progress',
    converted_task_id: null,
  },
  {
    id: 'ap-03',
    weekly_review_id: 'review-01',
    title: 'Tingkatkan target konten Rina ke 6/minggu',
    description: 'Update KPI Rina dari 5 menjadi 6 konten/minggu mulai minggu depan',
    pic_id: 'user-leader-01',
    pic_name: 'Zen Ardiansyah',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    priority: 'medium',
    status: 'todo',
    converted_task_id: 'task-05',  // sudah diconvert
  },
]
