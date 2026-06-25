// ============================================================
// MOCK DATA — Barrel export
// Sesuai FE Spec Section 12: dua skenario role + empty states
// ============================================================

export * from './users'
export * from './tasks'
export * from './kpi'
export * from './content'
export * from './sales'
export * from './reports'

// ─── SKENARIO MOCK ───────────────────────────────────────────
// Di-import di komponen yang butuh toggle role untuk testing masking

import { MOCK_LEADER, MOCK_TEAM_MEMBER } from './users'
import {
  MOCK_TASKS,
  MOCK_TASKS_EMPTY,
  MOCK_TASK_COMMENTS,
} from './tasks'
import {
  MOCK_KPI_RESULTS,
  MOCK_PRODUCTIVITY_SCORES,
  MOCK_SCORE_SETTINGS,
} from './kpi'
import {
  MOCK_CONTENTS,
  MOCK_ACCOUNT_INSIGHTS,
  MOCK_CONTENT_INSIGHTS,
} from './content'
import {
  MOCK_SALES_RECORDS,
  MOCK_PRODUCT_SOLD,
  MOCK_PRODUCTS,
} from './sales'
import {
  MOCK_DAILY_REPORTS,
  MOCK_MISSING_REPORTS,
  MOCK_WEEKLY_REVIEWS,
  MOCK_ACTION_PLANS,
} from './reports'

// Skenario Leader — semua data termasuk finansial
export const SCENARIO_LEADER = {
  currentUser: MOCK_LEADER,
  tasks: MOCK_TASKS,
  taskComments: MOCK_TASK_COMMENTS,
  kpiResults: MOCK_KPI_RESULTS,
  productivityScores: MOCK_PRODUCTIVITY_SCORES,
  scoreSettings: MOCK_SCORE_SETTINGS,
  contents: MOCK_CONTENTS,
  accountInsights: MOCK_ACCOUNT_INSIGHTS,
  contentInsights: MOCK_CONTENT_INSIGHTS,
  salesRecords: MOCK_SALES_RECORDS,   // hanya Leader
  productSold: MOCK_PRODUCT_SOLD,
  products: MOCK_PRODUCTS,
  dailyReports: MOCK_DAILY_REPORTS,
  missingReports: MOCK_MISSING_REPORTS,
  weeklyReviews: MOCK_WEEKLY_REVIEWS,
  actionPlans: MOCK_ACTION_PLANS,
}

// Skenario Tim — tanpa data finansial
export const SCENARIO_TEAM = {
  currentUser: MOCK_TEAM_MEMBER,
  tasks: MOCK_TASKS.filter((t) => t.assignee_id === MOCK_TEAM_MEMBER.id),
  taskComments: MOCK_TASK_COMMENTS,
  kpiResults: MOCK_KPI_RESULTS.filter((r) => r.user_id === MOCK_TEAM_MEMBER.id),
  productivityScores: MOCK_PRODUCTIVITY_SCORES.filter(
    (s) => s.user_id === MOCK_TEAM_MEMBER.id
  ),
  scoreSettings: MOCK_SCORE_SETTINGS,
  contents: MOCK_CONTENTS.filter((c) => c.pic_id === MOCK_TEAM_MEMBER.id),
  accountInsights: MOCK_ACCOUNT_INSIGHTS,
  contentInsights: MOCK_CONTENT_INSIGHTS,
  salesRecords: [],                   // kosong — tim tidak dapat ini
  productSold: MOCK_PRODUCT_SOLD,     // dari RPC, tanpa uang
  products: MOCK_PRODUCTS,
  dailyReports: MOCK_DAILY_REPORTS.filter((r) => r.user_id === MOCK_TEAM_MEMBER.id),
  missingReports: [],
  weeklyReviews: MOCK_WEEKLY_REVIEWS,
  actionPlans: MOCK_ACTION_PLANS,
}

// Skenario kosong — untuk test empty state
export const SCENARIO_EMPTY = {
  currentUser: MOCK_TEAM_MEMBER,
  tasks: MOCK_TASKS_EMPTY,
  taskComments: [],
  kpiResults: [],
  productivityScores: [],
  scoreSettings: MOCK_SCORE_SETTINGS,
  contents: [],
  accountInsights: [],
  contentInsights: [],
  salesRecords: [],
  productSold: [],
  products: [],
  dailyReports: [],
  missingReports: [],
  weeklyReviews: [],
  actionPlans: [],
}
