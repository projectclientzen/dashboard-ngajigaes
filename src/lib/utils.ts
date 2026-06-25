import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns'
import { id } from 'date-fns/locale'

// ─── SHADCN UTIL ─────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── TIMEZONE WIB (Asia/Jakarta) ─────────────────────────────

/**
 * Ambil tanggal WIB dari timestamp (YYYY-MM-DD)
 */
export function toJakartaDate(ts: string | Date): string {
  const date = typeof ts === 'string' ? parseISO(ts) : ts
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Tanggal hari ini di WIB (YYYY-MM-DD)
 */
export function todayJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

// ─── FORMAT DATE ─────────────────────────────────────────────

/**
 * Format tanggal untuk display
 * @example formatDate('2025-01-15') => '15 Jan 2025'
 */
export function formatDate(dateStr: string, fmt = 'd MMM yyyy'): string {
  try {
    return format(parseISO(dateStr), fmt, { locale: id })
  } catch {
    return dateStr
  }
}

/**
 * Format date-time dengan jam WIB
 */
export function formatDateTime(ts: string): string {
  try {
    return (
      new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parseISO(ts)) + ' WIB'
    )
  } catch {
    return ts
  }
}

/**
 * Format relatif: 'Hari ini', 'Kemarin', '3 hari lalu'
 */
export function formatRelativeDate(dateStr: string): string {
  const today = new Date(todayJakarta())
  const target = new Date(dateStr)
  const diffDays = Math.floor(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diffDays === 0) return 'Hari ini'
  if (diffDays === 1) return 'Kemarin'
  if (diffDays > 0 && diffDays <= 7) return `${diffDays} hari lalu`
  return formatDate(dateStr)
}

// ─── FORMAT RUPIAH ───────────────────────────────────────────

/**
 * Format angka ke Rupiah
 * @example formatRupiah(150000) => 'Rp 150.000'
 * @example formatRupiah(1500000, true) => 'Rp 1.5jt'
 */
export function formatRupiah(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`
    if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
    if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(0)}rb`
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

// ─── FORMAT PERCENT ──────────────────────────────────────────

/**
 * Format angka ke persen
 * @example formatPercent(87.5) => '87.5%'
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format angka dengan separator ribuan
 * @example formatNumber(12345) => '12.345'
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value)
}

// ─── WEEK / MONTH RANGE ──────────────────────────────────────

/**
 * Range minggu WIB (Senin-Minggu) dari tanggal tertentu
 */
export function getWeekRange(dateStr: string): { start: string; end: string } {
  const date = parseISO(dateStr)
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

/**
 * Range minggu berjalan (WIB)
 */
export function currentWeekRange(): { start: string; end: string } {
  return getWeekRange(todayJakarta())
}

/**
 * Range bulan berjalan
 */
export function currentMonthRange(): { start: string; end: string } {
  const today = new Date(todayJakarta())
  const start = new Date(today.getFullYear(), today.getMonth(), 1)
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  }
}

// ─── KPI CALCULATIONS ────────────────────────────────────────

/**
 * Hitung achievement percentage
 */
export function calcAchievement(actual: number, target: number): number {
  if (target <= 0) return 0
  return (actual / target) * 100
}

/**
 * Hitung weighted score dengan cap
 */
export function calcWeightedScore(
  actual: number,
  target: number,
  weight: number,
  maxCap = 100
): number {
  const achievement = calcAchievement(actual, target)
  return (Math.min(achievement, maxCap) * weight) / 100
}

/**
 * Hitung engagement rate Instagram
 * Fallback: reach -> impressions -> 0
 */
export function calcEngagementRate(
  likes: number,
  comments: number,
  saves: number,
  shares: number,
  reach: number | null | undefined,
  impressions: number | null | undefined
): number {
  const interactions = likes + comments + saves + shares
  if (reach && reach > 0) return (interactions / reach) * 100
  if (impressions && impressions > 0) return (interactions / impressions) * 100
  return 0
}

/**
 * Map final score ke status
 */
export function scoreToStatus(
  finalScore: number
): 'excellent' | 'good' | 'need_improvement' | 'warning' | 'critical' {
  if (finalScore >= 90) return 'excellent'
  if (finalScore >= 80) return 'good'
  if (finalScore >= 70) return 'need_improvement'
  if (finalScore >= 60) return 'warning'
  return 'critical'
}

// ─── MISC ─────────────────────────────────────────────────────

/**
 * Cek apakah task overdue
 */
export function isOverdue(deadline: string | null, status: string): boolean {
  if (!deadline) return false
  if (status === 'done' || status === 'cancelled') return false
  return new Date(deadline) < new Date()
}

/**
 * Inisial nama untuk avatar fallback
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

/**
 * Truncate teks panjang
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength) + '…'
}
