-- K-1 (bagian TULIS) — JANGAN APPLY sampai dikonfirmasi.
--
-- Cek dulu: apa yang menulis ke campaign_snapshots, ads_detail,
-- campaign_kpi_targets, alert_log, fetch_status (proses di luar repo ini —
-- n8n, Apps Script, cron server lain, dll)? Kalau proses itu pakai ANON KEY,
-- ganti ke SERVICE ROLE KEY dulu, baru migration ini boleh di-apply — kalau
-- tidak, sync akan berhenti diam-diam begitu policy INSERT/UPDATE anon dicabut.

DROP POLICY IF EXISTS anon_insert_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_update_ads_detail   ON public.ads_detail;
DROP POLICY IF EXISTS anon_insert_kpi_targets  ON public.campaign_kpi_targets;
DROP POLICY IF EXISTS anon_update_kpi_targets  ON public.campaign_kpi_targets;

-- Cabut hak tulis anon di SELURUH schema — tulis cuma boleh service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM anon;
