-- P-6: 4 view SECURITY DEFINER mem-bypass RLS pemanggil (advisor Supabase, level ERROR).
--
-- Investigasi pemakaian (grep src/) + cek RLS tabel dasar sebelum apply:
--
-- content_insight_view, account_insight_view (dipakai src/lib/queries/instagram.ts)
--   → tabel dasar (instagram_content_insights, instagram_account_insights)
--     kedua policy SELECT-nya `USING (true)` untuk semua yang login.
--     AMAN di-flip — tidak ada yang berubah untuk siapa pun.
--
-- extra_tasks_view (src/lib/queries/extra-tasks.ts)
--   → base policy extra_tasks_own_select sudah scope ke `assignee_id = auth.uid()`,
--     dan app SUDAH filter .eq('assignee_id', userId) di client untuk member
--     (Sidebar.tsx: `useExtraTasks(isLeader ? undefined : userId, brandId)`).
--     AMAN di-flip — RLS jadi menegakkan apa yang app sudah asumsikan.
--
-- tasks_view (src/lib/queries/tasks.ts) — TIDAK aman di-flip apa adanya.
--   Base policy tasks_own_select membatasi SELECT ke
--   `assignee_id = auth.uid() OR created_by = auth.uid()`. TAPI setiap
--   pemanggil useTasks() di seluruh repo (Task Board, Header notif, Sidebar
--   badge) SELALU memanggil dengan userId=undefined — lihat komentar
--   "Fix #4: semua tim lihat semua tasks (antar departemen)" di
--   src/app/(app)/tasks/page.tsx. Ini FITUR YANG DISENGAJA, bukan bug.
--   Flip security_invoker tanpa mengubah policy dasar akan membuat Task
--   Board kosong untuk semua non-leader — regresi nyata, bukan "membongkar
--   kebocoran". Makanya migration ini SEKALIAN melebarkan tasks_own_select
--   jadi team-wide SELECT (match perilaku yang sudah ada), baru flip view-nya.
--
-- JANGAN APPLY sebelum dikonfirmasi — terutama bagian tasks_own_select di bawah.

DROP POLICY IF EXISTS tasks_own_select ON public.tasks;
CREATE POLICY tasks_team_select ON public.tasks
  FOR SELECT TO authenticated USING (true);
-- tasks_own_update TIDAK diubah — tetap hanya assignee/creator yang boleh update.

ALTER VIEW public.tasks_view            SET (security_invoker = true);
ALTER VIEW public.extra_tasks_view      SET (security_invoker = true);
ALTER VIEW public.content_insight_view  SET (security_invoker = true);
ALTER VIEW public.account_insight_view  SET (security_invoker = true);
