import type { Role } from '@/types'

// ─── FINANCIAL GUARD (FE Spec Section 8) ─────────────────────
//
// SATU sumber kebenaran untuk semua masking finansial.
// Setiap komponen yang menampilkan uang WAJIB lewat gerbang ini.
// Backend tetap memblok via RPC + revoke — ini lapisan pertama FE.

/**
 * Apakah role ini boleh melihat data finansial?
 * (omzet, revenue, harga, gross/net, AOV, ROAS, simbol Rp)
 */
export function canViewFinancial(role: Role): boolean {
  return role === 'leader'
}

/**
 * Apakah role ini Leader?
 */
export function isLeader(role: Role): boolean {
  return role === 'leader'
}

/**
 * Apakah role ini Kurator?
 */
export function isCurator(role: Role): boolean {
  return role === 'curator'
}

/**
 * Apakah role ini tim (bukan leader)?
 */
export function isTeamMember(role: Role): boolean {
  return role !== 'leader'
}

/**
 * Daftar menu sidebar yang boleh diakses role ini.
 * Sesuai FE Spec Section 4.
 */
export function getAllowedMenus(role: Role): string[] {
  const base = [
    'dashboard',
    'tasks',
    'daily-reports',
    'kpi',
    'content-calendar',
    'weekly-review',
  ]

  if (role === 'leader') {
    return [
      ...base,
      'team-performance',
      'instagram-insight',
      'sales',
      'settings',
    ]
  }

  if (role === 'curator') {
    return [...base, 'product-sold']
  }

  if (role === 'feed_socmed') {
    return [...base, 'instagram-insight', 'product-sold']
  }

  // reels_ads
  return [...base, 'product-sold']
}

/**
 * Cek apakah route tertentu boleh diakses role.
 */
export function canAccessRoute(role: Role, pathname: string): boolean {
  const allowed = getAllowedMenus(role)
  const segment = pathname.split('/')[1] // ambil segmen pertama

  // Sales hanya leader
  if (segment === 'sales' && !isLeader(role)) return false
  // Team performance hanya leader
  if (segment === 'team-performance' && !isLeader(role)) return false
  // Settings hanya leader
  if (segment === 'settings' && !isLeader(role)) return false

  return allowed.some((m) => segment === m || pathname.startsWith(`/${m}`))
}
